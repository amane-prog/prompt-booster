// app/api/stripe/addon/route.ts
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

// apiVersion は明示しない（アカウント既定を使用）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(req: Request) {
    const sb = await supabaseServer()
    const { data: { user } } = await sb.auth.getUser()

    if (!user?.id || !user.email) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const priceId = process.env.STRIPE_PRICE_ID_ADDON
    if (!priceId) {
        return NextResponse.json({ error: 'missing price id' }, { status: 500 })
    }

    // 既存 Customer をメールで検索、なければ作成
    const found = await stripe.customers.list({ email: user.email, limit: 1 })
    const customer =
        found.data[0] ??
        (await stripe.customers.create({
            email: user.email,
            metadata: { userId: user.id },
        }))

    const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'http://localhost:3000'

    // Add-on を 1 個だけ購入する Checkout Session を作成
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customer.id,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/billing/canceled`,
        metadata: { userId: user.id, type: 'addon' },
    })

    return NextResponse.json({ url: session.url })
}
