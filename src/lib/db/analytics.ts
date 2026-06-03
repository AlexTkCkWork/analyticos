import {
    and,
    eq,
    gte,
    lte,
    desc,
    count,
    countDistinct,
    isNotNull,
    isNull,
    sql,
} from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

import { db } from '@/lib/db';
import { pageviews } from '@/lib/db/schema';
import { type AnalyticsRange } from '@/lib/analytics-range';
import { type TimeSeriesPoint } from '@/lib/time-series';
import {
    AnalyticsFilters,
    DIRECT_REFERRER,
    FILTER_KEYS,
    FilterKey,
} from '@/lib/analytics-filters';

const FILTER_COLUMNS: Record<FilterKey, PgColumn> = {
    url: pageviews.url,
    referrer: pageviews.referrer,
    browser: pageviews.browser,
    os: pageviews.os,
    device: pageviews.device,
    country: pageviews.country,
};

const buildWhere = (
    projectId: string,
    range: AnalyticsRange,
    filters: AnalyticsFilters = {}
) => {
    const conditions = [
        eq(pageviews.projectId, projectId),
        gte(pageviews.timestamp, range.from),
        lte(pageviews.timestamp, range.to),
    ];

    for (const key of FILTER_KEYS) {
        const value = filters[key];
        if (!value) continue;
        if (key === 'referrer' && value === DIRECT_REFERRER) {
            conditions.push(isNull(pageviews.referrer));
        } else {
            conditions.push(eq(FILTER_COLUMNS[key], value));
        }
    }

    return and(...conditions);
};

export const getTopLineStats = async (
    projectId: string,
    range: AnalyticsRange,
    filters?: AnalyticsFilters
) => {
    const [row] = await db
        .select({
            pageviews: count(),
            visitors: countDistinct(pageviews.visitorHash),
        })
        .from(pageviews)
        .where(buildWhere(projectId, range, filters));

    return { pageviews: row?.pageviews ?? 0, visitors: row?.visitors ?? 0 };
};

export const getPageviewsOverTime = async (
    projectId: string,
    range: AnalyticsRange,
    filters?: AnalyticsFilters
): Promise<TimeSeriesPoint[]> => {
    const bucketExpr =
        range.bucket === 'hour'
            ? sql<string>`date_trunc('hour', ${pageviews.timestamp})`
            : sql<string>`date_trunc('day', ${pageviews.timestamp})`;

    const rows = await db
        .select({ bucket: bucketExpr, count: count() })
        .from(pageviews)
        .where(buildWhere(projectId, range, filters))
        .groupBy(bucketExpr)
        .orderBy(bucketExpr);

    return rows.map((r) => ({ bucket: String(r.bucket), count: r.count }));
};

export const getTopPages = async (
    projectId: string,
    range: AnalyticsRange,
    filters?: AnalyticsFilters,
    limit = 10
) => {
    const views = count();
    return db
        .select({ url: pageviews.url, views })
        .from(pageviews)
        .where(buildWhere(projectId, range, filters))
        .groupBy(pageviews.url)
        .orderBy(desc(views))
        .limit(limit);
};

export const getTopReferrers = async (
    projectId: string,
    range: AnalyticsRange,
    filters?: AnalyticsFilters,
    limit = 10
) => {
    const views = count();
    return db
        .select({ referrer: pageviews.referrer, views })
        .from(pageviews)
        .where(buildWhere(projectId, range, filters))
        .groupBy(pageviews.referrer)
        .orderBy(desc(views))
        .limit(limit);
};

const getDimensionBreakdown = async (
    column: PgColumn,
    projectId: string,
    range: AnalyticsRange,
    filters?: AnalyticsFilters,
    limit = 10
): Promise<{ name: string; views: number }[]> => {
    const views = count();
    const rows = await db
        .select({ name: column, views })
        .from(pageviews)
        .where(and(buildWhere(projectId, range, filters), isNotNull(column)))
        .groupBy(column)
        .orderBy(desc(views))
        .limit(limit);

    return rows.map((r) => ({ name: String(r.name), views: r.views }));
};

export const getDeviceBreakdown = (
    p: string,
    r: AnalyticsRange,
    f?: AnalyticsFilters
) => getDimensionBreakdown(pageviews.device, p, r, f);
export const getBrowserBreakdown = (
    p: string,
    r: AnalyticsRange,
    f?: AnalyticsFilters
) => getDimensionBreakdown(pageviews.browser, p, r, f);
export const getOsBreakdown = (
    p: string,
    r: AnalyticsRange,
    f?: AnalyticsFilters
) => getDimensionBreakdown(pageviews.os, p, r, f);
export const getCountryBreakdown = (
    p: string,
    r: AnalyticsRange,
    f?: AnalyticsFilters
) => getDimensionBreakdown(pageviews.country, p, r, f);
