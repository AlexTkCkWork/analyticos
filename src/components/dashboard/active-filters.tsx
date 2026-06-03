import Link from 'next/link';
import { Info, X } from 'lucide-react';
import {
    type AnalyticsFilters,
    type FilterKey,
    DIRECT_REFERRER,
    FILTER_KEYS,
} from '@/lib/analytics-filters';

type Props = {
    filters: AnalyticsFilters;
    searchParams: URLSearchParams;
};

const FILTER_LABELS: Record<FilterKey, string> = {
    url: 'Page',
    referrer: 'Referrer',
    browser: 'Browser',
    os: 'OS',
    device: 'Device',
    country: 'Country',
};

const formatFilterValue = (key: FilterKey, value: string): string => {
    if (key === 'referrer' && value === DIRECT_REFERRER) return 'Direct';
    return value;
};

const urlWithoutFilter = (
    base: URLSearchParams,
    keyToRemove: FilterKey
): string => {
    const next = new URLSearchParams(base);
    next.delete(keyToRemove);
    const qs = next.toString();
    return qs ? `?${qs}` : '?';
};

const urlWithAllFiltersCleared = (base: URLSearchParams): string => {
    const next = new URLSearchParams(base);
    for (const key of FILTER_KEYS) next.delete(key);
    const qs = next.toString();
    return qs ? `?${qs}` : '?';
};

const ActiveFilters = ({ filters, searchParams }: Props) => {
    const activeKeys = FILTER_KEYS.filter((k) => filters[k]);
    const hint = 'Click any row in the cards below to filter the dashboard.';

    return (
        <div className={'flex flex-wrap items-center gap-2 text-xs'}>
            <span className={'font-medium text-muted-foreground'}>Filters:</span>

            {activeKeys.length === 0 ? (
                <span className={'text-muted-foreground'}>None</span>
            ) : (
                activeKeys.map((key) => {
                    const rawValue = filters[key];
                    if (!rawValue) return null;
                    return (
                        <div
                            key={key}
                            className={
                                'inline-flex items-center gap-1 rounded-full border bg-muted/50 py-1 pl-3 pr-1'
                            }
                        >
                            <span className={'text-muted-foreground'}>
                                {FILTER_LABELS[key]}:
                            </span>
                            <span className={'max-w-50 truncate font-medium'}>
                                {formatFilterValue(key, rawValue)}
                            </span>
                            <Link
                                href={urlWithoutFilter(searchParams, key)}
                                aria-label={`Remove ${FILTER_LABELS[key]} filter`}
                                className={
                                    'rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }
                            >
                                <X className={'h-3 w-3'} />
                            </Link>
                        </div>
                    );
                })
            )}

            <span
                title={hint}
                aria-label={hint}
                className={
                    'inline-flex cursor-help text-muted-foreground hover:text-foreground'
                }
            >
                <Info className={'h-3.5 w-3.5'} />
            </span>

            {activeKeys.length >= 2 && (
                <Link
                    href={urlWithAllFiltersCleared(searchParams)}
                    className={
                        'font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline'
                    }
                >
                    Clear all
                </Link>
            )}
        </div>
    );
};

export default ActiveFilters;
