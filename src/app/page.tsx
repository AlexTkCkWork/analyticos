import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { LinkButton } from '@/components/ui/link-button';

export const metadata: Metadata = {
    title: 'AnalyticOS — Privacy-first web analytics',
    description:
        'Lightweight, cookie-free web analytics. Track pageviews, visitors, top pages, and referrers without compromising visitor privacy.',
};

const FEATURES = [
    {
        title: 'Privacy-first',
        body: 'No cookies, no persistent identifiers. GDPR-friendly by design — no consent banner required.',
    },
    {
        title: 'Lightweight',
        body: 'A tiny edge-served script that never blocks rendering. Fire-and-forget, sub-kilobyte.',
    },
    {
        title: 'Everything that matters',
        body: 'Pageviews, unique visitors, top pages, referrers, devices, and geography — at a glance.',
    },
];

const Home = async () => {
    const session = await auth();
    const isAuthed = !!session?.user?.id;

    return (
        <div className={'flex min-h-screen flex-col'}>
            <header className={'border-b'}>
                <div
                    className={
                        'mx-auto flex max-w-5xl items-center justify-between px-4 py-3'
                    }
                >
                    <div className={'flex items-center gap-2'}>
                        <div
                            className={
                                'h-7 w-7 rounded-lg bg-primary flex items-center justify-center'
                            }
                        >
                            <span
                                className={
                                    'text-primary-foreground text-sm font-bold'
                                }
                            >
                                A
                            </span>
                        </div>
                        <span className={'font-semibold tracking-tight'}>
                            AnalyticOS
                        </span>
                    </div>

                    {isAuthed ? (
                        <LinkButton href={'/dashboard'} size={'sm'}>
                            Dashboard
                        </LinkButton>
                    ) : (
                        <div className={'flex items-center gap-2'}>
                            <LinkButton
                                href={'/login'}
                                variant={'ghost'}
                                size={'sm'}
                            >
                                Sign in
                            </LinkButton>
                            <LinkButton href={'/register'} size={'sm'}>
                                Get started
                            </LinkButton>
                        </div>
                    )}
                </div>
            </header>

            <main className={'flex-1'}>
                <section className={'mx-auto max-w-3xl px-4 py-24 text-center'}>
                    <h1
                        className={
                            'text-4xl sm:text-5xl font-semibold tracking-tight'
                        }
                    >
                        Privacy-first web analytics
                    </h1>
                    <p className={'mt-4 text-lg text-muted-foreground'}>
                        See your pageviews, visitors, and top content — without
                        cookies, consent banners, or bloated scripts.
                    </p>
                    <div
                        className={'mt-8 flex items-center justify-center gap-3'}
                    >
                        {isAuthed ? (
                            <LinkButton href={'/dashboard'}>
                                Go to dashboard
                            </LinkButton>
                        ) : (
                            <>
                                <LinkButton href={'/register'}>
                                    Get started free
                                </LinkButton>
                                <LinkButton href={'/login'} variant={'outline'}>
                                    Sign in
                                </LinkButton>
                            </>
                        )}
                    </div>
                </section>

                <section className={'mx-auto max-w-5xl px-4 pb-24'}>
                    <div className={'grid gap-4 md:grid-cols-3'}>
                        {FEATURES.map((f) => (
                            <div
                                key={f.title}
                                className={'rounded-lg border p-6'}
                            >
                                <h3 className={'font-semibold'}>{f.title}</h3>
                                <p
                                    className={
                                        'mt-2 text-sm text-muted-foreground'
                                    }
                                >
                                    {f.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home;
