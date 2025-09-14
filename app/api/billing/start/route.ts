// app/api/billing/start/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { supabaseServer } from '@/lib/supabaseServer'
import { isPro as isProDate } from '@/lib/plan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // キャッシュ無効（常に実行）

type Plan = 'pro' | 'pro_plus'
type PlanTier = 'free' | 'pro' | 'pro_plus'
type BillingRow = {
    pro_until: string | null
    plan_tier: PlanTier | null
    stripe_customer_id: string | null
}

// --- 小ユーティリティ
function pick(...names: string[]): string | null {
    for (const n of names) {
        const v = process.env[n]
        if (v && v.trim()) return v.trim()
    }
    return null
}

function validateEnvBase() {
    const missing: string[] = []
    const invalid: string[] = []
    if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY')
    const base = process.env.APP_BASE_URL
    if (!base) {
        missing.push('APP_BASE_URL')
    } else if (!/^https?:\/\//.test(base)) {
        invalid.push('APP_BASE_URL (must be absolute http(s) URL)')
    }
    return { missing, invalid }
}

/**
 * Price ID を解決する。
 * 1) 環境変数（別名も拾う）:
 *    - STRIPE_PRICE_PRO / STRIPE_PRICE_PRO_PLUS
 * 2) 不足していたら lookup_key で取得（既定: pro_monthly / pro_plus_monthly）
 *    - 上書き環境変数: STRIPE_LOOKUP_PRO / STRIPE_LOOKUP_PRO_PLUS
 */
async function resolvePriceIds(stripe: Stripe): Promise<{ pro: string; proPlus: string }> {
    const proEnv =
        pick('STRIPE_PRICE_PRO', 'STRIPE_PRO_PRICE_ID', 'SUB_PRICE_PRO', 'PRICE_PRO')
    const proPlusEnv =
        pick('STRIPE_PRICE_PRO_PLUS', 'STRIPE_PRO_PLUS_PRICE_ID', 'SUB_PRICE_PRO_PLUS', 'PRICE_PRO_PLUS')

    let pro = proEnv ?? null
    let proPlus = proPlusEnv ?? null

    if (!pro || !proPlus) {
        const lkuPro = pick('STRIPE_LOOKUP_PRO', 'PRICE_LOOKUP_PRO') ?? 'pro_monthly'
        const lkuPlus = pick('STRIPE_LOOKUP_PRO_PLUS', 'PRICE_LOOKUP_PRO_PLUS') ?? 'pro_plus_monthly'

        const [proList, plusList] = await Promise.all([
            stripe.prices.list({ lookup_keys: [lkuPro], active: true, limit: 1 }),
            stripe.prices.list({ lookup_keys: [lkuPlus], active: true, limit: 1 }),
        ])

        if (!pro) pro = proList.data[0]?.id ?? null
        if (!proPlus) proPlus = plusList.data[0]?.id ?? null
    }

    if (!pro || !proPlus) {
        throw new Error(
            `Missing price IDs: pro=${!!pro}, pro_plus=${!!proPlus}. ` +
            `Set STRIPE_PRICE_PRO / STRIPE_PRICE_PRO_PLUS or provide lookup_key (STRIPE_LOOKUP_PRO / STRIPE_LOOKUP_PRO_PLUS).`
        )
    }

    return { pro, proPlus }
}

