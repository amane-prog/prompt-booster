// app/api/stripe/addon/route.ts
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
});


export async function POST(req: Request) {
    const sb = await supabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user?.id || !user.email) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // 郢晢ｽｻ繝ｻ・ｽ繝ｻ繧・・繝ｻ・ｿ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ繝ｻ荵苓・繝ｻ・ｿ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ繝ｻ闃ｽ・ｿ・ｽ闔ｨ螟ｲ・ｽ・ｿ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽp郢晢ｽｻ繝ｻ・ｽb郢晢ｽｻ繝ｻ・ｽN郢晢ｽｻ繝ｻ・ｽp郢晢ｽｻ繝ｻ・ｽ繝ｻ蠕｡・ｼ螟ｲ・ｽ・ｿ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽiID郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ繝ｻ譎・・繝ｻ・ｿ繝ｻ・ｽ
    const priceId = process.env.STRIPE_PRICE_ID_ADDON
    if (!priceId) return NextResponse.json({ error: 'missing price id' }, { status: 500 })

    // Customer郢晢ｽｻ繝ｻ・ｽm郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ
    const found = await stripe.customers.list({ email: user.email, limit: 1 })
    const customer = found.data[0] ??
        (await stripe.customers.create({ email: user.email, metadata: { userId: user.id } }))

    // Checkout 郢晢ｽｻ繝ｻ・ｽZ郢晢ｽｻ繝ｻ・ｽb郢晢ｽｻ繝ｻ・ｽV郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｬ
    const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'http://localhost:3000'
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
