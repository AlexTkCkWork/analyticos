import { describe, it, expect } from 'vitest';
import { fillTimeSeries } from './time-series';
import type { AnalyticsRange, RangeBucket } from '@/lib/analytics-range';

const makeRange = (
    from: string,
    to: string,
    bucket: RangeBucket
): AnalyticsRange => ({
    from: new Date(from),
    to: new Date(to),
    bucket,
    label: 'test',
    period: bucket === 'hour' ? 'today' : '7d',
});

describe('fillTimeSeries', () => {
    describe('with daily bucket', () => {
        it('returns one entry per day in the range (inclusive)', () => {
            const range = makeRange(
                '2026-05-20T00:00:00Z',
                '2026-05-25T14:30:00Z',
                'day'
            );
            const result = fillTimeSeries([], range);
            expect(result).toHaveLength(6);
        });

        it('fills every missing bucket with count 0', () => {
            const range = makeRange(
                '2026-05-20T00:00:00Z',
                '2026-05-25T14:30:00Z',
                'day'
            );
            const result = fillTimeSeries([], range);
            expect(result.every((p) => p.count === 0)).toBe(true);
        });

        it('preserves counts from input points matched by day', () => {
            const range = makeRange(
                '2026-05-20T00:00:00Z',
                '2026-05-25T14:30:00Z',
                'day'
            );
            const result = fillTimeSeries(
                [{ bucket: '2026-05-22 00:00:00', count: 5 }],
                range
            );
            const may22 = result.find(
                (p) => p.bucket === '2026-05-22T00:00:00.000Z'
            );
            expect(may22?.count).toBe(5);
        });

        it('parses Postgres "space-separated, no Z" timestamps as UTC', () => {
            const range = makeRange(
                '2026-05-20T00:00:00Z',
                '2026-05-25T14:30:00Z',
                'day'
            );
            const result = fillTimeSeries(
                [{ bucket: '2026-05-22 00:00:00', count: 7 }],
                range
            );
            expect(
                result.find((p) => p.bucket === '2026-05-22T00:00:00.000Z')
                    ?.count
            ).toBe(7);
        });

        it('parses ISO-format timestamps equivalently', () => {
            const range = makeRange(
                '2026-05-20T00:00:00Z',
                '2026-05-25T14:30:00Z',
                'day'
            );
            const result = fillTimeSeries(
                [{ bucket: '2026-05-22T00:00:00.000Z', count: 9 }],
                range
            );
            expect(
                result.find((p) => p.bucket === '2026-05-22T00:00:00.000Z')
                    ?.count
            ).toBe(9);
        });

        it('emits buckets in strict chronological order', () => {
            const range = makeRange(
                '2026-05-20T00:00:00Z',
                '2026-05-25T14:30:00Z',
                'day'
            );
            const result = fillTimeSeries([], range);
            const times = result.map((p) => new Date(p.bucket).getTime());
            const sorted = [...times].sort((a, b) => a - b);
            expect(times).toEqual(sorted);
        });

        it('drops input points outside the range', () => {
            const range = makeRange(
                '2026-05-20T00:00:00Z',
                '2026-05-25T14:30:00Z',
                'day'
            );
            const result = fillTimeSeries(
                [{ bucket: '2026-05-15 00:00:00', count: 100 }],
                range
            );

            expect(result.every((p) => p.count === 0)).toBe(true);
        });
    });

    describe('with hourly bucket', () => {
        it('returns one entry per hour in the range (inclusive)', () => {
            const range = makeRange(
                '2026-05-25T00:00:00Z',
                '2026-05-25T05:00:00Z',
                'hour'
            );
            const result = fillTimeSeries([], range);

            expect(result).toHaveLength(6);
        });

        it('fills missing hours with 0 and preserves provided ones', () => {
            const range = makeRange(
                '2026-05-25T00:00:00Z',
                '2026-05-25T05:00:00Z',
                'hour'
            );
            const result = fillTimeSeries(
                [{ bucket: '2026-05-25 03:00:00', count: 12 }],
                range
            );
            expect(
                result.find((p) => p.bucket === '2026-05-25T03:00:00.000Z')
                    ?.count
            ).toBe(12);
            expect(result.filter((p) => p.count === 0)).toHaveLength(5);
        });
    });

    describe('edge cases', () => {
        it('handles a zero-span range as one bucket', () => {
            const range = makeRange(
                '2026-05-25T00:00:00Z',
                '2026-05-25T00:00:00Z',
                'day'
            );
            const result = fillTimeSeries([], range);
            expect(result).toHaveLength(1);
            expect(result[0].count).toBe(0);
        });
    });
});
