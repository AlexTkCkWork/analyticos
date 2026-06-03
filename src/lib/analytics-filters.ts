export const FILTER_KEYS = [
    'url',
    'referrer',
    'browser',
    'os',
    'device',
    'country',
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

/**
 * Sentinel value for the "Direct" (no-referrer) filter.
 * Round-trips through the URL as `?referrer=__direct` and is special-cased
 * in `buildWhere` to `isNull(pageviews.referrer)`.
 */
export const DIRECT_REFERRER = '__direct';

export type AnalyticsFilters = Partial<Record<FilterKey, string>>;

export const parseAnalyticsFilters = (
    params: Partial<Record<FilterKey, string>>
): AnalyticsFilters => {
    const result: AnalyticsFilters = {};
    for (const key of FILTER_KEYS) {
        const value = params[key]?.trim();
        if (value) result[key] = value;
    }
    return result;
};

export const filtersCacheKey = (filters: AnalyticsFilters): string => {
    const parts: string[] = [];
    for (const key of FILTER_KEYS) {
        const v = filters[key];
        if (v) parts.push(`${key}=${v}`);
    }
    return parts.length > 0 ? parts.join('&') : 'none';
};

export const buildFilterUrl = (
    base: URLSearchParams,
    key: FilterKey,
    value: string | null
): string => {
    const next = new URLSearchParams(base);
    if (value === null) next.delete(key);
    else next.set(key, value);
    return `?${next.toString()}`;
};
