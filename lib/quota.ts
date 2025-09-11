import { redis } from './redis'

const LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 3)

function secondsUntilJstMidnight(): number {
  // 髴托ｽｴ繝ｻ・ｾ髯懶ｽｨ繝ｻ・ｨ髫ｴ蠑ｱ・・け・ｾ驛｢・ｧ髫ｹ・ｷST驍ｵ・ｺ繝ｻ・ｫ髯樊ｺｽ蛻､鬩ｪ・､驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ髫ｹ・ｺ繝ｻ・｡驍ｵ・ｺ繝ｻ・ｮ0:00(JST)驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ繝ｻ・ｮ鬩穂ｼ應ｺ芽ｾ溷､ゑｽｹ・ｧ髮区ｧｭ繝ｻ驍ｵ・ｺ郢晢ｽｻ
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
 * Free驛｢譎｢・ｽ・ｦ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｶ驛｢譎｢・ｽ・ｼ鬨ｾ蛹・ｽｽ・ｨ郢晢ｽｻ陞｢・ｽ陟慕事・ｰ・ｺ繝ｻ・｡(LIMIT髯懷干繝ｻ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｧ髮趣ｽｸ鬩帙・・ｽ・ｲ繝ｻ・ｻ驍ｵ・ｲ郢晢ｽｻ
 * - 髯具ｽｻ隴惹ｸ橸ｽｱ逧НCR=1驍ｵ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｨ驍ｵ・ｺ鬮ｦ・ｪ隨・ｽ｡驍ｵ・ｺ郢晢ｽｻTTL 驛｢・ｧ陋幢ｽｵ隨ｳ螳茨ｽｸ・ｺ繝ｻ・ｮ髫ｴ魃会ｽｽ・･髫ｴ蟷｢・ｽ・ｫ(JST)驍ｵ・ｺ繝ｻ・ｫ鬮ｫ・ｪ繝ｻ・ｭ髯橸ｽｳ郢晢ｽｻ
 * - LIMIT驛｢・ｧ陞ｳ螟ｲ・ｽ・ｶ郢晢ｽｻ遶擾ｽｴ驍ｵ・ｺ雋・∞・ｽ繝ｻallowed=false
 */
export async function consumeDailyFreeQuota(userId: string): Promise<QuotaResult> {
  const jstDate = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Tokyo', hour12: false })
    .slice(0, 10) // YYYY-MM-DD
  const key = `pb:q:${userId}:${jstDate}`

  // INCR驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ驛｢・ｧ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｦ驛｢譎｢・ｽ・ｳ驛｢譏懶ｽｺ・･陷ｿ蜻ｵ・ｰ霈斐・
  const used: number = await redis.incr(key)

  // 髯具ｽｻ隴惹ｸ橸ｽｱ骰具ｽｸ・ｺ繝ｻ・ｪ驛｢・ｧ隹ｺ謚豊鬮ｫ・ｪ繝ｻ・ｭ髯橸ｽｳ陞滂ｽｲ繝ｻ・ｼ闔・･繝ｻ・ｽ隰撰ｽｺ陟慕事・ｭ蟷｢・ｽ・ｫ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｧ郢晢ｽｻ郢晢ｽｻ
  if (used === 1) {
    await redis.expire(key, secondsUntilJstMidnight())
  }

  // TTL髯ｷ・ｿ鬮｢ﾂ繝ｻ・ｾ隴会ｽｦ繝ｻ・ｼ闔・･陟弱・蝗朱ｫ｢ﾂ陜滂ｽｧ鬨ｾ蛹・ｽｽ・ｨ郢晢ｽｻ郢晢ｽｻ
  const ttl = await redis.ttl(key)
  const remaining = Math.max(0, LIMIT - used)
  const allowed = used <= LIMIT

  return { allowed, remaining, resetInSec: ttl ?? 0, used }
}
