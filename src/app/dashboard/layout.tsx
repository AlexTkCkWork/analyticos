import React, { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SignOutButton from '@/components/auth/sign-out-button';

const Layout = async ({ children }: { children: ReactNode }) => {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    return (
        <div className={'min-h-screen flex flex-col'}>
            <header className={'border-b'}>
                <div
                    className={
                        'container mx-auto flex items-center justify-between px-4 py-3'
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
                    <div className={'flex items-center gap-3'}>
                        <span className={'text-sm text-muted-foreground'}>
                            {session.user.email}
                        </span>
                        <SignOutButton />
                    </div>
                </div>
            </header>

            <main className={'flex-1 container mx-auto px-4 py-8'}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
