'use server';

import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { RegisterSchema } from '@/lib/validations';
import { actionRateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { z } from 'zod';
import { signOut, signIn } from '@/lib/auth';

const DEMO_EMAIL = 'demo@analyticos.app';
const DEMO_PASSWORD = 'demo-pass-2026';

export type ActionResult<T = void> =
    | { success: true; data?: T }
    | {
          success: false;
          errors?: Record<string, string[] | undefined>;
          message?: string;
      };

export const registerUser = async (
    formData: FormData
): Promise<ActionResult> => {
    try {
        const headersList = await headers();
        const ip =
            headersList.get('x-forwarded-for') ??
            headersList.get('x-real-ip') ??
            'anonymous';

        const { success: rateLimitOk, reset } = await actionRateLimit.limit(
            `register:${ip}`
        );

        if (!rateLimitOk) {
            return {
                success: false,
                message: `Too many attempts. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
            };
        }

        const raw = {
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
        };

        const parsed = RegisterSchema.safeParse(raw);

        if (!parsed.success) {
            return {
                success: false,
                errors: z.flattenError(parsed.error).fieldErrors,
            };
        }

        const { email, password } = parsed.data;

        const existing = await db.query.users.findFirst({
            where: eq(users.email, email),
            columns: { id: true },
        });

        if (existing) {
            return {
                success: false,
                errors: {
                    email: ['An account with this email already exists'],
                },
            };
        }

        const hashedPassword = await hash(password, 12);

        await db.insert(users).values({
            email,
            hashedPassword,
        });

        return { success: true };
    } catch (error) {
        console.error(error);

        return {
            success: false,
            message: 'Something went wrong. Please try again.',
        };
    }
};

export const signOutAction = async () => {
    await signOut({ redirectTo: '/login' });
};

export const viewDemoAction = async () => {
    await signIn('credentials', {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        redirectTo: '/dashboard',
    });
};
