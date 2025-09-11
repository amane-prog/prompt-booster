import Stripe from 'stripe';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });

type PlanTier = 'pro' | 'pro_plus';

function computeOrigin(req: NextRequest): string {
    return (
        req.headers.get('origin') ??
        `${req.headers.get('x-forwarded-proto') ?? 'https'}://${req.headers.get('host') ?? 'localhost:3000'}`
    );
}

export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const plan = (url.searchParams.get('plan') === 'pro_plus' ? 'pro_plus' : 'pro') as PlanTier;

        const sb = await supabaseServer();
        const { data: { user } } = await sb.auth.getUser();
        if (!user?.id || !user.email) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        // CSRF鬩搾ｽｱ繝ｻ・ｩ髯ｷ・･郢晢ｽｻ Origin allowlist
        const origin = computeOrigin(req);
        const allowed = new Set([
            process.env.NEXT_PUBLIC_SITE_ORIGIN,
            'http://localhost:3000',
        ].filter(Boolean) as string[]);
        if (!allowed.has(origin)) {
            return NextResponse.json({ error: 'forbidden origin' }, { status: 403 });
        }

        const loc = req.cookies.get('NEXT_LOCALE')?.value ?? 'ja';

        // Customer 髫ｶﾂ隲帙・・ｽ・ｴ繝ｻ・｢/髣厄ｽｴ隲帛現繝ｻ
        let customerId: string | null = null;
        try {
            const search = await stripe.customers.search({
                query: `metadata['userId']:'${user.id}'`,
                limit: 1
            });
            customerId = search.data[0]?.id ?? null;
        } catch {
            const list = await stripe.customers.list({ email: user.email, limit: 10 });
            customerId =
                list.data.find(c => (c.metadata?.userId ?? '') === user.id)?.id ??
                list.data[0]?.id ??
                null;
        }
        if (!customerId) {
            const created = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id }
            });
            customerId = created.id;
        }

        // DB髣厄ｽｫ隴取得・ｽ・ｭ陋帙・・ｽ・ｼ闔・･郢晢ｽｻ鬩包ｽｲ郢晢ｽｻupsert郢晢ｽｻ郢晢ｽｻ
        await sb.from('user_billing').upsert(
            { user_id: user.id, stripe_customer_id: customerId },
            { onConflict: 'user_id' }
        );

        // 髣憺屮・ｽ・｡髫ｴ・ｬ繝ｻ・ｼID
        const priceId =
            plan === 'pro_plus'
                ? process.env.STRIPE_PRICE_ID_PRO_PLUS
                : (process.env.STRIPE_PRICE_ID_PRO ?? process.env.STRIPE_PRICE_ID);

        if (!priceId) {
            const missing = plan === 'pro_plus'
                ? 'STRIPE_PRICE_ID_PRO_PLUS'
                : 'STRIPE_PRICE_ID_PRO (or STRIPE_PRICE_ID)';
            return NextResponse.json({ error: `price id not set: set ${missing}` }, { status: 500 });
        }

        // Price sanity check
        try {
            const price = await stripe.prices.retrieve(priceId);
            if (price.active !== true) {
                return NextResponse.json({ error: 'price is not active' }, { status: 500 });
            }
            if (price.type !== 'recurring') {
                return NextResponse.json({ error: 'price must be recurring for subscriptions' }, { status: 500 });
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'retrieve price failed';
            return NextResponse.json({ error: `price lookup failed: ${msg}` }, { status: 500 });
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
        });

        return NextResponse.json(
            { url: session.url },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'checkout error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
