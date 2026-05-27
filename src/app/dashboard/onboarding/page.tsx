import type { Metadata } from 'next';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import ProjectForm from '@/components/dashboard/project-form';

export const metadata: Metadata = {
    title: 'Create project',
};

const Page = () => {
    return (
        <div className={'max-w-md mx-auto'}>
            <Card className={'shadow-sm'}>
                <CardHeader className={'space-y-1 pb-4'}>
                    <CardTitle className={'text-2xl font-semibold'}>
                        Create a project
                    </CardTitle>
                    <CardDescription>
                        Add the website you want to track. You can add more
                        later.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProjectForm />
                </CardContent>
            </Card>
        </div>
    );
};

export default Page;
