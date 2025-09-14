// app/api/stripe/webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// -------- ENV / Clients --------
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string
if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set')
if (!WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET not set')

const stripe = new Stripe(STRIPE_SECRET_KEY)

type PlanTier = 'free' | 'pro' | 'pro_plus'

// ★ 環境変数の “表記ブレ” を吸収（どれか1つでも入っていればOK）
const PRICE_PRO =
    process.env.STRIPE_PRICE_PRO
    ?? process.env.STRIPE_PRICE_ID_PRO
    ?? process.env.STRIPE_PRICE_ID      // 旧名
    ?? null

const PRICE_PRO_PLUS =
    process.env.STRIPE_PRICE_PRO_PLUS
    ?? process.env.STRIPE_PRICE_ID_PRO_PLUS
    ?? null

const PRICE_TOPUP_300 =
    process.env.STRIPE_PRICE_TOPUP_300
    ?? process.env.STRIPE_PRICE_ID_TOPUP_300
    ?? null

const PRICE_TOPUP_1000 =
    process.env.STRIPE_PRICE_TOPUP_1000
    ?? process.env.STRIPE_PRICE_ID_TOPUP_1000
    ?? null

// 期限（日）: 既定 90
const TOPUP_EXPIRES_IN_DAYS = Number(process.env.TOPUP_EXPIRES_IN_DAYS ?? 90)

// -------- helpers --------
const toIso = (sec?: number | null) =>
    (typeof sec === 'number' ? new Date(sec * 1000).toISOString() : null)

const addDays = (d: Date, days: number) => {
    const x = new Date(d)
    x.setUTCDate(x.getUTCDate() + days)
    return x
}

// 型差吸収（Response<Subscription> / Subscription）
function getSubPeriodEndTs(
    sub: Stripe.Subscription | Stripe.Response<Stripe.Subscription>
): number | null {
    const s: any = (sub as any)?.data ? (sub as any).data : sub
    const items: any[] = s?.items?.data ?? []
    const itemEnds = items
        .map(it => (typeof it?.current_period_end === 'number' ? it.current_period_end : undefined))
        .filter((n: any): n is number => typeof n === 'number' && Number.isFinite(n))
    if (itemEnds.length) return Math.min(...itemEnds)
    return typeof s?.current_period_end === 'number' ? s.current_period_end : null
}

function priceIdsOfSub(
    sub: Stripe.Subscription | Stripe.Response<Stripe.Subscription>
): string[] {
    const s: any = (sub as any)?.data ? (sub as any).data : sub
    const items: any[] = s?.items?.data ?? []
    return items.map(it => it?.price?.id).filter((v: any) => typeof v === 'string')
}

// -- 価格→プラン判定（env一致 or lookup_key / nickname / product.metadata.tier でフォールバック）
function tierFromPrice(
    price: Stripe.Price | null | undefined
): PlanTier | null {
    if (!price) return null
    const id = typeof price.id === 'string' ? price.id : null
    const lookup = typeof price.lookup_key === 'string' ? price.lookup_key : null
    const nick = typeof price.nickname === 'string' ? price.nickname.toLowerCase() : ''
    const prodMeta: Record<string, any> =
        (typeof (price.product as any)?.metadata === 'object' && (price.product as any)?.metadata) || {}

    // 1) env マッチ
    if (id && PRICE_PRO_PLUS && id === PRICE_PRO_PLUS) return 'pro_plus'
    if (id && PRICE_PRO && id === PRICE_PRO) return 'pro'

    // 2) lookup_key マッチ（例: 'pro_plus', 'pro'）
    if (lookup === 'pro_plus') return 'pro_plus'
    if (lookup === 'pro') return 'pro'

    // 3) nickname にヒント（plus を含むなら pro_plus）
    if (/\bplus\b|pro\+|pro plus/i.test(nick)) return 'pro_plus'
    if (/\bpro\b/i.test(nick)) return 'pro'

    // 4) product.metadata.tier
    const tier = String(prodMeta.tier || '').toLowerCase()
    if (tier === 'pro_plus' || tier === 'plus' || tier === 'pro+') return 'pro_plus'
    if (tier === 'pro') return 'pro'

    return null
}

// Subscription 全体から判定
function tierFromSubscription(
    sub: Stripe.Subscription | Stripe.Response<Stripe.Subscription>
): PlanTier | null {
    const s: any = (sub as any)?.data ? (sub as any).data : sub
    const items: any[] = s?.items?.data ?? []
    // 複数ある場合は “強い方（pro_plus）優先”
    let found: PlanTier | null = null
    for (const it of items) {
        const t = tierFromPrice(it?.price)
        if (t === 'pro_plus') return 'pro_plus'
        if (t === 'pro') found = 'pro'
    }
    return found
}

function userIdFromMeta(meta: Stripe.Metadata | null | undefined): string | null {
    const v = meta?.['userId'] ?? meta?.['uid']
    return typeof v === 'string' && v.length > 0 ? v : null
}

async function resolveUserIdFromCustomerId(
    customerId: string,
    sb: Awaited<ReturnType<typeof supabaseAdmin>>
): Promise<string | null> {
    // 1) DB マッピング
    try {
        const { data } = await sb.from('user_billing').select('user_id').eq('stripe_customer_id', customerId).limit(1)
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

// Topup line item を “何クレジットか” に分類（env不一致でも lookup_key / nickname にフォールバック）
function classifyTopupLineItem(li: Stripe.LineItem): number {
    const price = li.price as Stripe.Price | null
    const id = typeof price?.id === 'string' ? price!.id : null
    const lookup = typeof price?.lookup_key === 'string' ? price!.lookup_key : null
    const nick = typeof price?.nickname === 'string' ? price!.nickname.toLowerCase() : ''
    const qty = li.quantity ?? 1

    // 1) env マッチ
    if (id && PRICE_TOPUP_300 && id === PRICE_TOPUP_300) return 300 * qty
    if (id && PRICE_TOPUP_1000 && id === PRICE_TOPUP_1000) return 1000 * qty

    // 2) lookup_key（例: 'topup_300', 'topup_1000'）
    if (lookup === 'topup_300') return 300 * qty
    if (lookup === 'topup_1000') return 1000 * qty

    // 3) nickname に数字
    if (/\b1000\b/.test(nick)) return 1000 * qty
    if (/\b300\b/.test(nick)) return 300 * qty

    return 0
}

// -------- handler --------
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
                if (!userId) {
                    console.warn('[webhook] no userId resolvable for customer', customerId, { sessionId: s.id })
                    break
                }

                // ---- Topup（one-time payment）----
                const isTopup = s.mode === 'payment' || !s.subscription
                if (isTopup && s.payment_status === 'paid') {
                    try {
                        const items = await stripe.checkout.sessions.listLineItems(s.id, { limit: 20 })
                        const add = items.data.reduce((sum, li) => sum + classifyTopupLineItem(li), 0)

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
                                        stripe_event_id: event.id, // unique で冪等
                                    },
                                    { onConflict: 'stripe_event_id' }
                                )
                            if (error) console.error('[topup upsert error]', error)
                            else console.log('[topup upsert ok]', { userId, add, expireAt })
                        } else {
                            console.warn('[topup] could not classify line items', {
                                sessionId: s.id,
                                price_env: { PRICE_TOPUP_300, PRICE_TOPUP_1000 }
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
                        const tier = tierFromSubscription(sub)
                        if (tier) {
                            const until = toIso(getSubPeriodEndTs(sub))
                            const { error } = await sb.from('user_billing').upsert(
                                { user_id: userId, stripe_customer_id: customerId, plan_tier: tier, pro_until: until },
                                { onConflict: 'user_id' }
                            )
                            if (error) console.error('[billing upsert error: checkout.completed]', error)
                            else console.log('[billing upsert ok: checkout.completed]', { userId, tier, until })
                        } else {
                            const ids = priceIdsOfSub(sub)
                            console.warn('[sub] unknown price ids (env mismatch?)', { ids, env: { PRICE_PRO, PRICE_PRO_PLUS } })
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
                if (!uid) {
                    console.warn('[webhook] no uid for subscription update', { customerId })
                    break
                }

                const tier = tierFromSubscription(sub)
                if (!tier) {
                    const ids = priceIdsOfSub(sub)
                    console.warn('[sub.updated] unknown price ids (env mismatch?)', { ids, env: { PRICE_PRO, PRICE_PRO_PLUS } })
                    break
                }

                const until = toIso(getSubPeriodEndTs(sub))
                const { error } = await sb.from('user_billing').upsert(
                    { user_id: uid, stripe_customer_id: customerId, plan_tier: tier, pro_until: until },
                    { onConflict: 'user_id' }
                )
                if (error) console.error('[billing upsert error: sub.updated]', error)
                else console.log('[billing upsert ok: sub.updated]', { uid, tier, until })
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
                else console.log('[billing upsert ok: sub.deleted]', { uid })
                break
            }

            default:
                // 未使用イベントは 200
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
