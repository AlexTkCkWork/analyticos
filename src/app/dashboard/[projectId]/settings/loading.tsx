import { Skeleton } from '@/components/ui/skeleton';

const Loading = () => {
    return (
        <div className={'max-w-2xl space-y-8'}>
            <div className={'space-y-2'}>
                <Skeleton className={'h-7 w-32'} />
                <Skeleton className={'h-4 w-56'} />
            </div>

            <section className={'space-y-3'}>
                <div className={'space-y-1.5'}>
                    <Skeleton className={'h-5 w-32'} />
                    <Skeleton className={'h-4 w-72'} />
                </div>
                <Skeleton className={'h-12 w-full'} />
            </section>

            <Skeleton className={'h-px w-full'} />

            <section className={'space-y-3'}>
                <div className={'space-y-1.5'}>
                    <Skeleton className={'h-5 w-28'} />
                    <Skeleton className={'h-4 w-72'} />
                </div>
                <div className={'space-y-3 rounded-md border p-4'}>
                    <Skeleton className={'h-4 w-48'} />
                    <Skeleton className={'h-10 w-full'} />
                    <Skeleton className={'h-9 w-32'} />
                </div>
            </section>
        </div>
    );
};

export default Loading;