async function handleStart(req: NextRequest) {
    const q = req.nextUrl.searchParams
    const debugEnv = q.get('debug') === 'env'
    const debugFull = q.get('debug') === '1'

    try {
        // --- A) env ベースバリデーション（Priceはここでは必須にしない）
        const base = validateEnvBase()
        if (debugEnv) {
            const presence = {
                STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
                STRIPE_PRICE_PRO: !!process.env.STRIPE_PRICE_PRO,
                STRIPE_PRICE_PRO_PLUS: !!process.env.STRIPE_PRICE_PRO_PLUS,
                STRIPE_LOOKUP_PRO: !!process.env.STRIPE_LOOKUP_PRO,
                STRIPE_LOOKUP_PRO_PLUS: !!process.env.STRIPE_LOOKUP_PRO_PLUS,
                APP_BASE_URL: !!process.env.APP_BASE_URL
            }
            const mode = (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live') ? 'live' : 'test'
            return NextResponse.json({ presence, mode, base })
        }
        if (base.missing.length || base.invalid.length) {
            const msg = `ENV error: missing=[${base.missing.join(', ')}], invalid=[${base.invalid.join(', ')}]`
            if (debugFull) return NextResponse.json({ error: msg }, { status: 500 })
            throw new Error(msg)
        }

        // --- B) Stripe / Price解決（env or lookup_key）
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!) // apiVersion未指定＝アカウント既定
        const { pro: PRICE_PRO, proPlus: PRICE_PRO_PLUS } = await resolvePriceIds(stripe)
        const APP_BASE_URL = process.env.APP_BASE_URL!

        // --- C) body安全読み取り（空でもOK）
        let plan: Plan | null = null
        try {
            const body = (await req.json()) as Partial<{ plan: Plan }>
            plan = (body?.plan ?? null) as Plan | null
        } catch { /* empty body ok */ }

        // --- D) 認証
        const sb = await supabaseServer()
        const { data: auth } = await sb.auth.getUser()
        const user = auth.user
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // --- E) 課金レコード
        const { data: billingRaw } = await sb
            .from('user_billing')
            .select('pro_until, plan_tier, stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle()
        const billing = (billingRaw ?? null) as BillingRow | null

        // --- F) Stripe Customer 確保
        let stripeCustomerId = billing?.stripe_customer_id ?? null
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email ?? undefined,
                metadata: { user_id: user.id },
            })
            stripeCustomerId = customer.id
            await sb.from('user_billing').upsert(
                { user_id: user.id, stripe_customer_id: stripeCustomerId },
                { onConflict: 'user_id' }
            )
        }

        // --- G) 判定（権利ベース）
        const active = isProDate(billing?.pro_until ?? null)

        // --- H) デバッグ表示
        if (debugFull) {
            return NextResponse.json({
                debug: true,
                user_id: user.id,
                active,
                plan_in_body: plan,
                billing: {
                    plan_tier: billing?.plan_tier ?? null,
                    pro_until: billing?.pro_until ?? null,
                    stripe_customer_id: stripeCustomerId,
                },
                chosen_price: plan === 'pro_plus' ? PRICE_PRO_PLUS : PRICE_PRO,
                success_url: `${APP_BASE_URL}/account?ok=1`,
                cancel_url: `${APP_BASE_URL}/pricing?canceled=1`,
                action: active ? 'portal' : 'checkout',
            })
        }

        // --- I) 本処理
        if (active) {
            // 既存サブスクユーザーは Portal
            const portal = await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId!,
                return_url: `${APP_BASE_URL}/account`,
            })
            return NextResponse.json({ url: portal.url })
        }

        // Free → Checkout（plan未指定は pro 既定）
        const chosen = plan ?? 'pro'
        const price = chosen === 'pro' ? PRICE_PRO : PRICE_PRO_PLUS
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: stripeCustomerId!,
            line_items: [{ price, quantity: 1 }],
            success_url: `${APP_BASE_URL}/account?ok=1`,
            cancel_url: `${APP_BASE_URL}/pricing?canceled=1`,
            allow_promotion_codes: true,
        })
        return NextResponse.json({ url: session.url })
    } catch (e: unknown) {
        const any = e as any
        console.error('[/api/billing/start] error:', any)
        const brief = any?.message || 'Failed to start billing'
        const detail = {
            type: any?.type,
            code: any?.code,
            raw: any?.raw?.message,
            stack: any?.stack,
        }
        return NextResponse.json(
            (debugFull ? { error: brief, detail } : { error: 'Failed to start billing' }),
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    return handleStart(req)
}

// GET はデバッグ/手動確認用（本番で不要なら消してOK）
export async function GET(req: NextRequest) {
    return handleStart(req)
}
