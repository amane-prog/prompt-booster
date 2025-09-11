// app/api/stripe/portal/route.ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!
const stripe = new Stripe(STRIPE_SECRET_KEY)

const PORTAL_CONFIGURATION_ID = process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined

// CSRF対策: Origin allowlist
const allowlist = (origin: string) =>
    new Set(
        [process.env.APP_BASE_URL, process.env.NEXT_PUBLIC_APP_BASE_URL, 'http://localhost:3000']
            .filter(Boolean) as string[],
    ).has(origin)

// ReadonlyHeaders / Headers / Promise 差を吸収するための最小インターフェイス
type HeaderLike = { get(name: string): string | null }

const computeOrigin = (h: HeaderLike) => {
    const fromOrigin = h.get('origin')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    const host = h.get('host') ?? ''
    return fromOrigin ?? (host ? `${proto}://${host}` : (process.env.APP_BASE_URL || 'http://localhost:3000'))
}

export async function POST() {
    try {
        const sb = await supabaseServer()
        const { data: { user } } = await sb.auth.getUser()

        if (!user?.email || !user.id) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        // ★ ここを await に変更（Promise<ReadonlyHeaders> 対応）
        const hdrs = await headers()
        const origin = computeOrigin(hdrs)
        if (!allowlist(origin)) {
            return NextResponse.json({ error: 'forbidden origin' }, { status: 403 })
        }

        const loc = hdrs.get('cookie')?.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1] ?? 'ja'
        const returnUrl = `${origin}/${encodeURIComponent(loc)}/settings/billing`

        // 1) DBに保存済みの customer_id を参照
        let customerId: string | null = null
        const { data: row } = await sb
            .from('user_billing')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (row?.stripe_customer_id) {
            customerId = row.stripe_customer_id as string
        }

        // 2) 未保存の場合は Stripe 側を検索 → なければ作成 → DBへ保存
        if (!customerId) {
            let found: Stripe.Customer | null = null
            try {
                const s = await stripe.customers.search({ query: `metadata['userId']:'${user.id}'`, limit: 1 })
                found = s.data[0] ?? null
            } catch {
                const list = await stripe.customers.list({ email: user.email, limit: 10 })
                found = list.data.find(c => (c.metadata?.userId ?? '') === user.id) ?? list.data[0] ?? null
            }

            if (found) {
                customerId = found.id
            } else {
                const created = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } })
                customerId = created.id
            }

            await sb
                .from('user_billing')
                .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' })
        }

        // 3) Billing Portal セッションを作成
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId!,
            return_url: returnUrl,
            configuration: PORTAL_CONFIGURATION_ID,
            locale: 'auto',
        })

        return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'portal error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
