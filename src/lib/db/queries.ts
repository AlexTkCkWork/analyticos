import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';

export const getFirstProjectForUser = async (userId: string) => {
    return db.query.projects.findFirst({
        where: eq(projects.userId, userId),
        orderBy: (p, { asc }) => [asc(p.createdAt)],
        columns: { id: true },
    });
};

export const listProjectsForUser = async (userId: string) => {
    return db.query.projects.findMany({
        where: eq(projects.userId, userId),
        orderBy: (p, { asc }) => [asc(p.createdAt)],
        columns: { id: true, name: true, domain: true },
    });
};

export const getProjectByIdForUser = async (
    projectId: string,
    userId: string
) => {
    return db.query.projects.findFirst({
        where: and(eq(projects.userId, userId), eq(projects.id, projectId)),
    });
};
