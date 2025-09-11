// lib/redis.ts
import { Redis } from '@upstash/redis'

/** 型付きの Upstash Redis クライアント（環境変数必須） */
export const redis = Redis.fromEnv()
export type RedisClient = InstanceType<typeof Redis>
