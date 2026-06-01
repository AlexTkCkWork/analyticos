import { Skeleton } from '@/components/ui/skeleton';

const Loading = () => {
    return (
        <div className={'max-w-md mx-auto'}>
            <div className={'rounded-lg border shadow-sm p-6 space-y-4'}>
                <div className={'space-y-2'}>
                    <Skeleton className={'h-7 w-40'} />
                    <Skeleton className={'h-4 w-64'} />
                </div>

                <div className={'space-y-3'}>
                    <div className={'space-y-1.5'}>
                        <Skeleton className={'h-4 w-24'} />
                        <Skeleton className={'h-10 w-full'} />
                    </div>
                    <div className={'space-y-1.5'}>
                        <Skeleton className={'h-4 w-16'} />
                        <Skeleton className={'h-10 w-full'} />
                    </div>
                    <Skeleton className={'h-10 w-full'} />
                </div>
            </div>
        </div>
    );
};

export default Loading;
