import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getFirstProjectForUser } from '@/lib/db/queries';

const Page = async () => {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const project = await getFirstProjectForUser(session.user.id);

    if (project) redirect(`/dashboard/${project.id}`);
    redirect('/dashboard/onboarding');
};

export default Page;
