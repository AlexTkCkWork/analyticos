import {
    and,
    eq,
    gte,
    lte,
    desc,
    count,
    countDistinct,
    isNotNull,
    sql,
} from 'drizzle-orm';

import { db } from '@/lib/db';
import { pageviews } from '@/lib/db/schema';
import { AnalyticsRange, DAY_MS, RangeBucket } from '@/lib/analytics-range';
import { PgColumn } from 'drizzle-orm/pg-core';

export type TimeSeriesPoint = { bucket: string; count: number };

const HOUR_MS = 60 * 60 * 1000;

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

const inRange = (projectId: string, range: AnalyticsRange) =>
    and(
        eq(pageviews.projectId, projectId),
        gte(pageviews.timestamp, range.from),
        lte(pageviews.timestamp, range.to)
    );

export const getTopLineStats = async (
    projectId: string,
    range: AnalyticsRange
) => {
    const [row] = await db
        .select({
            pageviews: count(),
            visitors: countDistinct(pageviews.visitorHash),
        })
        .from(pageviews)
        .where(inRange(projectId, range));

    return { pageviews: row?.pageviews ?? 0, visitors: row?.visitors ?? 0 };
};

export const getPageviewsOverTime = async (
    projectId: string,
    range: AnalyticsRange
): Promise<{ bucket: string; count: number }[]> => {
    const bucketExpr =
        range.bucket === 'hour'
            ? sql<string>`date_trunc('hour', ${pageviews.timestamp})`
            : sql<string>`date_trunc('day', ${pageviews.timestamp})`;

    const rows = await db
        .select({ bucket: bucketExpr, count: count() })
        .from(pageviews)
        .where(inRange(projectId, range))
        .groupBy(bucketExpr)
        .orderBy(bucketExpr);

    return rows.map((r) => ({ bucket: String(r.bucket), count: r.count }));
};

export const getTopPages = async (
    projectId: string,
    range: AnalyticsRange,
    limit = 10
) => {
    const views = count();
    return db
        .select({ url: pageviews.url, views })
        .from(pageviews)
        .where(inRange(projectId, range))
        .groupBy(pageviews.url)
        .orderBy(desc(views))
        .limit(limit);
};

export const getTopReferrers = async (
    projectId: string,
    range: AnalyticsRange,
    limit = 10
) => {
    const views = count();
    return db
        .select({ referrer: pageviews.referrer, views })
        .from(pageviews)
        .where(and(inRange(projectId, range), isNotNull(pageviews.referrer)))
        .groupBy(pageviews.referrer)
        .orderBy(desc(views))
        .limit(limit);
};

const getDimensionBreakdown = async (
    column: PgColumn,
    projectId: string,
    range: AnalyticsRange,
    limit = 10
): Promise<{ name: string; views: number }[]> => {
    const views = count();
    const rows = await db
        .select({ name: column, views })
        .from(pageviews)
        .where(and(inRange(projectId, range), isNotNull(column)))
        .groupBy(column)
        .orderBy(desc(views))
        .limit(limit);

    return rows.map((r) => ({ name: String(r.name), views: r.views }));
};

export const getDeviceBreakdown = (p: string, r: AnalyticsRange) =>
    getDimensionBreakdown(pageviews.device, p, r);
export const getBrowserBreakdown = (p: string, r: AnalyticsRange) =>
    getDimensionBreakdown(pageviews.browser, p, r);
export const getOsBreakdown = (p: string, r: AnalyticsRange) =>
    getDimensionBreakdown(pageviews.os, p, r);
export const getCountryBreakdown = (p: string, r: AnalyticsRange) =>
    getDimensionBreakdown(pageviews.country, p, r);
