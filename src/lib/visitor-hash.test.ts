import { describe, it, expect, beforeEach } from 'vitest';
import { generateVisitorHash } from './visitor-hash';

describe('generateVisitorHash', () => {
    beforeEach(() => {
        process.env.AUTH_SECRET = 'test-secret';
    });

    const base = {
        ip: '203.0.113.5',
        userAgent: 'Mozilla/5.0 (Test)',
        projectId: 'proj_abc',
        date: '2026-05-25',
    };

    it('returns a 64-character hex string (SHA-256)', async () => {
        const hash = await generateVisitorHash(base);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('is deterministic for identical inputs', async () => {
        const a = await generateVisitorHash(base);
        const b = await generateVisitorHash(base);
        expect(a).toBe(b);
    });

    it('rotates daily — same visitor produces different hashes on different days', async () => {
        const today = await generateVisitorHash(base);
        const tomorrow = await generateVisitorHash({
            ...base,
            date: '2026-05-26',
        });
        expect(today).not.toBe(tomorrow);
    });

    it('changes when IP changes', async () => {
        const a = await generateVisitorHash(base);
        const b = await generateVisitorHash({ ...base, ip: '198.51.100.10' });
        expect(a).not.toBe(b);
    });

    it('changes when userAgent changes', async () => {
        const a = await generateVisitorHash(base);
        const b = await generateVisitorHash({
            ...base,
            userAgent: 'Different UA',
        });
        expect(a).not.toBe(b);
    });

    it('isolates projects — same visitor on different projects gets different hashes', async () => {
        const a = await generateVisitorHash(base);
        const b = await generateVisitorHash({ ...base, projectId: 'proj_xyz' });
        expect(a).not.toBe(b);
    });

    it('is salt-sensitive — different AUTH_SECRET produces different hash', async () => {
        const a = await generateVisitorHash(base);
        process.env.AUTH_SECRET = 'different-secret';
        const b = await generateVisitorHash(base);
        expect(a).not.toBe(b);
    });

    it('throws if AUTH_SECRET is missing', async () => {
        delete process.env.AUTH_SECRET;
        await expect(generateVisitorHash(base)).rejects.toThrow(/AUTH_SECRET/);
    });

    it('defaults date to today UTC when not provided', async () => {
        const today = new Date().toISOString().slice(0, 10);
        const explicit = await generateVisitorHash({ ...base, date: today });
        const implicit = await generateVisitorHash({
            ip: base.ip,
            userAgent: base.userAgent,
            projectId: base.projectId,
        });
        expect(implicit).toBe(explicit);
    });
});
