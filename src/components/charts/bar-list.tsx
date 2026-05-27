type BarListItem = { name: string; views: number };

type Props = {
    title: string;
    items: BarListItem[];
    emptyLabel?: string;
};

const BarList = ({ title, items, emptyLabel = 'No data yet' }: Props) => {
    const max = Math.max(...items.map((i) => i.views), 1);

    return (
        <div className={'rounded-lg border p-4'}>
            <h3 className={'text-sm font-semibold mb-3'}>{title}</h3>

            {items.length === 0 ? (
                <p className={'text-sm text-muted-foreground'}>{emptyLabel}</p>
            ) : (
                <ul className={'space-y-1'}>
                    {items.map((item) => (
                        <li
                            key={item.name}
                            className={
                                'relative flex items-center justify-between rounded px-2 py-1.5 text-sm'
                            }
                        >
                            <div
                                className={
                                    'absolute inset-y-0 left-0 rounded bg-accent'
                                }
                                style={{
                                    width: `${(item.views / max) * 100}%`,
                                }}
                                aria-hidden
                            />
                            <span className={'relative truncate'}>
                                {item.name}
                            </span>
                            <span
                                className={
                                    'relative ml-2 tabular-nums text-muted-foreground'
                                }
                            >
                                {item.views}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default BarList;
