import { describe, it, expect } from 'vitest';
import { parseAnalyticsRange } from './analytics-range';

describe('parseAnalyticsRange', () => {
    const NOW = new Date('2026-05-25T14:30:00.000Z');

    describe('named periods', () => {
        it('defaults to 7d when no params given', () => {
            const r = parseAnalyticsRange({}, NOW);
            expect(r.period).toBe('7d');
            expect(r.label).toBe('Last 7 days');
            expect(r.bucket).toBe('day');
        });

        it('falls back to 7d for an unknown period string', () => {
            const r = parseAnalyticsRange({ period: 'banana' }, NOW);
            expect(r.period).toBe('7d');
        });

        it('today: hourly bucket, from = start-of-day UTC, to = now', () => {
            const r = parseAnalyticsRange({ period: 'today' }, NOW);
            expect(r.period).toBe('today');
            expect(r.bucket).toBe('hour');
            expect(r.label).toBe('Today');
            expect(r.from.toISOString()).toBe('2026-05-25T00:00:00.000Z');
            expect(r.to).toEqual(NOW);
        });

        it('7d: 7 calendar days inclusive, daily bucket', () => {
            const r = parseAnalyticsRange({ period: '7d' }, NOW);
            expect(r.period).toBe('7d');
            expect(r.bucket).toBe('day');
            expect(r.from.toISOString()).toBe('2026-05-19T00:00:00.000Z');
            expect(r.to).toEqual(NOW);
        });

        it('30d: 30 calendar days back, daily bucket', () => {
            const r = parseAnalyticsRange({ period: '30d' }, NOW);
            expect(r.period).toBe('30d');
            expect(r.bucket).toBe('day');
            expect(r.from.toISOString()).toBe('2026-04-26T00:00:00.000Z');
        });

        it('90d: 90 calendar days back, daily bucket', () => {
            const r = parseAnalyticsRange({ period: '90d' }, NOW);
            expect(r.period).toBe('90d');
            expect(r.bucket).toBe('day');
            expect(r.from.toISOString()).toBe('2026-02-25T00:00:00.000Z');
        });
    });

    describe('custom range', () => {
        it('returns period=custom when both from and to are valid', () => {
            const r = parseAnalyticsRange(
                { from: '2026-05-01', to: '2026-05-10' },
                NOW
            );
            expect(r.period).toBe('custom');
            expect(r.label).toBe('Custom range');
        });

        it('normalizes from to start-of-day UTC and to to end-of-day UTC', () => {
            const r = parseAnalyticsRange(
                { from: '2026-05-01', to: '2026-05-10' },
                NOW
            );
            expect(r.from.toISOString()).toBe('2026-05-01T00:00:00.000Z');
            expect(r.to.toISOString()).toBe('2026-05-10T23:59:59.999Z');
        });

        it('chooses hourly bucket for short ranges (≤ 2 days)', () => {
            const r = parseAnalyticsRange(
                { from: '2026-05-10', to: '2026-05-11' },
                NOW
            );
            expect(r.bucket).toBe('hour');
        });

        it('chooses daily bucket for longer ranges (> 2 days)', () => {
            const r = parseAnalyticsRange(
                { from: '2026-05-01', to: '2026-05-15' },
                NOW
            );
            expect(r.bucket).toBe('day');
        });

        it('falls back to default when from > to (backwards range)', () => {
            const r = parseAnalyticsRange(
                { from: '2026-05-15', to: '2026-05-01' },
                NOW
            );
            expect(r.period).toBe('7d');
        });

        it('falls back to default when from is unparseable', () => {
            const r = parseAnalyticsRange(
                { from: 'not-a-date', to: '2026-05-10' },
                NOW
            );
            expect(r.period).toBe('7d');
        });

        it('ignores partial custom (only one of from/to) and uses the named period', () => {
            const r = parseAnalyticsRange(
                { from: '2026-05-01', period: '30d' },
                NOW
            );
            expect(r.period).toBe('30d');
        });
    });

    describe('precedence', () => {
        it('valid custom range wins over a named period', () => {
            const r = parseAnalyticsRange(
                {
                    period: '7d',
                    from: '2026-05-01',
                    to: '2026-05-10',
                },
                NOW
            );
            expect(r.period).toBe('custom');
        });

        it('falls back to the named period when custom is invalid', () => {
            const r = parseAnalyticsRange(
                {
                    period: '30d',
                    from: 'garbage',
                    to: 'also-garbage',
                },
                NOW
            );
            expect(r.period).toBe('30d');
        });
    });
});
