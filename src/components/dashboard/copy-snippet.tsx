'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const CopySnippet = ({ snippet }: { snippet: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(snippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    return (
        <div className={'relative'}>
            <pre
                className={
                    'overflow-x-auto rounded-md border bg-muted px-4 py-3 pr-20 text-xs'
                }
            >
                <code>{snippet}</code>
            </pre>
            <Button
                type={'button'}
                variant={'outline'}
                size={'sm'}
                onClick={handleCopy}
                className={'absolute right-2 top-2'}
            >
                {copied ? 'Copied!' : 'Copy'}
            </Button>
        </div>
    );
};

export default CopySnippet;
