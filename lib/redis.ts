// lib/redis.ts
import { Redis } from '@upstash/redis'

/** �^�t���� Upstash Redis �N���C�A���g�i���ϐ��K�{�j */
export const redis = Redis.fromEnv()
export type RedisClient = InstanceType<typeof Redis>
