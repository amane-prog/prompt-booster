// app/api/boost/status/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isPro as isProDate } from '@/lib/plan'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'

// ===== Config =====
const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 3)
// 有料（Pro / Pro+）の月間上限は共通で1000
const BASE_QUOTA_PAID = Number(process.env.BASE_QUOTA_PAID ?? 1000)

// ===== Redis =====
function getRedis(): Redis | null {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) return null
    try { return new Redis({ url, token }) } catch { return null }
}

// ===== Types =====
type PlanTier = 'free' | 'pro' | 'pro_plus'
type BillingRow = { pro_until: string | null; plan_tier: PlanTier | null }
type TopupRow = { remain?: number | null; amount?: number | null; expire_at: string }

// ===== Helpers =====
function jstDateString(): string {
    const now = new Date()
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    return jst.toISOString().slice(0, 10)
}

export async function GET(_req: NextRequest) {
    try {
        const redis = getRedis()
        const sb = await supabaseServer()

        // ---- Auth ----
        const { data: authData } = await sb.auth.getUser().catch(
            () => ({ data: { user: null } } as { data: { user: { id: string } | null } })
        )
        const userId = authData?.user?.id ?? null
        const loggedIn = !!userId

        // ---- Plan detection (plan_tier 最優先、pro_until は保険) ----
        let planTier: PlanTier = 'free'
        let proUntil: string | null = null

        if (loggedIn) {
            const { data: billingRaw } = await sb
                .from('user_billing')
                .select('pro_until, plan_tier')
                .eq('user_id', userId!)
                .maybeSingle()

            const billing = billingRaw as BillingRow | null
            const t = (billing?.plan_tier ?? 'free') as PlanTier
            if (t === 'pro_plus' || t === 'pro') {
                planTier = t
                proUntil = billing?.pro_until ?? null
            } else if (isProDate(billing?.pro_until ?? null)) {
                // plan_tier が不明でも pro_until が未来なら一時的に pro 扱い
                planTier = 'pro'
                proUntil = billing?.pro_until ?? null
            }
        }

        // ---- Free: 今日の残り ----
        let freeRemaining: number | null = null
        if (planTier === 'free') {
            if (loggedIn && redis) {
                const day = jstDateString()
                const used = Number((await redis.get(`pb:q:${userId}:${day}`)) ?? 0)
                const bonus = Number((await redis.get(`pb:b:${userId}:${day}`)) ?? 0)
                freeRemaining = Math.max(0, FREE_DAILY_LIMIT + bonus - used)
            } else {
                freeRemaining = 0
            }
        }

        // ---- Pro / Pro+ : 月間ベース枠（共通で1000） ----
        let subCap: number | null = null
        let subUsed: number | null = null
        let subRemaining: number | null = null

        if (planTier !== 'free' && loggedIn) {
            subCap = BASE_QUOTA_PAID
            if (redis) {
                const cycleId = (proUntil ?? '').slice(0, 10) || 'cycle' // pro_until が無くても回るようにフォールバック
                const key = `pb:m:${userId}:${cycleId}`
                const usedNum = Number((await redis.get(key)) ?? 0)
                subUsed = usedNum
                subRemaining = Math.max(0, subCap - usedNum)
            } else {
                subUsed = 0
                subRemaining = subCap
            }
        }

        // ---- Top-up（未使用合計） ----
        let topupRemain = 0
        let topups: { remain: number; expire_at: string }[] = []
        if (loggedIn) {
            const nowIso = new Date().toISOString()
            const { data: rowsRaw } = await sb
                .from('user_topups')
                .select('remain, amount, expire_at')
                .eq('user_id', userId!)
                .gt('expire_at', nowIso)
                .order('expire_at', { ascending: true })

            const rows = (rowsRaw ?? []) as TopupRow[]
            const normalized = rows.map((r) => {
                const rem = typeof r.remain === 'number'
                    ? r.remain
                    : (typeof r.amount === 'number' ? r.amount : 0)
                return { remain: rem, expire_at: r.expire_at }
            })

            topups = normalized
            topupRemain = normalized.reduce((acc, r) => acc + r.remain, 0)
        }

        // ---- remain の意味を統一 ----
        // Free: 今日のベース残のみ
        // Pro/Pro+: ベース残 + Topup残 の合計
        const baseRemain = planTier === 'free' ? (freeRemaining ?? 0) : (subRemaining ?? 0)
        const totalRemain = baseRemain + (topupRemain ?? 0)
        const remain = planTier === 'free' ? baseRemain : totalRemain

        const tierLabel = planTier === 'pro_plus' ? 'Pro+' : planTier === 'pro' ? 'Pro' : 'Free'

        return NextResponse.json({
            planTier,
            tierLabel,
            proUntil,
            isPro: planTier !== 'free',

            // 互換
            remain,

            // 詳細（UIで個別表示したい人向け）
            freeRemaining,             // Free: 今日のベース残
            subCap, subUsed, subRemaining, // Pro/Pro+: 月間ベース枠
            topupRemain, topups,       // 追加パック残と内訳
            baseRemain, totalRemain,   // ベースのみ / 合計
            loggedIn,
        })
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'error'
        return NextResponse.json(
            {
                planTier: 'free',
                tierLabel: 'Free',
                proUntil: null,
                isPro: false,

                remain: 0,

                freeRemaining: 0,
                subCap: null, subUsed: null, subRemaining: null,
                topupRemain: 0, topups: [],
                baseRemain: 0, totalRemain: 0,
                loggedIn: false,

                error: msg,
            },
            { status: 200 }
        )
    }
}
