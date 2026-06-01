'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ThemeMode = 'system' | 'light' | 'dark';

const THEME_CONFIG: Record<
    ThemeMode,
    { Icon: LucideIcon; label: string; next: ThemeMode }
> = {
    system: { Icon: Monitor, label: 'Switch to light theme', next: 'light' },
    light: { Icon: Sun, label: 'Switch to dark theme', next: 'dark' },
    dark: { Icon: Moon, label: 'Switch to system theme', next: 'system' },
};

const isThemeMode = (t: string | undefined): t is ThemeMode =>
    t === 'system' || t === 'light' || t === 'dark';

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button
                variant={'ghost'}
                size={'sm'}
                aria-hidden
                disabled
                className={'opacity-0'}
            >
                <Sun className={'h-4 w-4'} />
            </Button>
        );
    }

    const current = isThemeMode(theme) ? theme : 'system';
    const { Icon, label, next } = THEME_CONFIG[current];

    return (
        <Button
            variant={'ghost'}
            size={'sm'}
            onClick={() => setTheme(next)}
            aria-label={label}
            title={label}
        >
            <Icon className={'h-4 w-4'} />
        </Button>
    );
};

export default ThemeToggle;
