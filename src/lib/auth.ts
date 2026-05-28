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
import { redis } from '@/lib/redis';

const CredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const FAIL_LIMIT = 5;
const FAIL_WINDOW_SEC = 15 * 60; // 15 minutes

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
            async authorize(credentials, request) {
                try {
                    const parsed = CredentialsSchema.safeParse(credentials);
                    if (!parsed.success) return null;

                    const isDev = process.env.NODE_ENV === 'development';
                    const ip =
                        request?.headers
                            .get('x-forwarded-for')
                            ?.split(',')[0]
                            ?.trim() ??
                        request?.headers.get('x-real-ip') ??
                        'unknown';
                    const failKey = `auth:fails:${ip}`;

                    if (!isDev) {
                        const fails = await redis.get<number>(failKey);
                        if (fails !== null && fails >= FAIL_LIMIT) {
                            return null;
                        }
                    }

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

                    const valid = user?.hashedPassword
                        ? await compare(password, user.hashedPassword)
                        : false;

                    if (!valid) {
                        if (!isDev) {
                            const newCount = await redis.incr(failKey);
                            if (newCount === 1) {
                                await redis.expire(failKey, FAIL_WINDOW_SEC);
                            }
                        }
                        return null;
                    }

                    if (!isDev) {
                        await redis.del(failKey).catch(() => {});
                    }

                    return {
                        id: user!.id,
                        email: user!.email,
                        name: user!.name ?? null,
                        image: user!.image ?? null,
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
