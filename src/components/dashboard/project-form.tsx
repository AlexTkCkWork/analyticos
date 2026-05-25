'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    CreateProjectSchema,
    type CreateProjectInput,
} from '@/lib/validations';
import { createProject } from '@/actions/projects';

const ProjectForm = () => {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CreateProjectInput>({
        resolver: zodResolver(CreateProjectSchema),
    });

    const onSubmit = async (data: CreateProjectInput) => {
        try {
            setServerError(null);

            const formData = new FormData();
            formData.set('name', data.name);
            formData.set('domain', data.domain);

            const result = await createProject(formData);

            if (!result.success) {
                if (result.errors?.name?.[0]) {
                    setError('name', { message: result.errors.name[0] });
                }
                if (result.errors?.domain?.[0]) {
                    setError('domain', { message: result.errors.domain[0] });
                }
                if (result.message) {
                    setServerError(result.message);
                }
                return;
            }

            router.push(`/dashboard/${result.data!.projectId}`);
            router.refresh();
        } catch {
            setServerError('Something went wrong. Please try again.');
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className={'space-y-4'}
            noValidate
        >
            <div className={'space-y-1.5'}>
                <Label htmlFor={'project-name'}>Project name</Label>
                <Input
                    id={'project-name'}
                    type={'text'}
                    placeholder={'My website'}
                    autoComplete={'off'}
                    aria-invalid={!!errors.name}
                    aria-describedby={
                        errors.name ? 'project-name-error' : undefined
                    }
                    {...register('name')}
                />
                {errors.name && (
                    <p
                        id={'project-name-error'}
                        role={'alert'}
                        className={'text-xs text-destructive'}
                    >
                        {errors.name.message}
                    </p>
                )}
            </div>

            <div className={'space-y-1.5'}>
                <Label htmlFor={'project-domain'}>Domain</Label>
                <Input
                    id={'project-domain'}
                    type={'text'}
                    placeholder={'mywebsite.com'}
                    autoComplete={'off'}
                    aria-invalid={!!errors.domain}
                    aria-describedby={
                        errors.domain ? 'project-domain-error' : undefined
                    }
                    {...register('domain')}
                />
                {errors.domain && (
                    <p
                        id={'project-domain-error'}
                        role={'alert'}
                        className={'text-xs text-destructive'}
                    >
                        {errors.domain.message}
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
                {isSubmitting ? 'Creating...' : 'Create project'}
            </Button>
        </form>
    );
};

export default ProjectForm;
