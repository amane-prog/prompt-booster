// app/api/stripe/webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---------- ENV ----------
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

const PRICE_PRO =
    process.env.STRIPE_PRICE_PRO ??
    process.env.STRIPE_PRICE_ID_PRO ??
    null;

const PRICE_PRO_PLUS =
    process.env.STRIPE_PRICE_PRO_PLUS ??
    process.env.STRIPE_PRICE_ID_PRO_PLUS ??
    null;

const PRICE_TOPUP_300 =
    process.env.STRIPE_PRICE_TOPUP_300 ??
    process.env.STRIPE_PRICE_ID_TOPUP_300 ??
    null;

const PRICE_TOPUP_1000 =
    process.env.STRIPE_PRICE_TOPUP_1000 ??
    process.env.STRIPE_PRICE_ID_TOPUP_1000 ??
    null;

const TOPUP_EXPIRES_IN_DAYS = Number(process.env.TOPUP_EXPIRES_IN_DAYS ?? 90);

if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
if (!STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET not set');

const stripe = new Stripe(STRIPE_SECRET_KEY);

type PlanTier = 'free' | 'pro' | 'pro_plus';

// ---------- utils ----------
const toIso = (sec: number | null | undefined): string | null =>
    typeof sec === 'number' ? new Date(sec * 1000).toISOString() : null;

function addDaysUTC(d: Date, days: number): string {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + days);
    return x.toISOString();
}

function userIdFromMeta(meta: Stripe.Metadata | null | undefined): string | null {
    const v = meta?.['userId'] ?? meta?.['uid'];
    return typeof v === 'string' && v.length > 0 ? v : null;
}

async function resolveUserIdFromCustomerId(
    customerId: string,
    sb: Awaited<ReturnType<typeof supabaseAdmin>>
): Promise<string | null> {
    try {
        const { data } = await sb
            .from('user_billing')
            .select('user_id')
            .eq('stripe_customer_id', customerId)
            .limit(1);
        if (data?.[0]?.user_id) return String(data[0].user_id);
    } catch { /* noop */ }
    return null;
}

async function resolveUserIdFromCustomerEmail(
    customerId: string,
    sb: Awaited<ReturnType<typeof supabaseAdmin>>
): Promise<string | null> {
    try {
        const cust = await stripe.customers.retrieve(customerId);
        if ('deleted' in cust) return null;
        const email = typeof cust.email === 'string' ? cust.email : null;
        if (!email) return null;

        const { data } = await sb
            .from('profiles')
            .select('user_id')
            .eq('email', email)
            .limit(1);
        if (data?.[0]?.user_id) return String(data[0].user_id);
    } catch { /* noop */ }
    return null;
}

// ---- 型差吸収（旧 plan/新 price、型定義の抜けを許容） ----
function subItems(sub: Stripe.Subscription): Array<any> {
    const items = (sub as any)?.items?.data ?? [];
    return Array.isArray(items) ? items : [];
}
function itemPriceId(item: any): string | null {
    const pid = item?.price?.id ?? item?.plan?.id ?? null;
    return typeof pid === 'string' ? pid : null;
}
function subCurrentPeriodEnd(sub: Stripe.Subscription): number | null {
    const end = (sub as any)?.current_period_end;
    return typeof end === 'number' ? end : null;
}
function invoiceFirstLine(inv: Stripe.Invoice): any | null {
    const li = inv?.lines?.data?.[0] ?? null;
    return li ?? null;
}
function invoiceLinePriceId(li: any): string | null {
    const pid = li?.price?.id ?? li?.plan?.id ?? null;
    return typeof pid === 'string' ? pid : null;
}
function invoiceLinePeriodEnd(li: any): number | null {
    const end = li?.period?.end ?? null;
    return typeof end === 'number' ? end : null;
}

// ---- 価格ID → tier ----
function tierFromPriceId(priceId: string | null): PlanTier | null {
    if (!priceId) return null;
    if (PRICE_PRO_PLUS && priceId === PRICE_PRO_PLUS) return 'pro_plus';
    if (PRICE_PRO && priceId === PRICE_PRO) return 'pro';
    return null;
}

// ---- Subscription → tier / period ----
function tierFromSubscription(sub: Stripe.Subscription): PlanTier | null {
    let found: PlanTier | null = null;
    for (const it of subItems(sub)) {
        const t = tierFromPriceId(itemPriceId(it));
        if (t === 'pro_plus') return 'pro_plus';
        if (t === 'pro') found = 'pro';
    }
    return found;
}
function subPeriodEnd(sub: Stripe.Subscription): number | null {
    return subCurrentPeriodEnd(sub);
}

// ---- Topup line item 判定（price/plan 両対応）----
function classifyTopupLineItem(li: Stripe.LineItem): number {
    const anyLi = li as any;
    const qty = typeof anyLi.quantity === 'number' ? anyLi.quantity : 1;
    const id = anyLi?.price?.id ?? anyLi?.plan?.id ?? '';
    if (PRICE_TOPUP_1000 && id === PRICE_TOPUP_1000) return 1000 * qty;
    if (PRICE_TOPUP_300 && id === PRICE_TOPUP_300) return 300 * qty;
    return 0;
}

