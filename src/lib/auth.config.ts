import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

const CredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const authConfig: NextAuthConfig = {
    providers: [
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
        }),
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const parsed = CredentialsSchema.safeParse(credentials);
                if (!parsed.success) return null;
                return { email: parsed.data.email };
            },
        }),
    ],
    pages: {
        signIn: '/login',
        error: '/auth/error',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isProtected = nextUrl.pathname.startsWith('/dashboard');
            const isOnboarding = nextUrl.pathname.startsWith('/onboarding');

            if (isProtected || isOnboarding) {
                if (isLoggedIn) return true;
                return false;
            }

            return true;
        },
    },
};
