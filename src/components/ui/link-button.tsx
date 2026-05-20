import Link from 'next/link';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface LinkButtonProps extends VariantProps<typeof buttonVariants> {
    href: string;
    children: React.ReactNode;
    className?: string;
    external?: boolean;
}

export function LinkButton({
    href,
    children,
    className,
    variant = 'default',
    size = 'default',
    external,
}: LinkButtonProps) {
    const classes = cn(buttonVariants({ variant, size, className }));

    if (external) {
        return (
            <a
                href={href}
                className={classes}
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
            </a>
        );
    }

    return (
        <Link href={href} className={classes}>
            {children}
        </Link>
    );
}
