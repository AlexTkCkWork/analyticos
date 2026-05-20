import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import LoginForm from '@/components/auth/login-form';
import GitHubButton from '@/components/auth/github-button';

export const metadata: Metadata = {
    title: 'Login',
    description: 'Sign in to your AnalyticOS account',
    robots: { index: false, follow: false },
};

type SearchParams = Promise<{
    callbackUrl?: string;
    error?: string;
}>;

const AUTH_ERRORS: Record<string, string> = {
    OAuthAccountNotLinked:
        'This email is already registered with a different provider. Please sign in with your original method.',
    OAuthCallbackError: 'Authentication failed. Please try again.',
    AccessDenied: 'Access was denied. Please try again.',
    Default: 'Something went wrong. Please try again.',
};

const LoginPage = async ({ searchParams }: { searchParams: SearchParams }) => {
    const session = await auth();
    if (session?.user?.id) redirect('/dashboard');

    const params = await searchParams;
    const callbackUrl = params.callbackUrl ?? '/dashboard';
    const errorKey = params.error ?? '';
    const errorMsg = errorKey
        ? (AUTH_ERRORS[errorKey] ?? AUTH_ERRORS.Default)
        : null;

    return (
        <Card className={'w-full shadow-sm'}>
            <CardHeader className={'space-y-1 pb-4'}>
                <CardTitle className={'text-2xl font-semibold'}>
                    Welcome Back
                </CardTitle>
                <CardDescription>
                    Sign in to your account to continue
                </CardDescription>
            </CardHeader>
            <CardContent className={'space-y-4'}>
                {errorMsg && (
                    <div
                        role={'alert'}
                        className={
                            'rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3'
                        }
                    >
                        <p className="text-sm text-destructive">{errorMsg}</p>
                    </div>
                )}
                <GitHubButton callbackUrl={callbackUrl} />

                <div className={'relative'}>
                    <Separator />
                    <span
                        className={
                            'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground'
                        }
                    >
                        or continue with email
                    </span>
                </div>

                <LoginForm callbackUrl={callbackUrl} />
            </CardContent>

            <CardFooter className={'flex justify-center pt-0'}>
                <p className={'text-sm text-muted-foreground'}>
                    Don&apos;t have an account?{' '}
                    <Link
                        href={'/register'}
                        className={
                            'font-medium text-primary underline-offset-4 hover:underline'
                        }
                    >
                        Create one
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
};

export default LoginPage;
