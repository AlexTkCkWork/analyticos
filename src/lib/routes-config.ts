import { collectRateLimit, apiRateLimit } from '@/lib/rate-limit';
import type { Ratelimit } from '@upstash/ratelimit';

export type RouteConfig = {
    pattern: RegExp;
    requiresAuth: boolean;
    rateLimiter: Ratelimit | null;
    rateLimitBy: 'ip' | 'userId';
};

export const routesConfigs: RouteConfig[] = [
    {
        pattern: /^\/(login|register)/,
        requiresAuth: false,
        rateLimiter: null,
        rateLimitBy: 'ip',
    },
    {
        pattern: /^\/api\/collect/,
        requiresAuth: false,
        rateLimiter: collectRateLimit,
        rateLimitBy: 'ip',
    },
    {
        pattern: /^\/dashboard/,
        requiresAuth: true,
        rateLimiter: apiRateLimit,
        rateLimitBy: 'userId',
    },
    {
        pattern: /^\/auth\/error/,
        requiresAuth: false,
        rateLimiter: null,
        rateLimitBy: 'ip',
    },
];

export const publicFallback: RouteConfig = {
    pattern: /.*/,
    requiresAuth: false,
    rateLimiter: null,
    rateLimitBy: 'ip',
};
