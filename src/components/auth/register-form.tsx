'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegisterSchema, type RegisterInput } from '@/lib/validations';
import { registerUser } from '@/actions/auth';
import { signIn } from 'next-auth/react';

const RegisterForm = () => {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterInput>({
        resolver: zodResolver(RegisterSchema),
    });

    async function onSubmit(data: RegisterInput) {
        try {
            setServerError(null);

            const formData = new FormData();
            formData.set('email', data.email);
            formData.set('password', data.password);
            formData.set('confirmPassword', data.confirmPassword);

            const result = await registerUser(formData);

            if (!result.success) {
                if (result.errors?.email?.[0]) {
                    setServerError(result.errors.email[0]);
                    return;
                }

                setServerError(
                    result.message ?? 'Registration failed. Please try again.'
                );
                return;
            }

            const signInResult = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (signInResult?.error) {
                router.push('/login?registered=true');
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch {
            setServerError('Something went wrong. Please try again.');
        }
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className={'space-y-4'}
            noValidate
        >
            <div className={'space-y-1.5'}>
                <Label htmlFor={'reg-email'}>Email</Label>
                <Input
                    id={'reg-email'}
                    type={'email'}
                    placeholder={'you@example.com'}
                    autoComplete={'email'}
                    aria-invalid={!!errors.email}
                    aria-describedby={
                        errors.email ? 'reg-email-error' : undefined
                    }
                    {...register('email')}
                />
                {errors.email && (
                    <p
                        id={'reg-email-error'}
                        role={'alert'}
                        className={'text-xs text-destructive'}
                    >
                        {errors.email.message}
                    </p>
                )}
            </div>

            <div className={'space-y-1.5'}>
                <Label htmlFor={'reg-password'}>Password</Label>
                <Input
                    id={'reg-password'}
                    type={'password'}
                    autoComplete={'new-password'}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                        errors.password ? 'reg-password-error' : undefined
                    }
                    {...register('password')}
                />
                {errors.password && (
                    <p
                        id={'reg-password-error'}
                        role={'alert'}
                        className={'text-xs text-destructive'}
                    >
                        {errors.password.message}
                    </p>
                )}
            </div>

            <div className={'space-y-1.5'}>
                <Label htmlFor={'reg-confirm'}>Confirm password</Label>
                <Input
                    id={'reg-confirm'}
                    type={'password'}
                    autoComplete={'new-password'}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                        errors.confirmPassword ? 'reg-confirm-error' : undefined
                    }
                    {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                    <p
                        id={'reg-confirm-error'}
                        role={'alert'}
                        className={'text-xs text-destructive'}
                    >
                        {errors.confirmPassword.message}
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
                    <p className={'text-sm text-destructive'}>{serverError}</p>
                </div>
            )}

            <Button
                type={'submit'}
                className={'w-full'}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
            >
                {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
        </form>
    );
};

export default RegisterForm;
