import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';

export const authConfig: NextAuthConfig = {
    providers: [
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
        }),
    ],

    pages: {
        signIn: '/login',
        error: '/auth/error',
    },

    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isProtected =
                nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/onboarding');

            if (isProtected) {
                if (isLoggedIn) return true;
                return false;
            }

            return true;
        },
    },
};
