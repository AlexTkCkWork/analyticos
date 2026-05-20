import React from 'react';
import { Metadata } from 'next';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { LinkButton } from '@/components/ui/link-button';

export const metadata: Metadata = {
    title: 'Authentication error',
    robots: { index: false, follow: false },
};

type SearchParams = Promise<{ error?: string }>;

const ERROR_MESSAGES: Record<string, string> = {
    Configuration: 'Server configuration error. Please contact support.',
    AccessDenied: 'Access was denied. Please try again.',
    Verification: 'The verification link has expired or already been used.',
    OAuthAccountNotLinked:
        'This email is linked to a different sign-in method.',
    Default: 'An unexpected authentication error occurred.',
};

const AuthErrorPage = async ({
    searchParams,
}: {
    searchParams: SearchParams;
}) => {
    const params = await searchParams;
    const message =
        ERROR_MESSAGES[params.error ?? ''] ?? ERROR_MESSAGES.Default;

    return (
        <Card className={'w-full shadow-sm'}>
            <CardHeader>
                <CardTitle className={'text-xl text-destructive'}>
                    Authentication failed
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className={'text-sm text-muted-foreground'}>{message}</p>
            </CardContent>
            <CardFooter>
                <LinkButton href="/login" className="w-full">
                    Back to login
                </LinkButton>
            </CardFooter>
        </Card>
    );
};

export default AuthErrorPage;

//TODO:Reminder all good proceed next
