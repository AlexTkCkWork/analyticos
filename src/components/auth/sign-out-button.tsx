import React from 'react';
import { signOutAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';

const SignOutButton = () => {
    return (
        <form action={signOutAction}>
            <Button type={'submit'} variant={'outline'} size={'sm'}>
                Sign out
            </Button>
        </form>
    );
};

export default SignOutButton;
