import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Too many requests',
    robots: { index: false, follow: false },
};

type PageProps = {
    searchParams: Promise<{ retry?: string }>;
};

const TooManyRequestsPage = async ({ searchParams }: PageProps) => {
    const { retry } = await searchParams;
    const seconds = retry ? Math.max(1, parseInt(retry, 10) || 1) : null;

    return (
        <div className={'flex min-h-screen items-center justify-center px-4'}>
            <div className={'max-w-md text-center'}>
                <h1 className={'text-2xl font-semibold'}>Too many requests</h1>
                <p className={'mt-3 text-sm text-muted-foreground'}>
                    You&#39;ve made too many requests in a short window.
                    {seconds !== null && (
                        <>
                            {' '}
                            Please wait {seconds} second
                            {seconds === 1 ? '' : 's'} and try again.
                        </>
                    )}
                </p>
                <Link
                    href={'/'}
                    className={
                        'mt-6 inline-block rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90'
                    }
                >
                    Back to home
                </Link>
            </div>
        </div>
    );
};

export default TooManyRequestsPage;
