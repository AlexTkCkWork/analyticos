import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { globalRateLimit } from '@/lib/rate-limit';
import { routesConfigs, publicFallback } from '@/lib/routes-config';
import { auth } from '@/lib/auth';

function tooManyRequests(reset: number) {
    return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
            status: 429,
            headers: {
                'Retry-After': Math.ceil(
                    (reset - Date.now()) / 1000
                ).toString(),
                'X-RateLimit-Reset': new Date(reset).toISOString(),
            },
        }
    );
}

function redirectToLogin(request: NextRequest) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isDev = process.env.NODE_ENV === 'development';
    const ip =
        request.headers.get('x-forwarded-for') ??
        request.headers.get('x-real-ip') ??
        'anonymous';

    if (!isDev) {
        const global = await globalRateLimit.limit(ip);
        if (!global.success) return tooManyRequests(global.reset);
    }

    const config =
        routesConfigs.find((r) => r.pattern.test(pathname)) ?? publicFallback;

    let userId: string | undefined;

    if (config.requiresAuth) {
        const session = await auth();
        if (!session?.user?.id) return redirectToLogin(request);
        userId = session.user.id;
    }

    if (config.rateLimiter) {
        const identifier =
            config.rateLimitBy === 'userId' && userId ? userId : ip;

        const limited = await config.rateLimiter.limit(identifier);
        if (!limited.success) return tooManyRequests(limited.reset);
    }

    const response = NextResponse.next();
    if (userId) response.headers.set('x-user-id', userId);
    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$).*)',
    ],
};
