import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getProjectByIdForUser } from '@/lib/db/queries';
import { Separator } from '@/components/ui/separator';
import CopySnippet from '@/components/dashboard/copy-snippet';
import DeleteProjectForm from '@/components/dashboard/delete-project-form';

export const metadata: Metadata = { title: 'Project settings' };

type PageProps = {
    params: Promise<{ projectId: string }>;
};

const Page = async ({ params }: PageProps) => {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const { projectId } = await params;
    const project = await getProjectByIdForUser(projectId, session.user.id);
    if (!project) notFound();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const snippet = `<script defer data-key="${project.publicKey}" src="${appUrl}/script.js"></script>`;

    return (
        <div className={'max-w-2xl space-y-8'}>
            <div>
                <h1 className={'text-2xl font-semibold'}>Settings</h1>
                <p className={'text-sm text-muted-foreground'}>
                    {project.name} · {project.domain}
                </p>
            </div>

            <section className={'space-y-3'}>
                <div>
                    <h2 className={'text-lg font-medium'}>Tracking script</h2>
                    <p className={'text-sm text-muted-foreground'}>
                        Paste this into the{' '}
                        <code className={'text-xs'}>&lt;head&gt;</code> of every
                        page on {project.domain}.
                    </p>
                </div>
                <CopySnippet snippet={snippet} />
            </section>

            <Separator />

            <section className={'space-y-3'}>
                <div>
                    <h2 className={'text-lg font-medium text-destructive'}>
                        Danger zone
                    </h2>
                    <p className={'text-sm text-muted-foreground'}>
                        Deleting a project permanently removes it and all its
                        analytics data. This cannot be undone.
                    </p>
                </div>
                <DeleteProjectForm
                    projectId={project.id}
                    domain={project.domain}
                />
            </section>
        </div>
    );
};

export default Page;
