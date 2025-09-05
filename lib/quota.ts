import { redis } from './redis'

const LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 3)

function secondsUntilJstMidnight(): number {
  // 現在時刻をJSTに変換して次の0:00(JST)までの秒数を出す
  const now = new Date()
  const jstString = now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })
  const jst = new Date(jstString)
  const nextMidnight = new Date(
    jst.getFullYear(), jst.getMonth(), jst.getDate() + 1, 0, 0, 0, 0
  )
  return Math.max(1, Math.floor((nextMidnight.getTime() - jst.getTime()) / 1000))
}

export type QuotaResult = {
  allowed: boolean
  remaining: number
  resetInSec: number
  used: number
}

/**
 * Freeユーザー用：日次(LIMIT回)まで消費。
 * - 初回INCR=1のときだけ TTL をその日末(JST)に設定
 * - LIMITを超えたら allowed=false
 */
export async function consumeDailyFreeQuota(userId: string): Promise<QuotaResult> {
  const jstDate = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', hour12: false })
    .slice(0, 10) // YYYY-MM-DD
  const key = `pb:q:${userId}:${jstDate}`

  // INCRしてカウント取得
  const used: number = await redis.incr(key)

  // 初回ならTTL設定（当日末まで）
  if (used === 1) {
    await redis.expire(key, secondsUntilJstMidnight())
  }

  // TTL取得（可視化用）
  const ttl = await redis.ttl(key)
  const remaining = Math.max(0, LIMIT - used)
  const allowed = used <= LIMIT

  return { allowed, remaining, resetInSec: ttl ?? 0, used }
}
