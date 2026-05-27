import { Skeleton } from '@/components/ui/skeleton';

const Loading = () => {
    return (
        <div className={'space-y-6'}>
            <div className={'flex items-start justify-between gap-4'}>
                <div className={'space-y-2'}>
                    <Skeleton className={'h-7 w-40'} />
                    <Skeleton className={'h-4 w-56'} />
                </div>
                <Skeleton className={'h-9 w-72'} />
            </div>

            <div className={'grid grid-cols-2 gap-4 sm:max-w-md'}>
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className={'rounded-lg border p-4 space-y-2'}>
                        <Skeleton className={'h-4 w-20'} />
                        <Skeleton className={'h-8 w-16'} />
                    </div>
                ))}
            </div>

            <div className={'rounded-lg border p-4 space-y-3'}>
                <Skeleton className={'h-4 w-32'} />
                <Skeleton className={'h-[300px] w-full'} />
            </div>

            <div className={'grid gap-4 md:grid-cols-2'}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={'rounded-lg border p-4 space-y-3'}>
                        <Skeleton className={'h-4 w-28'} />
                        <div className={'space-y-2'}>
                            {Array.from({ length: 5 }).map((_, j) => (
                                <Skeleton key={j} className={'h-6 w-full'} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Loading;
