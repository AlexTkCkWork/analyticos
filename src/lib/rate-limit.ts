import {Ratelimit} from '@upstash/ratelimit'
import {redis} from '@/lib/redis'

export const globalRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'),
    prefix: 'rl:global',
    analytics: true
})

export const authRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'rl:auth',
    analytics: true
})

export const collectRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'rl:collect',
    analytics: true
})

export const apiRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'rl:api',
    analytics: true
})

export const actionRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'rl:action',
    analytics: true
})