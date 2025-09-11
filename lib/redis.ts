// lib/redis.ts
import { Redis as UpstashRedis } from '@upstash/redis'

// ñæé¶å^ÅiunknownÇãñÇ≥Ç»Ç¢Åj
export type RedisClient = UpstashRedis
export const redis: RedisClient = new UpstashRedis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
