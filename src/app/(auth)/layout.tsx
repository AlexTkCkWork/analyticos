import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ReactNode } from 'react';

export const metadata: Metadata = {
    title: {
        template: '%s | AnalyticOS',
        default: 'AnalyticOS',
    },
    description: 'Privacy-respecting web analytics for modern teams',
};

const AuthLayout = async ({ children }: { children: ReactNode }) => {
    const session = await auth();
    if (session?.user?.id) redirect('/dashboard');

    return (
        <div
            className={
                'min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4'
            }
        >
            <div
                className={
                    'flex flex-col items-center justify-center px-4 py-12'
                }
            >
                <div className={'mb-8 flex items-center gap-2'}>
                    <div
                        className={
                            'h-8 w-8 rounded-lg bg-primary flex items-center justify-center '
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
                    <span className={'text-xl font-semibold tracking-tight'}>
                        AnalyticOS
                    </span>
                </div>
            </div>

            <div className={'w-full max-w-sm'}>{children}</div>

            <p className={'mt-8 text-xs text-muted-foreground text-center'}>
                By continuing, you agree to our{' '}
                <a
                    href={'/terms'}
                    className={
                        'underline underline-offset-4 hover:text-primary transition-colors'
                    }
                >
                    Terms
                </a>{' '}
                and{' '}
                <a
                    href={'/privacy'}
                    className={
                        'underline underline-offset-4 hover:text-primary transition-colors'
                    }
                >
                    Privacy Policy
                </a>
            </p>
        </div>
    );
};

export default AuthLayout;
