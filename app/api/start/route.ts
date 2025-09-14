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

const PRICE_PRO = process.env.STRIPE_PRICE_PRO!         // price_xxx
const PRICE_PRO_PLUS = process.env.STRIPE_PRICE_PRO_PLUS! // price_xxx
const APP_BASE_URL = process.env.APP_BASE_URL!           // ��: https://prompt-booster.app

export async function POST(req: NextRequest) {
    try {
        const { plan }: { plan: Plan } = await req.json()
        if (plan !== 'pro' && plan !== 'pro_plus') {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        const sb = await supabaseServer()
        const { data: auth } = await sb.auth.getUser()
        const user = auth.user
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // ---- 1) �����p��Stripe Customer��p�Ӂi�Ȃ���΍쐬�j
        const { data: billingRaw } = await sb
            .from('user_billing')
            .select('pro_until, plan_tier, stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle()

        const billing = (billingRaw ?? null) as BillingRow | null

        let stripeCustomerId = billing?.stripe_customer_id ?? null
        if (!stripeCustomerId) {
            // email�̓}�W�b�N�����N�݂̂Ƃ̂��ƂȂ̂�auth.user����擾
            const email = user.email ?? undefined
            const customer = await stripe.customers.create({
                email,
                metadata: { user_id: user.id },
            })
            stripeCustomerId = customer.id

            // �ۑ��iRLS�͂���API��server���Ȃ�OK�j
            await sb
                .from('user_billing')
                .upsert({
                    user_id: user.id,
                    stripe_customer_id: stripeCustomerId,
                }, { onConflict: 'user_id' })
        }

        // ---- 2) ���ݏ�Ԃ𔻒�ipro_until���L���Ȃ�active�����j
        const active = isProDate(billing?.pro_until ?? null)

        if (active) {
            // �����T�u�X�N�Ǘ���Portal��
            const portal = await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId,
                return_url: `${APP_BASE_URL}/account`,
            })
            return NextResponse.json({ url: portal.url })
        }

        // ---- 3) �V�K�w����Checkout��
        const price = plan === 'pro' ? PRICE_PRO : PRICE_PRO_PLUS
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: stripeCustomerId, // ����Customer�ɕR�t��
            line_items: [{ price, quantity: 1 }],
            success_url: `${APP_BASE_URL}/account?ok=1`,
            cancel_url: `${APP_BASE_URL}/pricing?canceled=1`,
            allow_promotion_codes: true,
        })

        return NextResponse.json({ url: session.url })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Failed to start billing' }, { status: 500 })
    }
}
