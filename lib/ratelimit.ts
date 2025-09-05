import { redis } from '@/lib/redis'

export async function simpleRateLimit(ip: string, limit = 60, windowSec = 60) {
    const key = `pb:rl:${ip}`
    const cur = Number(await redis.get(key)) || 0
    if (cur >= limit) return false
    if (cur === 0) await redis.set(key, 1, { ex: windowSec })
    else await redis.incr(key)
    return true
}
