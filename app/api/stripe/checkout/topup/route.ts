// app/api/stripe/checkout/topup/route.ts
import Stripe from 'stripe'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set')
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
});


const PRICE_300 = process.env.STRIPE_PRICE_ID_TOPUP_300 as string
const PRICE_1000 = process.env.STRIPE_PRICE_ID_TOPUP_1000 as string

function computeOrigin(req: NextRequest): string {
    return (
        req.headers.get('origin') ??
        `${req.headers.get('x-forwarded-proto') ?? 'https'}://${req.headers.get('host') ?? 'localhost:3000'}`
    )
}

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const kind = url.searchParams.get('kind') // "300" or "1000"

        const priceId = kind === '1000' ? PRICE_1000 : PRICE_300
        if (!priceId) {
            return NextResponse.json({ error: 'invalid topup kind' }, { status: 400 })
        }

        const sb = await supabaseServer()
        const { data: { user } } = await sb.auth.getUser()
        if (!user?.id || !user.email) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        const origin = computeOrigin(req)
        const loc = req.cookies.get('NEXT_LOCALE')?.value ?? 'en'

        // 鬘ｧ螳｢繧堤｢ｺ菫・
        let customerId: string | null = null
        const list = await stripe.customers.list({ email: user.email, limit: 1 })
        if (list.data.length > 0) {
            customerId = list.data[0].id
        } else {
            const created = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id },
            })
            customerId = created.id
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}&loc=${encodeURIComponent(loc)}`,
            cancel_url: `${origin}/billing/canceled`,
            metadata: { userId: user.id, kind },
            locale: 'auto',
        })

        return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'checkout error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
