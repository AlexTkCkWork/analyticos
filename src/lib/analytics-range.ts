export type RangeBucket = 'hour' | 'day';
export type RangePeriod = 'today' | '7d' | '30d' | '90d' | 'custom';

export type AnalyticsRange = {
    from: Date;
    to: Date;
    bucket: RangeBucket;
    label: string;
    period: RangePeriod;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (d: Date): Date => {
    const x = new Date(d);
    x.setUTCHours(0, 0, 0, 0);
    return x;
};

const endOfUtcDay = (d: Date): Date => {
    const x = new Date(d);
    x.setUTCHours(23, 59, 59, 999);
    return x;
};

const resolveBucket = (from: Date, to: Date): RangeBucket =>
    to.getTime() - from.getTime() <= 2 * DAY_MS ? 'hour' : 'day';

export const parseAnalyticsRange = (
    params: { period?: RangePeriod; from?: string; to?: string },
    now: Date = new Date()
): AnalyticsRange => {
    if (params.from && params.to) {
        const from = new Date(params.from);
        const to = new Date(params.to);

        const valid =
            !Number.isNaN(from.getTime()) &&
            !Number.isNaN(to.getTime()) &&
            from <= to;

        if (valid) {
            return {
                from: startOfUtcDay(from),
                to: endOfUtcDay(to),
                bucket: resolveBucket(from, to),
                label: 'Custom range',
                period: 'custom',
            };
        }
    }

    switch (params.period) {
        case 'today':
            return {
                from: startOfUtcDay(now),
                to: now,
                bucket: 'hour',
                label: 'Today',
                period: 'today',
            };
        case '30d':
            return {
                from: startOfUtcDay(new Date(now.getTime() - 29 * DAY_MS)),
                to: now,
                bucket: 'day',
                label: 'Last 30 days',
                period: '30d',
            };
        case '90d':
            return {
                from: startOfUtcDay(new Date(now.getTime() - 89 * DAY_MS)),
                to: now,
                bucket: 'day',
                label: 'Last 90 days',
                period: '90d',
            };
        case '7d':
        default:
            return {
                from: startOfUtcDay(new Date(now.getTime() - 6 * DAY_MS)),
                to: now,
                bucket: 'day',
                label: 'Last 7 days',
                period: '7d',
            };
    }
};
