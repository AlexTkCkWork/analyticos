import { viewDemoAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';

const ViewDemoButton = () => {
    return (
        <form action={viewDemoAction}>
            <Button type={'submit'}>View demo →</Button>
        </form>
    );
};

export default ViewDemoButton;
