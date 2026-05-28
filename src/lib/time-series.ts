import {
    type AnalyticsRange,
    type RangeBucket,
    DAY_MS,
} from '@/lib/analytics-range';

const HOUR_MS = 60 * 60 * 1000;

export type TimeSeriesPoint = { bucket: string; count: number };

const floorToBucket = (d: Date, bucket: RangeBucket): Date => {
    const x = new Date(d);
    x.setUTCMilliseconds(0);
    x.setUTCSeconds(0);
    x.setUTCMinutes(0);
    if (bucket === 'day') x.setUTCHours(0);
    return x;
};

const parseDbBucket = (s: string): Date => {
    const iso = s.includes('T') ? s : s.replace(' ', 'T');
    return new Date(iso.endsWith('Z') ? iso : iso + 'Z');
};

export const fillTimeSeries = (
    points: TimeSeriesPoint[],
    range: AnalyticsRange
): TimeSeriesPoint[] => {
    const counts = new Map<number, number>();
    for (const p of points) {
        const key = floorToBucket(
            parseDbBucket(p.bucket),
            range.bucket
        ).getTime();
        counts.set(key, p.count);
    }

    const step = range.bucket === 'hour' ? HOUR_MS : DAY_MS;
    const end = range.to.getTime();
    const result: TimeSeriesPoint[] = [];
    let cursor = floorToBucket(range.from, range.bucket).getTime();

    while (cursor <= end) {
        result.push({
            bucket: new Date(cursor).toISOString(),
            count: counts.get(cursor) ?? 0,
        });
        cursor += step;
    }

    return result;
};
