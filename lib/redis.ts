// lib/redis.ts
import { Redis as UpstashRedis } from '@upstash/redis'

// �����^�iunknown�������Ȃ��j
export type RedisClient = UpstashRedis
export const redis: RedisClient = new UpstashRedis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
