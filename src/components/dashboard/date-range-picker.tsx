'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { RangePeriod } from '@/lib/analytics-range';

const PERIODS: { value: RangePeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
];

type Props = {
    activePeriod: RangePeriod;
};

const DateRangePicker = ({ activePeriod }: Props) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [from, setFrom] = useState(searchParams.get('from') ?? '');
    const [to, setTo] = useState(searchParams.get('to') ?? '');

    const selectPeriod = (period: RangePeriod) => {
        router.push(`${pathname}?period=${period}`);
    };

    const applyCustom = () => {
        if (!from || !to) return;
        router.push(`${pathname}?from=${from}&to=${to}`);
    };

    return (
        <div className={'flex flex-wrap items-center gap-2'}>
            {PERIODS.map((p) => (
                <Button
                    key={p.value}
                    type={'button'}
                    size={'sm'}
                    variant={activePeriod === p.value ? 'default' : 'outline'}
                    onClick={() => selectPeriod(p.value)}
                >
                    {p.label}
                </Button>
            ))}

            <div className={'flex items-center gap-1'}>
                <Input
                    type={'date'}
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className={'w-auto'}
                    aria-label={'From date'}
                />
                <span className={'text-sm text-muted-foreground'}>→</span>
                <Input
                    type={'date'}
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className={'w-auto'}
                    aria-label={'To date'}
                />
                <Button
                    type={'button'}
                    size={'sm'}
                    variant={activePeriod === 'custom' ? 'default' : 'outline'}
                    onClick={applyCustom}
                    disabled={!from || !to}
                >
                    Apply
                </Button>
            </div>
        </div>
    );
};

export default DateRangePicker;
