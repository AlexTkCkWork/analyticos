'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginSchema, type LoginInput } from '@/lib/validations';

const LoginForm = ({ callbackUrl }: { callbackUrl: string }) => {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput>({
        resolver: zodResolver(LoginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        try {
            setServerError(null);

            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (!result) {
                setServerError('Something went wrong. Please try again.');
                return;
            }

            if (result.error) {
                setServerError('Invalid email or password.');
                return;
            }

            router.push(callbackUrl);
            router.refresh();
        } catch {
            setServerError('Something went wrong. Please try again.');
        }
    };

    return (
        <form
            noValidate
            className={'space-y-4'}
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className={'space-y-1.5'}>
                <Label htmlFor={'email'}>Email</Label>
                <Input
                    id={'email'}
                    type={'email'}
                    placeholder={'you@example.com'}
                    autoComplete={'email'}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    {...register('email')}
                />
                {errors.email && (
                    <p
                        id={'email-error'}
                        role={'alert'}
                        className={'text-xs text-destructive'}
                    >
                        {errors.email.message}
                    </p>
                )}
            </div>

            <div className={'space-y-1.5'}>
                <div className={'flex items-center justify-between'}>
                    <Label htmlFor={'password'}>Password</Label>
                </div>

                <Input
                    id={'password'}
                    type={'password'}
                    autoComplete={'current-password'}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                        errors.password ? 'password-error' : undefined
                    }
                    {...register('password')}
                />
                {errors.password && (
                    <p
                        id="password-error"
                        role="alert"
                        className="text-xs text-destructive"
                    >
                        {errors.password.message}
                    </p>
                )}
            </div>

            {serverError && (
                <div
                    role={'alert'}
                    className={
                        'rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3'
                    }
                >
                    <p className="text-sm text-destructive">{serverError}</p>
                </div>
            )}

            <Button
                type={'submit'}
                className={'w-full'}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
            >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
        </form>
    );

    return <div></div>;
};

export default LoginForm;
