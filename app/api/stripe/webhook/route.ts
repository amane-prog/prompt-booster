// app/api/stripe/webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ========== ENV ==========
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string
if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set')
if (!WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET not set')

// apiVersion は明示しない（アカウント既定）
const stripe = new Stripe(STRIPE_SECRET_KEY)

type PlanTier = 'free' | 'pro' | 'pro_plus'

// Price IDs（必須：本番環境に設定）
const PRO_PRICE_ID = process.env.STRIPE_PRICE_ID_PRO ?? process.env.STRIPE_PRICE_ID
const PRO_PLUS_PRICE_ID = process.env.STRIPE_PRICE_ID_PRO_PLUS
const TOPUP_300_PRICE_ID = process.env.STRIPE_PRICE_ID_TOPUP_300
const TOPUP_1000_PRICE_ID = process.env.STRIPE_PRICE_ID_TOPUP_1000

// Topup 有効期限（デフォ 90日）
const TOPUP_EXPIRES_IN_DAYS = Number(process.env.TOPUP_EXPIRES_IN_DAYS ?? 90)

// ========== helpers ==========
const toIso = (sec?: number | null) =>
    (typeof sec === 'number' ? new Date(sec * 1000).toISOString() : null)

const addDays = (d: Date, days: number) => {
    const x = new Date(d)
    x.setUTCDate(x.getUTCDate() + days)
    return x
}

/**
 * Stripeの型差（Response<Subscription> / Subscription）を吸収して
 * current_period_end（秒）を安全に取り出す。
 * ここだけ any を使い、他は型安全を維持。
 */
function getSubPeriodEndTs(
    sub: Stripe.Subscription | Stripe.Response<Stripe.Subscription>
): number | null {
    const s: any = (sub as any)?.data ? (sub as any).data : sub // Response unwrap
    const items: any[] = s?.items?.data ?? []
    const itemEnds = items
        .map(it => (typeof it?.current_period_end === 'number' ? it.current_period_end : undefined))
        .filter((n: any): n is number => typeof n === 'number' && Number.isFinite(n))
    if (itemEnds.length) return Math.min(...itemEnds)
    return typeof s?.current_period_end === 'number' ? s.current_period_end : null
}

/** price.id の配列を安全に取り出す（helperに閉じ込める） */
function priceIdsOfSub(
    sub: Stripe.Subscription | Stripe.Response<Stripe.Subscription>
): string[] {
    const s: any = (sub as any)?.data ? (sub as any).data : sub
    const items: any[] = s?.items?.data ?? []
    return items.map(it => it?.price?.id).filter((v: any) => typeof v === 'string')
}

function tierFromPriceIds(ids: string[]): PlanTier | null {
    if (ids?.length) {
        if (PRO_PLUS_PRICE_ID && ids.includes(PRO_PLUS_PRICE_ID)) return 'pro_plus'
        if (PRO_PRICE_ID && ids.includes(PRO_PRICE_ID)) return 'pro'
    }
    return null
}

function userIdFromMeta(meta: Stripe.Metadata | null | undefined): string | null {
    const v = meta?.['userId'] ?? meta?.['uid']
    return typeof v === 'string' && v.length > 0 ? v : null
}

async function resolveUserIdFromCustomerId(
    customerId: string,
    sb: Awaited<ReturnType<typeof supabaseAdmin>>
): Promise<string | null> {
    // 1) DBのマッピング（最速）
    try {
        const { data } = await sb
            .from('user_billing')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .limit(1)
        if (data?.[0]?.user_id) return data[0].user_id as string
    } catch { /* noop */ }

    // 2) Stripe Customer metadata
    try {
        const cust = await stripe.customers.retrieve(customerId)
        if (!('deleted' in cust)) {
            const u = userIdFromMeta(cust.metadata)
            if (u) return u
        }
    } catch { /* noop */ }

    return null
}

// ========== handler ==========
export async function POST(req: NextRequest) {
    const sig = req.headers.get('stripe-signature')
    if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

    const raw = await req.text()

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(raw, sig, WEBHOOK_SECRET)
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message || 'bad signature' }, { status: 400 })
    }

    try {
        const sb = await supabaseAdmin()

        switch (event.type) {
            // -----------------------------
            // Checkout 完了（Topup / Sub 初回）
            // -----------------------------
            case 'checkout.session.completed': {
                const s = event.data.object as Stripe.Checkout.Session
                const customerId = typeof s.customer === 'string' ? s.customer : s.customer?.id
                if (!customerId) break

                const userId =
                    userIdFromMeta(s.metadata) ||
                    (await resolveUserIdFromCustomerId(customerId, sb))
                if (!userId) break

                // ---- Topup（one-time payment）----
                const isTopup = s.mode === 'payment' || !s.subscription
                if (isTopup && s.payment_status === 'paid') {
                    try {
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
                            const expireAt = addDays(new Date(), TOPUP_EXPIRES_IN_DAYS).toISOString()
                            const { error } = await sb
                                .from('user_topups')
                                .upsert(
                                    {
                                        user_id: userId,
                                        amount: add,
                                        remain: add,
                                        expire_at: expireAt,
                                        stripe_event_id: event.id, // ← unique で冪等
                                    },
                                    { onConflict: 'stripe_event_id' }
                                )
                            if (error) console.error('[topup upsert error]', error)
                        } else {
                            console.warn('[topup] priceId mismatch or env not set', {
                                TOPUP_300_PRICE_ID, TOPUP_1000_PRICE_ID, sessionId: s.id
                            })
                        }
                    } catch (e) {
                        console.error('[topup process error]', e)
                    }
                }

                // ---- Subscription（初回確定）----
                if (s.subscription) {
                    const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription.id
                    if (subId) {
                        const sub = await stripe.subscriptions.retrieve(subId) // Response<Subscription>
                        const ids = priceIdsOfSub(sub)
                        const tier = tierFromPriceIds(ids)
                        if (tier) {
                            const until = toIso(getSubPeriodEndTs(sub))
                            const { error } = await sb.from('user_billing').upsert(
                                { user_id: userId, stripe_customer_id: customerId, plan_tier: tier, pro_until: until },
                                { onConflict: 'user_id' }
                            )
                            if (error) console.error('[billing upsert error: checkout.completed]', error)
                        } else {
                            console.warn('[sub] unknown price ids:', ids)
                        }
                    }
                }
                break
            }

            // -----------------------------
            // サブスク更新/作成（プランや期間の更新）
            // -----------------------------
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription
                const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
                const uid =
                    userIdFromMeta(sub.metadata) ||
                    (await resolveUserIdFromCustomerId(customerId, sb))
                if (!uid) break

                const ids = priceIdsOfSub(sub)
                const tier = tierFromPriceIds(ids)
                if (!tier) break

                const until = toIso(getSubPeriodEndTs(sub))
                const { error } = await sb.from('user_billing').upsert(
                    { user_id: uid, stripe_customer_id: customerId, plan_tier: tier, pro_until: until },
                    { onConflict: 'user_id' }
                )
                if (error) console.error('[billing upsert error: sub.updated]', error)
                break
            }

            // -----------------------------
            // サブスク削除（free 化）
            // -----------------------------
            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription
                const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
                const uid = await resolveUserIdFromCustomerId(customerId, sb)
                if (!uid) break

                const { error } = await sb.from('user_billing').upsert(
                    { user_id: uid, stripe_customer_id: customerId, plan_tier: 'free', pro_until: null },
                    { onConflict: 'user_id' }
                )
                if (error) console.error('[billing upsert error: sub.deleted]', error)
                break
            }

            default:
                // 使わないイベントは黙って 200
                break
        }

        return new NextResponse(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        })
    } catch (e) {
        console.error('[stripe webhook error]', e)
        return NextResponse.json({ error: (e as Error).message || 'webhook error' }, { status: 500 })
    }
}
