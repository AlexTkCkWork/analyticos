'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Project = {
    id: string;
    name: string;
    domain: string;
};

type SidebarProps = {
    projects: Project[];
};

const Sidebar = ({ projects }: SidebarProps) => {
    const pathname = usePathname();

    return (
        <aside className={'w-64 border-r bg-muted/30 shrink-0'}>
            <div className={'px-4 py-3'}>
                <p
                    className={
                        'text-xs font-semibold uppercase tracking-wider text-muted-foreground'
                    }
                >
                    Projects
                </p>
            </div>

            <nav className={'px-2 space-y-1'}>
                {projects.map((project) => {
                    const href = `/dashboard/${project.id}`;
                    const isActive = pathname.startsWith(href);
                    return (
                        <Link
                            key={project.id}
                            href={href}
                            className={`flex flex-col rounded-md px-3 py-2 ${isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50 transition-colors'}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <span className={'text-sm font-medium truncate'}>
                                {project.name}
                            </span>
                            <span
                                className={
                                    'text-xs text-muted-foreground truncate'
                                }
                            >
                                {project.domain}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className={'mt-4 px-2'}>
                <Link
                    href={'/dashboard/onboarding'}
                    className={
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors'
                    }
                >
                    <span className={'text-base leading-none'}>+</span>
                    New project
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;
