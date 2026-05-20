import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { authConfig } from '@/lib/auth.config';

const CredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const { auth, handlers } = NextAuth({
    ...authConfig,

    adapter: DrizzleAdapter(db),

    session: { strategy: 'database' },

    providers: [
        ...authConfig.providers,

        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    const parsed = CredentialsSchema.safeParse(credentials);
                    if (!parsed.success) return null;

                    const { email, password } = parsed.data;

                    const user = await db.query.users.findFirst({
                        where: eq(users.email, email),
                        columns: {
                            id: true,
                            email: true,
                            name: true,
                            image: true,
                            hashedPassword: true,
                        },
                    });

                    if (!user?.hashedPassword) return null;

                    const valid = await compare(password, user.hashedPassword);
                    if (!valid) return null;

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name ?? null,
                        image: user.image ?? null,
                    };
                } catch (error) {
                    console.error('[auth][authorize]', error);
                    return null;
                }
            },
        }),
    ],

    callbacks: {
        ...authConfig.callbacks,
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
        },
    },
});
