import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getProjectByIdForUser } from '@/lib/db/queries';

type PageProps = {
    params: Promise<{ projectId: string }>;
};

const Page = async ({ params }: PageProps) => {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const { projectId } = await params;
    const project = await getProjectByIdForUser(projectId, session.user.id);
    if (!project) notFound();

    return (
        <div>
            <div className={'flex items-start justify-between mb-8'}>
                <div>
                    <h1 className={'text-2xl font-semibold'}>{project.name}</h1>
                    <p className={'text-sm text-muted-foreground'}>
                        {project.domain}
                    </p>
                </div>
                <Link
                    href={`/dashboard/${project.id}/settings`}
                    className={
                        'text-sm font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline'
                    }
                >
                    Settings
                </Link>
            </div>

            <div
                className={
                    'rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center'
                }
            >
                <p className={'text-sm text-muted-foreground'}>
                    Analytics will appear here in Phase 5.
                </p>
                <p className={'mt-1 text-sm text-muted-foreground'}>
                    Set up the tracking script in{' '}
                    <Link
                        href={`/dashboard/${project.id}/settings`}
                        className={
                            'font-medium text-foreground underline underline-offset-4'
                        }
                    >
                        Settings
                    </Link>{' '}
                    to start collecting data.
                </p>
            </div>
        </div>
    );
};

export default Page;
