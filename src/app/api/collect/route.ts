import { UAParser } from 'ua-parser-js';
import { isBot } from 'ua-parser-js/bot-detection';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { projects, pageviews } from '@/lib/db/schema';
import { PageviewEventSchema } from '@/lib/validations';
import { generateVisitorHash } from '@/lib/visitor-hash';

export const runtime = 'edge';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export const OPTIONS = () => {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const POST = async (request: Request) => {
    try {
        let payload: unknown;
        try {
            payload = JSON.parse(await request.text());
        } catch {
            return new Response(null, { status: 400, headers: CORS_HEADERS });
        }

        const parsed = PageviewEventSchema.safeParse(payload);
        if (!parsed.success) {
            return new Response(null, { status: 400, headers: CORS_HEADERS });
        }
        const { key, url, referrer } = parsed.data;

        const ua = request.headers.get('user-agent') ?? '';
        if (!ua || isBot(ua)) {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        const project = await db.query.projects.findFirst({
            where: eq(projects.publicKey, key),
            columns: { id: true },
        });
        if (!project) {
            return new Response(null, { status: 404, headers: CORS_HEADERS });
        }

        let cleanUrl: string;
        try {
            const u = new URL(url);
            cleanUrl = u.origin + u.pathname;
        } catch {
            return new Response(null, { status: 400, headers: CORS_HEADERS });
        }

        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
            request.headers.get('x-real-ip') ??
            'unknown';
        const country = request.headers.get('x-vercel-ip-country') ?? null;

        const result = UAParser(ua);
        const browser = result.browser.name ?? null;
        const os = result.os.name ?? null;
        const device = result.device.type ?? 'desktop';

        const visitorHash = await generateVisitorHash({
            ip,
            userAgent: ua,
            projectId: project.id,
        });

        await db.insert(pageviews).values({
            projectId: project.id,
            url: cleanUrl,
            referrer: referrer || null,
            browser,
            os,
            device,
            country,
            visitorHash,
        });

        return new Response(null, { status: 204, headers: CORS_HEADERS });
    } catch (error) {
        console.error('[collect]', error);
        return new Response(null, { status: 500, headers: CORS_HEADERS });
    }
};
