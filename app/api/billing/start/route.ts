// app/api/billing/start/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { supabaseServer } from '@/lib/supabaseServer'
import { isPro as isProDate } from '@/lib/plan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // 常に実行

type Plan = 'pro' | 'pro_plus'
type PlanTier = 'free' | 'pro' | 'pro_plus'
type BillingRow = {
    pro_until: string | null
    plan_tier: PlanTier | null
    stripe_customer_id: string | null
}

// ---------- helpers ----------
function pick(...names: string[]): string | null {
    for (const n of names) {
        const v = process.env[n]
        if (v && v.trim()) return v.trim()
    }
    return null
}

async function resolvePriceIds(stripe: Stripe): Promise<{ pro: string; proPlus: string }> {
    // あなたの既存キー名も拾う
    const proEnv =
        pick('STRIPE_PRICE_PRO', 'STRIPE_PRICE_ID_PRO', 'PRICE_PRO', 'SUB_PRICE_PRO')
    const proPlusEnv =
        pick('STRIPE_PRICE_PRO_PLUS', 'STRIPE_PRICE_ID_PRO_PLUS', 'PRICE_PRO_PLUS', 'SUB_PRICE_PRO_PLUS')

    let pro = proEnv ?? null
    let proPlus = proPlusEnv ?? null

    // どちらか欠けたら lookup_key で補完（設定していれば使われる）
    if (!pro || !proPlus) {
        const keyPro = pick('STRIPE_LOOKUP_PRO', 'PRICE_LOOKUP_PRO') ?? 'pro_monthly'
        const keyPlus = pick('STRIPE_LOOKUP_PRO_PLUS', 'PRICE_LOOKUP_PRO_PLUS') ?? 'pro_plus_monthly'
        const [l1, l2] = await Promise.all([
            stripe.prices.list({ lookup_keys: [keyPro], active: true, limit: 1 }),
            stripe.prices.list({ lookup_keys: [keyPlus], active: true, limit: 1 }),
        ])
        if (!pro) pro = l1.data[0]?.id ?? null
        if (!proPlus) proPlus = l2.data[0]?.id ?? null
    }

    if (!pro || !proPlus) {
        throw new Error('Price IDs not configured')
    }
    return { pro, proPlus }
}

// ---------- handler ----------
export async function POST(req: NextRequest) {
    try {
        // 必須ENV
        const secret = process.env.STRIPE_SECRET_KEY
        const baseUrl = process.env.APP_BASE_URL
        if (!secret || !baseUrl || !/^https?:\/\//.test(baseUrl)) {
            throw new Error('Server misconfigured')
        }

        // ロケール付きURL組み立て（NEXT_LOCALE cookie）
        const locale = req.cookies.get('NEXT_LOCALE')?.value ?? 'en'
        const origin = baseUrl.replace(/\/$/, '')
        const prefix = `${origin}/${locale}`
        const successUrl = `${prefix}?ok=1`
        const cancelUrl = `${prefix}/billing/canceled`

        // body（空でもOK）
        let plan: Plan | null = null
        try {
            const body = (await req.json()) as Partial<{ plan: Plan }>
            plan = (body?.plan ?? null) as Plan | null
        } catch { /* empty body is fine */ }

        // 認証
        const sb = await supabaseServer()
        const { data: auth } = await sb.auth.getUser()
        const user = auth.user
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 請求レコード
        const { data: billingRaw } = await sb
            .from('user_billing')
            .select('pro_until, plan_tier, stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle()
        const billing = (billingRaw ?? null) as BillingRow | null

        // Stripe 初期化 & 価格解決
        const stripe = new Stripe(secret) // apiVersionは指定しない（アカウント既定）
        const { pro: PRICE_PRO, proPlus: PRICE_PRO_PLUS } = await resolvePriceIds(stripe)

        // Customer 確保
        let customerId = billing?.stripe_customer_id ?? null
        if (!customerId) {
            const c = await stripe.customers.create({
                email: user.email ?? undefined,
                metadata: { user_id: user.id },
            })
            customerId = c.id
            await sb.from('user_billing').upsert(
                { user_id: user.id, stripe_customer_id: customerId },
                { onConflict: 'user_id' },
            )
        }

        // 権利ベース判定
        const active = isProDate(billing?.pro_until ?? null)

        if (active) {
            // 既存サブスクは Portal
            const portal = await stripe.billingPortal.sessions.create({
                customer: customerId!,
                return_url: `${prefix}`, // 例: /ja へ
            })
            return NextResponse.json({ url: portal.url })
        }

        // Free → Checkout（plan未指定は pro 既定）
        const chosen = plan ?? 'pro'
        const price = chosen === 'pro' ? PRICE_PRO : PRICE_PRO_PLUS
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId!,
            line_items: [{ price, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            allow_promotion_codes: true,
        })
        return NextResponse.json({ url: session.url })
    } catch (e) {
        console.error('[/api/billing/start] error:', e)
        return NextResponse.json({ error: 'Failed to start billing' }, { status: 500 })
    }
}
