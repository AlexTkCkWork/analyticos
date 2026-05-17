import React from 'react';
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import GitHubButton from '@/components/auth/github-button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import RegisterForm from '@/components/auth/register-form';

export const metadata: Metadata = {
    title: 'Create account',
    description: 'Create your AnalyticOS account',
    robots: { index: false, follow: false },
};

type SearchParams = Promise<{ callbackUrl?: string }>;

const RegisterPage = async ({
    searchParams,
}: {
    searchParams: SearchParams;
}) => {
    const session = await auth();
    if (session?.user?.id) redirect('/dashboard');

    const params = await searchParams;
    const callbackUrl = params.callbackUrl ?? '/dashboard';

    return (
        <Card className={'w-full shadow-sm'}>
            <CardHeader className={'space-y-1 pb-4'}>
                <CardTitle className={'text-2xl font-semibold'}>
                    Create an account
                </CardTitle>
                <CardDescription>
                    Start tracking your website analytics today
                </CardDescription>
            </CardHeader>

            <CardContent className={'space-y-4'}>
                <GitHubButton callbackUrl={callbackUrl} />

                <div className={'relative'}>
                    <Separator />
                    <span
                        className={
                            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground'
                        }
                    >
                        or register with email
                    </span>
                </div>

                <RegisterForm />
            </CardContent>

            <CardFooter className={'flex justify-center pt-0'}>
                <p className={'text-sm text-muted-foreground'}>
                    Already have an account?{' '}
                    <Link
                        href={'/login'}
                        className={
                            'font-medium text-primary underline-offset-4 hover:underline'
                        }
                    >
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
};

export default RegisterPage;
