// app/api/stripe/webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string

if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set')
if (!WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET not set')

// apiVersion は明示しない（アカウント既定を使用して将来の互換性エラーを避ける）
const stripe = new Stripe(STRIPE_SECRET_KEY)

type PlanTier = 'free' | 'pro' | 'pro_plus'

const PRO_PLUS_PRICE_ID = process.env.STRIPE_PRICE_ID_PRO_PLUS
const PRO_PRICE_ID = process.env.STRIPE_PRICE_ID_PRO ?? process.env.STRIPE_PRICE_ID
const TOPUP_300_PRICE_ID = process.env.STRIPE_PRICE_ID_TOPUP_300
const TOPUP_1000_PRICE_ID = process.env.STRIPE_PRICE_ID_TOPUP_1000

function isCustomer(obj: Stripe.Customer | Stripe.DeletedCustomer): obj is Stripe.Customer {
    return !('deleted' in obj)
}

function toIso(sec?: number | null): string | null {
    return typeof sec === 'number' ? new Date(sec * 1000).toISOString() : null
}

function userIdFromMeta(m: Stripe.Metadata | null | undefined): string | null {
    const v = m?.['userId']
    return typeof v === 'string' && v.length > 0 ? v : null
}

async function resolveUserIdFromCustomerId(customerId: string): Promise<string | null> {
    try {
        const custResp = await stripe.customers.retrieve(customerId)
        if (isCustomer(custResp)) {
            const u = custResp.metadata?.userId
            if (typeof u === 'string' && u) return u
        }
    } catch {
        // noop
    }
    return null
}

// Basil系の item.current_period_end だけに依存せず、無ければ subscription.current_period_end を使う
function minItemPeriodEnd(sub: Stripe.Subscription): number | null {
    const ends = (sub.items?.data ?? [])
        .map(i => (i as any).current_period_end as number | undefined)
        .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))

    if (ends.length) return Math.min(...ends)
    const subEnd = (sub as any).current_period_end as number | undefined
    return typeof subEnd === 'number' ? subEnd : null
}

export async function POST(req: NextRequest) {
    const sig = req.headers.get('stripe-signature')
    if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

    const raw = await req.text()

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET)
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'bad signature'
        return NextResponse.json({ error: msg }, { status: 400 })
    }

    try {
        const sb = await supabaseAdmin()

        switch (event.type) {
            case 'checkout.session.completed': {
                const s = event.data.object as Stripe.Checkout.Session
                const customerId = typeof s.customer === 'string' ? s.customer : s.customer?.id
                if (!customerId) break

                const userId = userIdFromMeta(s.metadata) ?? (await resolveUserIdFromCustomerId(customerId))
                if (!userId) break

                // --- Top-up（one-time payment）処理 ---
                const isTopup = s.mode === 'payment' || !s.subscription
                if (isTopup && s.payment_status === 'paid') {
                    const items = await stripe.checkout.sessions.listLineItems(s.id, { limit: 20 })
                    const add = items.data.reduce((sum, li) => {
                        const pid = typeof li.price === 'string' ? li.price : li.price?.id
                        const qty = li.quantity ?? 1
                        if (!pid) return sum
                        if (pid === TOPUP_300_PRICE_ID) return sum + 300 * qty
                        if (pid === TOPUP_1000_PRICE_ID) return sum + 1000 * qty
                        return sum
                    }, 0)

                    if (add > 0) {
                        const expireAt = new Date()
                        expireAt.setMonth(expireAt.getMonth() + 3) // 3ヶ月
                        const { error } = await sb.from('user_topups').upsert(
                            {
                                user_id: userId,
                                amount: add,
                                remain: add,
                                expire_at: expireAt.toISOString(),
                                stripe_event_id: event.id,
                            },
                            { onConflict: 'stripe_event_id' }
                        )
                        if (error) {
                            console.error('[topup upsert error]', error)
                            // 重要: ここで throw しない（Stripeに5xx返すとリトライ地獄になる）
                        }
                    } else {
                        console.warn('[topup] priceId mismatch or env not set', {
                            TOPUP_300_PRICE_ID, TOPUP_1000_PRICE_ID, sessionId: s.id
                        })
                    }
                }

                // --- サブスク確定（初回） ---
                if (s.subscription) {
                    const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription.id
                    if (subId) {
                        const sub = (await stripe.subscriptions.retrieve(subId)) as Stripe.Subscription
                        const items = sub.items?.data ?? []
                        const priceIds = items.map(i => i.price?.id).filter(Boolean) as string[]

                        let plan: Exclude<PlanTier, 'free'> = 'pro'
                        if (PRO_PLUS_PRICE_ID && priceIds.includes(PRO_PLUS_PRICE_ID)) plan = 'pro_plus'

                        const periodEndTs = minItemPeriodEnd(sub)
                        const periodEnd = toIso(periodEndTs)

                        await sb.from('user_billing').upsert(
                            {
                                user_id: userId,
                                stripe_customer_id: customerId,
                                plan_tier: plan,
                                pro_until: periodEnd,
                            },
                            { onConflict: 'user_id' }
                        )
                    }
                }

                break
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription
                const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
                const userId = userIdFromMeta(sub.metadata) ?? (await resolveUserIdFromCustomerId(customerId))
                if (!userId) break

                const items = sub.items?.data ?? []
                const priceIds = items.map(i => i.price?.id).filter(Boolean) as string[]

                let plan: Exclude<PlanTier, 'free'> = 'pro'
                if (PRO_PLUS_PRICE_ID && priceIds.includes(PRO_PLUS_PRICE_ID)) plan = 'pro_plus'

                const periodEndTs = minItemPeriodEnd(sub)
                const periodEnd = toIso(periodEndTs)

                await sb.from('user_billing').upsert(
                    { user_id: userId, stripe_customer_id: customerId, plan_tier: plan, pro_until: periodEnd },
                    { onConflict: 'user_id' }
                )
                break
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription
                const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
                const userId = userIdFromMeta(sub.metadata) ?? (await resolveUserIdFromCustomerId(customerId))
                if (!userId) break

                await sb.from('user_billing').upsert(
                    { user_id: userId, stripe_customer_id: customerId, plan_tier: 'free', pro_until: null },
                    { onConflict: 'user_id' }
                )
                break
            }

            default:
                // 未使用イベントは 200 で握りつぶす
                break
        }

        return new NextResponse(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        })
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'webhook error'
        console.error('[stripe webhook error]', e)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
