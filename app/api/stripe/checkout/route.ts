import Stripe from 'stripe'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const stripe = new Stripe(STRIPE_SECRET_KEY) // apiVersion省略で型エラー回避

type PlanTier = 'pro' | 'pro_plus'
const allowlist = (origin: string) => new Set(
    [process.env.APP_BASE_URL, process.env.NEXT_PUBLIC_APP_BASE_URL, 'http://localhost:3000']
        .filter(Boolean) as string[]
).has(origin)

const originOf = (req: NextRequest) =>
    req.headers.get('origin') ??
    `${req.headers.get('x-forwarded-proto') ?? 'https'}://${req.headers.get('host') ?? 'localhost:3000'}`

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const plan = (url.searchParams.get('plan') === 'pro_plus' ? 'pro_plus' : 'pro') as PlanTier

        const sb = await supabaseServer() 
        const { data: { user } } = await sb.auth.getUser()
        if (!user?.id || !user.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

        const origin = originOf(req)
        if (!allowlist(origin)) return NextResponse.json({ error: 'forbidden origin' }, { status: 403 })

        const loc = req.cookies.get('NEXT_LOCALE')?.value ?? 'ja'

        // find/create customer
        let customerId: string | null = null
        try {
            const s = await stripe.customers.search({ query: `metadata['userId']:'${user.id}'`, limit: 1 })
            customerId = s.data[0]?.id ?? null
        } catch { }
        if (!customerId) {
            const list = await stripe.customers.list({ email: user.email, limit: 10 })
            customerId =
                list.data.find(c => (c.metadata?.userId ?? '') === user.id)?.id ??
                list.data[0]?.id ?? null
        }
        if (!customerId) {
            const created = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } })
            customerId = created.id
        }

        // (optional) persist in DB
        await sb.from('user_billing').upsert(
            { user_id: user.id, stripe_customer_id: customerId },
            { onConflict: 'user_id' }
        )

        const priceId =
            plan === 'pro_plus'
                ? process.env.STRIPE_PRICE_ID_PRO_PLUS
                : (process.env.STRIPE_PRICE_ID_PRO ?? process.env.STRIPE_PRICE_ID)
        if (!priceId) {
            const miss = plan === 'pro_plus' ? 'STRIPE_PRICE_ID_PRO_PLUS' : 'STRIPE_PRICE_ID_PRO (or STRIPE_PRICE_ID)'
            return NextResponse.json({ error: `price id not set: ${miss}` }, { status: 500 })
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId!,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${origin}/${encodeURIComponent(loc)}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/${encodeURIComponent(loc)}/billing/canceled`,
            metadata: { userId: user.id, plan },
            subscription_data: { metadata: { userId: user.id, plan } },
            allow_promotion_codes: true,
            locale: 'auto'
        })

        return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'checkout error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
