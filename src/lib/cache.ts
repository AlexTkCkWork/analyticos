import { redis } from '@/lib/redis';

export const withCache = async <T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>
): Promise<T> => {
    try {
        const hit = await redis.get<T>(key);
        if (hit !== null && hit !== undefined) return hit;
    } catch {}

    const fresh = await fn();

    try {
        await redis.set(key, fresh, { ex: ttlSeconds });
    } catch {}

    return fresh;
};
