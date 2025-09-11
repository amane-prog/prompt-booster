import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isPro as isProDate } from '@/lib/plan'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'

const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 3)

function getRedis(): Redis | null {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) return null
    try {
        return new Redis({ url, token })
    } catch {
        return null
    }
}

type PlanTier = 'free' | 'pro' | 'pro_plus'
type BillingRow = { pro_until: string | null; plan_tier: PlanTier | null }
type TopupRow = { remain?: number | null; amount?: number | null; expire_at: string }

function jstDateString(): string {
    const now = new Date()
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    return jst.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
    try {
        const redis = getRedis()
        const sb = await supabaseServer()
        const { data: authData } = await sb.auth.getUser().catch(
            () => ({ data: { user: null } } as { data: { user: { id: string } | null } })
        )
        const userId = authData?.user?.id ?? null

        let planTier: PlanTier = 'free'
        let proUntil: string | null = null

        if (userId) {
            const { data: billingRaw } = await sb
                .from('user_billing')
                .select('pro_until, plan_tier')
                .eq('user_id', userId)
                .maybeSingle()

            const billing = billingRaw as BillingRow | null
            const active = isProDate(billing?.pro_until ?? null)
            if (active) {
                planTier = billing?.plan_tier === 'pro_plus' ? 'pro_plus' : 'pro'
                proUntil = billing?.pro_until ?? null
            }
        }

<<<<<<< HEAD
        // Free 残数計算
=======
        // Free 驍ｵ・ｺ繝ｻ・ｮ髫ｹ・ｿ陷ｿ・･陞ｻ讌｢・ｬ・ｨ繝ｻ・ｰ郢晢ｽｻ郢晢ｽｻro/Pro+ 驍ｵ・ｺ繝ｻ・ｯ null郢晢ｽｻ郢晢ｽｻ
>>>>>>> deploy-test
        let freeRemaining: number | null = null
        if (planTier === 'free') {
            if (userId && redis) {
                const day = jstDateString()
                const usedRaw = await redis.get<string | number>(`pb:q:${userId}:${day}`)
                const bonusRaw = await redis.get<string | number>(`pb:b:${userId}:${day}`)
                const used = Number(usedRaw ?? 0)
                const bonus = Number(bonusRaw ?? 0)
                freeRemaining = Math.max(0, FREE_DAILY_LIMIT + bonus - used)
            } else {
                const usageCookie = req.cookies.get('pb_usage')?.value ?? ''
                const bonusCookie = req.cookies.get('pb_bonus')?.value ?? ''
                const [uDate, uCountStr] = usageCookie.split(':')
                const [bDate, bCountStr] = bonusCookie.split(':')
                const today = jstDateString()
                const u = Number(uDate === today ? uCountStr : 0) || 0
                const b = Number(bDate === today ? bCountStr : 0) || 0
                freeRemaining = Math.max(0, FREE_DAILY_LIMIT + b - u)
            }
        }

<<<<<<< HEAD
        // Pro/Pro+ の月間残数
=======
        // 髫ｨ蛟･繝ｻPro/Pro+ 驍ｵ・ｺ繝ｻ・ｮ髫ｴ蟶帶ｲｺ繝ｻ・ｬ繝ｻ・｡驛｢・ｧ繝ｻ・ｵ驛｢譎・§邵ｺ蟶ｷ・ｹ・ｧ繝ｻ・ｯ髫ｹ・ｿ陋ｹ・ｺ霎溘・
>>>>>>> deploy-test
        let subCap: number | null = null
        let subUsed: number | null = null
        let subRemaining: number | null = null
        if (planTier !== 'free' && userId) {
<<<<<<< HEAD
            subCap = 1000
=======
            subCap = 1000 // tier 驍ｵ・ｺ繝ｻ・ｧ髯樊ｺｷ・ｳ・ｨ遶擾ｽｴ驛｢・ｧ闕ｵ譏ｶ繝ｻ驛｢・ｧ陝ｲ・ｨ繝ｻ繝ｻ・ｸ・ｺ髦ｮ蜷ｶﾂ螳壼ｴ慕ｹ晢ｽｻ繝ｻ・ｲ郢晢ｽｻ
>>>>>>> deploy-test
            if (redis) {
                const cycleId = (proUntil ?? '').slice(0, 10) || 'cycle'
                const key = `pb:m:${userId}:${cycleId}`
                const usedRaw = await redis.get<string | number>(key)
                const usedNum = Number(usedRaw ?? 0)
                subUsed = usedNum
                subRemaining = Math.max(0, (subCap ?? 0) - usedNum)
            } else {
                subUsed = 0
                subRemaining = subCap
            }
        }

<<<<<<< HEAD
        // Top-up
=======
        // Top-up 髫ｹ・ｿ驕擾ｽｩ繝ｻ・ｫ陋帙・・ｽ・ｼ陜捺ｻ督蜑ｰ諤上・・ｹ髫ｴ蟶ｶ・ｻ繝ｻ蠢憺匚ﾂ郢晢ｽｻ郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｿ驛｢譎｢・ｽ・ｻFIFO鬨ｾ蛹・ｽｽ・ｨ驍ｵ・ｺ繝ｻ・ｫ髫ｴ蟶ｶ・ｻ繝ｻ蠢憺垓荳翫・繝ｻ・ｰ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻ
>>>>>>> deploy-test
        let topupRemain = 0
        let topups: { remain: number; expire_at: string }[] = []
        if (userId) {
            const nowIso = new Date().toISOString()
            const { data: rowsRaw } = await sb
                .from('user_topups')
                .select('remain, amount, expire_at')
                .eq('user_id', userId)
                .gt('expire_at', nowIso)
                .order('expire_at', { ascending: true })

            const rows = (rowsRaw ?? []) as TopupRow[]
            const normalized = rows.map((r: TopupRow) => {
                const rem = typeof r.remain === 'number' ? r.remain : (typeof r.amount === 'number' ? r.amount : 0)
                return { remain: rem, expire_at: r.expire_at }
            })

            topups = normalized
            topupRemain = normalized.reduce((acc: number, r: { remain: number }) => acc + r.remain, 0)
        }

        return NextResponse.json({
            planTier,
            proUntil,
            freeRemaining,
            isPro: planTier !== 'free',
            remain: freeRemaining,
<<<<<<< HEAD
=======

            // 驛｢・ｧ繝ｻ・ｵ驛｢譎・§邵ｺ蟶ｷ・ｹ・ｧ繝ｻ・ｯ髫ｹ・ｿ陋ｹ・ｺ霎溷｣ｹ繝ｻ郢晢ｽｻro/Pro+ 鬨ｾ蛹・ｽｽ・ｨ郢晢ｽｻ郢晢ｽｻ
>>>>>>> deploy-test
            subCap,
            subUsed,
            subRemaining,
            topupRemain,
            topups,
        })
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'error'
        return NextResponse.json(
            {
                planTier: 'free',
                proUntil: null,
                freeRemaining: 0,
                isPro: false,
                remain: 0,
                topupRemain: 0,
                topups: [],
                error: msg,
                subCap: null,
                subUsed: null,
                subRemaining: null,
            },
            { status: 200 }
        )
    }
}
