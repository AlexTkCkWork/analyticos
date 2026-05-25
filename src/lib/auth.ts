import NextAuth from 'next-auth';
import { encode as defaultEncode } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { createId } from '@paralleldrive/cuid2';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { z } from 'zod';
import { authConfig } from '@/lib/auth.config';
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema';

const CredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const adapter = DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
});

export const { auth, handlers, signOut, signIn } = NextAuth({
    ...authConfig,

    adapter,

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
        async jwt({ token, account }) {
            if (account?.provider === 'credentials') {
                token.credentials = true;
            }
            return token;
        },
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
        },
    },

    jwt: {
        async encode(params) {
            if (params.token?.credentials) {
                if (!params.token.sub) {
                    throw new Error('No user ID found in token');
                }

                const sessionToken = createId();
                const maxAgeSeconds = params.maxAge ?? 30 * 24 * 60 * 60;
                const expires = new Date(Date.now() + maxAgeSeconds * 1000);

                const createdSession = await adapter.createSession?.({
                    sessionToken,
                    userId: params.token.sub,
                    expires,
                });

                if (!createdSession) {
                    throw new Error('Failed to create session');
                }

                return sessionToken;
            }

            return defaultEncode(params);
        },
    },
});
