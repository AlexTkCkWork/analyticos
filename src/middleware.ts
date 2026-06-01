import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { globalRateLimit } from '@/lib/rate-limit';
import { routesConfigs, publicFallback } from '@/lib/routes-config';
import { auth } from '@/lib/auth';

function tooManyRequests(reset: number, request: NextRequest) {
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    const baseHeaders = {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
    };

    const wantsHtml = (request.headers.get('accept') ?? '').includes(
        'text/html'
    );

    if (wantsHtml) {
        const url = request.nextUrl.clone();
        url.pathname = '/too-many-requests';
        url.searchParams.set('retry', retryAfter.toString());
        return NextResponse.rewrite(url, { status: 429, headers: baseHeaders });
    }

    return NextResponse.json(
        { error: 'Too many requests. Please try again later.', retryAfter },
        { status: 429, headers: baseHeaders }
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
        if (!global.success) return tooManyRequests(global.reset, request);
    }

    const config =
        routesConfigs.find((r) => r.pattern.test(pathname)) ?? publicFallback;

    let userId: string | undefined;

    if (config.requiresAuth) {
        const session = await auth();
        if (!session?.user?.id) return redirectToLogin(request);
        userId = session.user.id;
    }

    if (!isDev && config.rateLimiter) {
        const identifier =
            config.rateLimitBy === 'userId' && userId ? userId : ip;

        const limited = await config.rateLimiter.limit(identifier);
        if (!limited.success) return tooManyRequests(limited.reset, request);
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