// ---------- handler ----------
export async function POST(req: NextRequest) {
    // 署名検証
    const sig = req.headers.get('stripe-signature');
    if (!sig) {
        console.error('[webhook] missing signature header');
        return NextResponse.json({ error: 'missing signature' }, { status: 400 });
    }

    let raw = '';
    try {
        raw = await req.text();
    } catch (e) {
        console.error('[webhook] read body failed', e);
        return NextResponse.json({ error: 'read body failed' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
    } catch (e) {
        console.error('[webhook] signature verification failed:', (e as Error).message);
        return NextResponse.json({ error: 'bad signature' }, { status: 400 });
    }

    const sb = await supabaseAdmin();

    try {
        switch (event.type) {
            // -----------------------------
            // Checkout 完了（Topup or Sub 初回）
            // -----------------------------
            case 'checkout.session.completed': {
                const s = event.data.object as Stripe.Checkout.Session;
                const customerId =
                    typeof s.customer === 'string' ? s.customer : s.customer?.id ?? null;
                if (!customerId) break;

                // userId 解決の優先順位: client_reference_id → metadata → customerId マップ → email
                const uidFromClientRef =
                    typeof s.client_reference_id === 'string' ? s.client_reference_id : null;

                const userId =
                    uidFromClientRef ||
                    userIdFromMeta(s.metadata) ||
                    (await resolveUserIdFromCustomerId(customerId, sb)) ||
                    (await resolveUserIdFromCustomerEmail(customerId, sb));

                if (!userId) {
                    console.warn('[webhook] userId not resolved for checkout.session.completed', {
                        sessionId: s.id,
                        customerId,
                    });
                    break;
                }

                // Topup (one-time payment)
                const isTopup = s.mode === 'payment' || !s.subscription;
                if (isTopup && s.payment_status === 'paid') {
                    const items = await stripe.checkout.sessions.listLineItems(s.id, { limit: 20 });
                    const add = items.data.reduce((sum, li) => sum + classifyTopupLineItem(li), 0);
                    if (add > 0) {
                        const expireAt = addDaysUTC(new Date(), TOPUP_EXPIRES_IN_DAYS);
                        // stripe_event_id に unique 制約がある想定（冪等）
                        await sb
                            .from('user_topups')
                            .upsert(
                                {
                                    user_id: userId,
                                    amount: add,
                                    remain: add,
                                    expire_at: expireAt,
                                    stripe_event_id: event.id,
                                },
                                { onConflict: 'stripe_event_id' }
                            );
                    } else {
                        console.warn('[webhook] topup classify failed (price env mismatch?)', { sessionId: s.id });
                    }
                }

                // Subscription（初回）
                if (s.subscription) {
                    const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription.id;
                    if (subId) {
                        const sub = await stripe.subscriptions.retrieve(subId);
                        const tier = tierFromSubscription(sub);
                        if (tier) {
                            const until = toIso(subPeriodEnd(sub));
                            await sb
                                .from('user_billing')
                                .upsert(
                                    {
                                        user_id: userId,
                                        stripe_customer_id: customerId,
                                        plan_tier: tier,
                                        pro_until: until,
                                    },
                                    { onConflict: 'user_id' }
                                );
                        } else {
                            console.warn('[webhook] unknown sub price (check PRICE_PRO / PRICE_PRO_PLUS)');
                        }
                    }
                }
                break;
            }

            // -----------------------------
            // サブスク作成/更新
            // -----------------------------
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription;
                const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

                const userId =
                    userIdFromMeta(sub.metadata) ||
                    (await resolveUserIdFromCustomerId(customerId, sb)) ||
                    (await resolveUserIdFromCustomerEmail(customerId, sb));
                if (!userId) {
                    console.warn('[webhook] userId not resolved for subscription update', { customerId });
                    break;
                }

                const tier = tierFromSubscription(sub);
                if (!tier) {
                    console.warn('[webhook] unknown subscription price (PRICE_PRO / PRICE_PRO_PLUS mismatch?)');
                    break;
                }

                const until = toIso(subPeriodEnd(sub));
                await sb
                    .from('user_billing')
                    .upsert(
                        {
                            user_id: userId,
                            stripe_customer_id: customerId,
                            plan_tier: tier,
                            pro_until: until,
                        },
                        { onConflict: 'user_id' }
                    );
                break;
            }

            // -----------------------------
            // サブスク削除（free 化）
            // -----------------------------
            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription;
                const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

                const userId =
                    (await resolveUserIdFromCustomerId(customerId, sb)) ||
                    (await resolveUserIdFromCustomerEmail(customerId, sb));
                if (!userId) break;

                await sb
                    .from('user_billing')
                    .upsert(
                        {
                            user_id: userId,
                            stripe_customer_id: customerId,
                            plan_tier: 'free',
                            pro_until: null,
                        },
                        { onConflict: 'user_id' }
                    );
                break;
            }

            // -----------------------------
            // 請求書支払い成功（継続更新）
            // -----------------------------
            case 'invoice.payment_succeeded': {
                const inv = event.data.object as Stripe.Invoice;
                const customerId = String(inv.customer);

                const userId =
                    (await resolveUserIdFromCustomerId(customerId, sb)) ||
                    (await resolveUserIdFromCustomerEmail(customerId, sb));
                if (!userId) break;

                const li = invoiceFirstLine(inv);
                const priceId = invoiceLinePriceId(li);
                const tier = tierFromPriceId(priceId);
                const periodEnd = invoiceLinePeriodEnd(li);

                if (tier && periodEnd) {
                    await sb
                        .from('user_billing')
                        .upsert(
                            {
                                user_id: userId,
                                stripe_customer_id: customerId,
                                plan_tier: tier,
                                pro_until: toIso(periodEnd),
                            },
                            { onConflict: 'user_id' }
                        );
                } else {
                    console.warn('[webhook] invoice line could not resolve tier/period', { priceId, periodEnd });
                }
                break;
            }

            default:
                // 未使用イベントは成功(200)で返す
                break;
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (e) {
        console.error('[stripe webhook error]', e);
        return NextResponse.json({ error: 'webhook error' }, { status: 500 });
    }
}
