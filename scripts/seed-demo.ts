import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

import { db } from '@/lib/db';
import { users, projects, pageviews } from '@/lib/db/schema';

const DEMO_EMAIL = 'demo@analyticos.app';
const DEMO_PASSWORD = 'demo-pass-2026';
const DEMO_NAME = 'Demo';
const DEMO_PROJECT_NAME = 'Acme Blog';
const DEMO_PROJECT_DOMAIN = 'acme-blog.example';
const DAYS = 30;

type Weighted = { weight: number };

const URLS: (Weighted & { path: string })[] = [
    { path: '/', weight: 35 },
    { path: '/blog/launching-acme', weight: 18 },
    { path: '/pricing', weight: 12 },
    { path: '/about', weight: 9 },
    { path: '/blog/why-we-built-this', weight: 8 },
    { path: '/blog/how-it-works', weight: 6 },
    { path: '/changelog', weight: 4 },
    { path: '/docs', weight: 3 },
    { path: '/contact', weight: 3 },
    { path: '/blog/our-roadmap', weight: 2 },
];

const REFERRERS: (Weighted & { url: string | null })[] = [
    { url: 'https://www.google.com', weight: 38 },
    { url: null, weight: 30 },
    { url: 'https://twitter.com', weight: 8 },
    { url: 'https://news.ycombinator.com', weight: 7 },
    { url: 'https://www.reddit.com', weight: 6 },
    { url: 'https://www.linkedin.com', weight: 4 },
    { url: 'https://duckduckgo.com', weight: 3 },
    { url: 'https://github.com', weight: 2 },
    { url: 'https://www.bing.com', weight: 2 },
];

const BROWSERS: (Weighted & { name: string })[] = [
    { name: 'Chrome', weight: 65 },
    { name: 'Safari', weight: 20 },
    { name: 'Firefox', weight: 8 },
    { name: 'Edge', weight: 7 },
];

const OSES: (Weighted & { name: string })[] = [
    { name: 'Windows', weight: 35 },
    { name: 'macOS', weight: 25 },
    { name: 'iOS', weight: 20 },
    { name: 'Android', weight: 15 },
    { name: 'Linux', weight: 5 },
];

const DEVICES: (Weighted & { name: string })[] = [
    { name: 'desktop', weight: 60 },
    { name: 'mobile', weight: 35 },
    { name: 'tablet', weight: 5 },
];

const COUNTRIES: (Weighted & { code: string })[] = [
    { code: 'US', weight: 28 },
    { code: 'GB', weight: 11 },
    { code: 'DE', weight: 9 },
    { code: 'FR', weight: 7 },
    { code: 'CA', weight: 6 },
    { code: 'AU', weight: 5 },
    { code: 'NL', weight: 4 },
    { code: 'BR', weight: 4 },
    { code: 'JP', weight: 4 },
    { code: 'IN', weight: 4 },
    { code: 'CZ', weight: 3 },
    { code: 'SE', weight: 3 },
    { code: 'ES', weight: 3 },
    { code: 'IT', weight: 3 },
    { code: 'PL', weight: 2 },
    { code: 'MX', weight: 2 },
    { code: 'NO', weight: 1 },
    { code: 'DK', weight: 1 },
];

const HOUR_WEIGHTS = [
    2, 1, 1, 1, 1, 2, 3, 5, 8, 12, 15, 18, 20, 19, 17, 15, 13, 10, 8, 6, 5, 4,
    3, 2,
];

function pick<T extends Weighted>(items: T[]): T {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = Math.random() * total;
    for (const item of items) {
        r -= item.weight;
        if (r <= 0) return item;
    }
    return items[items.length - 1];
}

function dailyVolume(dayOfWeek: number): number {
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const base = isWeekend ? 180 : 320;
    const noise = 0.75 + Math.random() * 0.5;
    return Math.floor(base * noise);
}

function pickHour(): number {
    return pick(HOUR_WEIGHTS.map((w, h) => ({ weight: w, hour: h }))).hour;
}

function randomVisitorHash(): string {
    return randomBytes(16).toString('hex');
}

async function main() {
    console.log('[seed-demo] starting');

    const hashedPassword = await hash(DEMO_PASSWORD, 12);
    let demoUser = await db.query.users.findFirst({
        where: eq(users.email, DEMO_EMAIL),
    });
    if (!demoUser) {
        console.log(`[seed-demo] creating demo user ${DEMO_EMAIL}`);
        const [created] = await db
            .insert(users)
            .values({
                email: DEMO_EMAIL,
                hashedPassword,
                name: DEMO_NAME,
            })
            .returning();
        demoUser = created;
    } else {
        console.log('[seed-demo] demo user exists — resetting password');
        await db
            .update(users)
            .set({ hashedPassword })
            .where(eq(users.id, demoUser.id));
    }

    let demoProject = await db.query.projects.findFirst({
        where: eq(projects.domain, DEMO_PROJECT_DOMAIN),
    });
    if (!demoProject) {
        console.log(`[seed-demo] creating demo project "${DEMO_PROJECT_NAME}"`);
        const [created] = await db
            .insert(projects)
            .values({
                userId: demoUser.id,
                name: DEMO_PROJECT_NAME,
                domain: DEMO_PROJECT_DOMAIN,
            })
            .returning();
        demoProject = created;
    } else {
        console.log('[seed-demo] demo project exists');
    }

    console.log('[seed-demo] wiping demo project pageviews');
    await db.delete(pageviews).where(eq(pageviews.projectId, demoProject.id));

    console.log(`[seed-demo] generating ${DAYS} days of pageviews...`);
    const now = new Date();
    const rows: (typeof pageviews.$inferInsert)[] = [];

    for (let daysAgo = DAYS; daysAgo >= 0; daysAgo--) {
        const day = new Date(now);
        day.setUTCDate(day.getUTCDate() - daysAgo);
        day.setUTCHours(0, 0, 0, 0);
        const dayOfWeek = day.getUTCDay();

        const volume = dailyVolume(dayOfWeek);

        const poolSize = Math.max(
            1,
            Math.floor(volume * (0.3 + Math.random() * 0.1))
        );
        const visitorPool = Array.from({ length: poolSize }, randomVisitorHash);

        for (let i = 0; i < volume; i++) {
            const ts = new Date(day);
            ts.setUTCHours(
                pickHour(),
                Math.floor(Math.random() * 60),
                Math.floor(Math.random() * 60),
                Math.floor(Math.random() * 1000)
            );

            const urlEntry = pick(URLS);
            const ref = pick(REFERRERS);

            rows.push({
                projectId: demoProject.id,
                url: `https://${DEMO_PROJECT_DOMAIN}${urlEntry.path}`,
                referrer: ref.url,
                browser: pick(BROWSERS).name,
                os: pick(OSES).name,
                device: pick(DEVICES).name,
                country: pick(COUNTRIES).code,
                visitorHash:
                    visitorPool[Math.floor(Math.random() * visitorPool.length)],
                timestamp: ts,
            });
        }
    }

    console.log(`[seed-demo] inserting ${rows.length} rows...`);
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
        await db.insert(pageviews).values(rows.slice(i, i + CHUNK));
        process.stdout.write('.');
    }
    console.log('\n[seed-demo] done.');

    process.exit(0);
}

main().catch((err) => {
    console.error('[seed-demo] failed:', err);
    process.exit(1);
});
