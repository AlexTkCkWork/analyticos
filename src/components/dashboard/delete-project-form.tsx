'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteProject } from '@/actions/projects';

type Props = {
    projectId: string;
    domain: string;
};

const DeleteProjectForm = ({ projectId, domain }: Props) => {
    const router = useRouter();
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const matches = confirmation.trim().toLowerCase() === domain.toLowerCase();

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!matches) return;

        setError(null);
        setIsDeleting(true);

        try {
            const formData = new FormData();
            formData.append('projectId', projectId);
            formData.append('confirmation', confirmation);

            const result = await deleteProject(formData);

            if (!result.success) {
                setError(
                    result.errors?.confirmation?.[0] ??
                        result.message ??
                        'Failed to delete project.'
                );
                setIsDeleting(false);
                return;
            }
            router.push('/dashboard');
            router.refresh();
        } catch {
            setError('Something went wrong. Please try again.');
            setIsDeleting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={'space-y-3 rounded-md border border-destructive/30 p-4'}
        >
            <div className={'space-y-1.5'}>
                <Label htmlFor={'delete-confirmation'}>
                    Type <span className={'font-semibold'}>{domain}</span> to
                    confirm
                </Label>
                <Input
                    id={'delete-confirmation'}
                    type={'text'}
                    autoComplete={'off'}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'delete-error' : undefined}
                />
                {error && (
                    <p
                        id={'delete-error'}
                        role={'alert'}
                        className={'text-xs text-destructive'}
                    >
                        {error}
                    </p>
                )}
            </div>
            <Button
                type={'submit'}
                variant={'destructive'}
                disabled={!matches || isDeleting}
                aria-busy={isDeleting}
            >
                {isDeleting ? 'Deleting...' : 'Delete project'}
            </Button>
        </form>
    );
};

export default DeleteProjectForm;
