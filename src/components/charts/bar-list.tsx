import Link from 'next/link';
import type { FilterKey } from '@/lib/analytics-filters';

export type BarListItem = {
    name: string;
    views: number;
    filterValue?: string;
};

export type BarListFilter = {
    key: FilterKey;
    currentValue?: string;
    searchParams: URLSearchParams;
};

const urlWithFilter = (
    base: URLSearchParams,
    key: FilterKey,
    value: string | null
): string => {
    const next = new URLSearchParams(base);
    if (value === null) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    return qs ? `?${qs}` : '?';
};

const BarItems = ({
    items,
    emptyLabel = 'No data yet',
    filter,
}: {
    items: BarListItem[];
    emptyLabel?: string;
    filter?: BarListFilter;
}) => {
    const max = Math.max(...items.map((i) => i.views), 1);

    if (items.length === 0) {
        return <p className={'text-sm text-muted-foreground'}>{emptyLabel}</p>;
    }

    return (
        <ul className={'space-y-1'}>
            {items.map((item) => {
                const filterValue = item.filterValue ?? item.name;
                const isActive = filter?.currentValue === filterValue;
                const baseClasses =
                    'relative flex items-center justify-between rounded px-2 py-1.5 text-sm';

                const content = (
                    <>
                        <div
                            className={
                                'absolute inset-y-0 left-0 rounded bg-accent'
                            }
                            style={{ width: `${(item.views / max) * 100}%` }}
                            aria-hidden
                        />
                        <span className={'relative truncate'}>{item.name}</span>
                        <span
                            className={
                                'relative ml-2 tabular-nums text-muted-foreground'
                            }
                        >
                            {item.views}
                        </span>
                    </>
                );

                if (filter) {
                    const href = urlWithFilter(
                        filter.searchParams,
                        filter.key,
                        isActive ? null : filterValue
                    );
                    return (
                        <li key={item.name}>
                            <Link
                                href={href}
                                aria-current={isActive ? 'true' : undefined}
                                className={`${baseClasses} block transition-colors hover:bg-accent/50 ${
                                    isActive ? 'ring-1 ring-ring' : ''
                                }`}
                            >
                                {content}
                            </Link>
                        </li>
                    );
                }

                return (
                    <li key={item.name} className={baseClasses}>
                        {content}
                    </li>
                );
            })}
        </ul>
    );
};

type Props = {
    title: string;
    items: BarListItem[];
    emptyLabel?: string;
    filter?: BarListFilter;
};

const BarList = ({ title, items, emptyLabel, filter }: Props) => {
    return (
        <div className={'rounded-lg border p-4'}>
            <h3 className={'mb-3 text-sm font-semibold'}>{title}</h3>
            <BarItems items={items} emptyLabel={emptyLabel} filter={filter} />
        </div>
    );
};

export default BarList;
export { BarItems };
