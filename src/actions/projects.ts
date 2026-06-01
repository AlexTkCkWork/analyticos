'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { actionRateLimit } from '@/lib/rate-limit';
import { CreateProjectSchema, DeleteProjectSchema } from '@/lib/validations';
import type { ActionResult } from '@/actions/auth';

export const createProject = async (
    formData: FormData
): Promise<ActionResult<{ projectId: string }>> => {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'Not authenticated' };
        }

        const userId = session.user.id;

        const { success: rateLimitOk, reset } = await actionRateLimit.limit(
            `createProject:${userId}`
        );

        if (!rateLimitOk) {
            return {
                success: false,
                message: `Too many attempts. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
            };
        }

        const parsed = CreateProjectSchema.safeParse({
            name: formData.get('name'),
            domain: formData.get('domain'),
        });

        if (!parsed.success) {
            return {
                success: false,
                errors: z.flattenError(parsed.error).fieldErrors,
            };
        }

        const { name, domain } = parsed.data;

        const created = await db
            .insert(projects)
            .values({ userId, name, domain })
            .onConflictDoNothing({
                target: [projects.userId, projects.domain],
            })
            .returning({ id: projects.id });

        if (created.length === 0) {
            return {
                success: false,
                errors: {
                    domain: ['You already have a project with this domain'],
                },
            };
        }

        revalidatePath('/dashboard');

        return { success: true, data: { projectId: created[0].id } };
    } catch (error) {
        console.error('[projects][createProject]', error);
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        };
    }
};

export const deleteProject = async (
    formData: FormData
): Promise<ActionResult> => {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'Not authenticated' };
        }

        const userId = session.user.id;

        const { success: rateLimitOk, reset } = await actionRateLimit.limit(
            `deleteProject:${userId}`
        );

        if (!rateLimitOk) {
            return {
                success: false,
                message: `Too many attempts. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
            };
        }

        const parsed = DeleteProjectSchema.safeParse({
            projectId: formData.get('projectId'),
            confirmation: formData.get('confirmation'),
        });

        if (!parsed.success) {
            return {
                success: false,
                errors: z.flattenError(parsed.error).fieldErrors,
            };
        }

        const { projectId, confirmation } = parsed.data;

        const project = await db.query.projects.findFirst({
            where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
            columns: { id: true, domain: true },
        });

        if (!project) {
            return { success: false, message: 'Project not found' };
        }

        if (
            confirmation.trim().toLowerCase() !== project.domain.toLowerCase()
        ) {
            return {
                success: false,
                errors: {
                    confirmation: [
                        `Type "${project.domain}" exactly to confirm`,
                    ],
                },
            };
        }

        await db
            .delete(projects)
            .where(
                and(eq(projects.id, projectId), eq(projects.userId, userId))
            );

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error('[projects][deleteProject]', error);
        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        };
    }
};
