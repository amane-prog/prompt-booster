// app/api/billing/start/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { supabaseServer } from '@/lib/supabaseServer'
import { isPro as isProDate } from '@/lib/plan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Plan = 'pro' | 'pro_plus'
type PlanTier = 'free' | 'pro' | 'pro_plus'
type BillingRow = { pro_until: string | null; plan_tier: PlanTier | null; stripe_customer_id: string | null }

// ---- env 安全取得 & バリデーション
function env(name: string) {
    return (process.env as Record<string, string | undefined>)[name]
}
function validateEnv() {
    const missing: string[] = []
    const invalid: string[] = []
    if (!env('STRIPE_SECRET_KEY')) missing.push('STRIPE_SECRET_KEY')
    if (!env('STRIPE_PRICE_PRO')) missing.push('STRIPE_PRICE_PRO')
    if (!env('STRIPE_PRICE_PRO_PLUS')) missing.push('STRIPE_PRICE_PRO_PLUS')
    const base = env('APP_BASE_URL')
    if (!base) {
        missing.push('APP_BASE_URL')
    } else if (!/^https?:\/\//.test(base)) {
        invalid.push('APP_BASE_URL (must be absolute http(s) URL)')
    }
    return { missing, invalid }
}

async function handleStart(req: NextRequest) {
    const debug = req.nextUrl.searchParams.get('debug') === '1'

    try {
        // (0) envチェック
        const envCheck = validateEnv()
        if (envCheck.missing.length || envCheck.invalid.length) {
            const msg = `ENV error: missing=[${envCheck.missing.join(', ')}], invalid=[${envCheck.invalid.join(', ')}]`
            if (debug) return NextResponse.json({ error: msg }, { status: 500 })
            throw new Error(msg)
        }

        const stripe = new Stripe(env('STRIPE_SECRET_KEY')!)
        const PRICE_PRO = env('STRIPE_PRICE_PRO')!
        const PRICE_PRO_PLUS = env('STRIPE_PRICE_PRO_PLUS')!
        const APP_BASE_URL = env('APP_BASE_URL')!

        // (1) body（空でもOK）
        let plan: Plan | null = null
        try {
            const body = (await req.json()) as Partial<{ plan: Plan }>
            plan = (body?.plan ?? null) as Plan | null
        } catch { /* ignore empty body */ }

        // (2) auth
        const sb = await supabaseServer()
        const { data: auth } = await sb.auth.getUser()
        const user = auth.user
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // (3) billing row
        const { data: billingRaw } = await sb
            .from('user_billing')
            .select('pro_until, plan_tier, stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle()
        const billing = (billingRaw ?? null) as BillingRow | null

        // (4) customer 確保
        let stripeCustomerId = billing?.stripe_customer_id ?? null
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email ?? undefined,
                metadata: { user_id: user.id },
            })
            stripeCustomerId = customer.id
            await sb.from('user_billing').upsert(
                { user_id: user.id, stripe_customer_id: stripeCustomerId },
                { onConflict: 'user_id' },
            )
        }

        // (5) 判定（権利＝pro_until）
        const active = isProDate(billing?.pro_until ?? null)

        // デバッグモードなら“何をする予定か”だけ返す
        if (debug) {
            return NextResponse.json({
                debug: true,
                user_id: user.id,
                env_ok: true,
                plan_in_body: plan,
                billing: {
                    plan_tier: billing?.plan_tier ?? null,
                    pro_until: billing?.pro_until ?? null,
                    active,
                    stripe_customer_id: stripeCustomerId,
                },
                action: active ? 'portal' : 'checkout',
                chosen_price: plan === 'pro_plus' ? PRICE_PRO_PLUS : PRICE_PRO,
                success_url: `${APP_BASE_URL}/account?ok=1`,
                cancel_url: `${APP_BASE_URL}/pricing?canceled=1`,
            })
        }

        if (active) {
            const portal = await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId!,
                return_url: `${APP_BASE_URL}/account`,
            })
            return NextResponse.json({ url: portal.url })
        }

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
        // 失敗時は詳細をログ＆debug=1なら詳細返す
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
            debug ? { error: brief, detail } : { error: 'Failed to start billing' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) { return handleStart(req) }
// GETはデバッグ用（/api/billing/start?debug=1）
export async function GET(req: NextRequest) { return handleStart(req) }
