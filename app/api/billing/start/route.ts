// app/api/billing/start/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { supabaseServer } from '@/lib/supabaseServer'
import { isPro as isProDate } from '@/lib/plan'

export const runtime = 'nodejs'

type Plan = 'pro' | 'pro_plus'
type PlanTier = 'free' | 'pro' | 'pro_plus'
type BillingRow = {
    pro_until: string | null
    plan_tier: PlanTier | null
    stripe_customer_id: string | null
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const PRICE_PRO = process.env.STRIPE_PRICE_PRO!
const PRICE_PRO_PLUS = process.env.STRIPE_PRICE_PRO_PLUS!
const APP_BASE_URL = process.env.APP_BASE_URL!

async function handleStart(req: NextRequest) {
    try {
        // ❶ JSON安全読み込み（空でも落とさない）
        let plan: Plan | null = null
        try {
            const body = (await req.json()) as Partial<{ plan: Plan }>
            plan = (body?.plan ?? null) as Plan | null
        } catch {/* bodyなしでもOK */ }

        const sb = await supabaseServer()
        const { data: auth } = await sb.auth.getUser()
        const user = auth.user
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: billingRaw } = await sb
            .from('user_billing')
            .select('pro_until, plan_tier, stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle()

        const billing = (billingRaw ?? null) as BillingRow | null

        // ❷ Stripe Customer 確保
        let stripeCustomerId = billing?.stripe_customer_id ?? null
        if (!stripeCustomerId) {
            const email = user.email ?? undefined
            const customer = await stripe.customers.create({ email, metadata: { user_id: user.id } })
            stripeCustomerId = customer.id
            await sb.from('user_billing').upsert(
                { user_id: user.id, stripe_customer_id: stripeCustomerId },
                { onConflict: 'user_id' }
            )
        }

        // ❸ 現在の課金状態
        const active = isProDate(billing?.pro_until ?? null)

        if (active) {
            // 既存サブスクの管理へ（Portal）
            const portal = await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId,
                return_url: `${APP_BASE_URL}/account`,
            })
            return NextResponse.json({ url: portal.url })
        }

        // free → Checkout（planがnullなら既定pro）
        const chosen = plan ?? 'pro'
        const price = chosen === 'pro' ? PRICE_PRO : PRICE_PRO_PLUS
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: stripeCustomerId,
            line_items: [{ price, quantity: 1 }],
            success_url: `${APP_BASE_URL}/account?ok=1`,
            cancel_url: `${APP_BASE_URL}/pricing?canceled=1`,
            allow_promotion_codes: true,
        })
        return NextResponse.json({ url: session.url })
    } catch (e) {
        console.error('[/api/billing/start] error:', e)
        return NextResponse.json({ error: 'Failed to start billing' }, { status: 500 })
    }
}

// ✅ POST本体
export async function POST(req: NextRequest) {
    return handleStart(req)
}

// ✅ デバッグ/スモークテスト用：GETでも同じ挙動にしておく
export async function GET(req: NextRequest) {
    return handleStart(req)
}
