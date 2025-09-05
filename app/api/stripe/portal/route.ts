// app/api/stripe/portal/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs' as const;

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const PORTAL_CONFIGURATION_ID = process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined;
const PUBLIC_ORIGIN_FALLBACK = process.env.NEXT_PUBLIC_SITE_ORIGIN || 'http://localhost:3000';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });

function computeOrigin(h: Headers): string {
    const fromOrigin = h.get('origin');
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const host = h.get('host') ?? '';
    const computed = host ? `${proto}://${host}` : PUBLIC_ORIGIN_FALLBACK;
    return fromOrigin ?? computed;
}

export async function POST() {
    try {
        const sb = await supabaseServer();
        const { data: { user } } = await sb.auth.getUser();
        if (!user?.email || !user.id) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }

        // Origin allowlist（CSRF緩和）
        const hdrs = await headers();
        const origin = computeOrigin(hdrs);
        const allowed = new Set([
            process.env.NEXT_PUBLIC_SITE_ORIGIN,
            'http://localhost:3000',
        ].filter(Boolean) as string[]);
        if (!allowed.has(origin)) {
            return NextResponse.json({ error: 'forbidden origin' }, { status: 403 });
        }

        // 返却先はロケール付きに（言語一貫性）
        const loc = hdrs.get('cookie')?.match(/NEXT_LOCALE=([^;]+)/)?.[1] ?? 'ja';
        const returnUrl = `${origin}/${encodeURIComponent(loc)}/settings/billing`;

        // 1) DBに保存済みの customerId を優先
        let customerId: string | null = null;
        const { data: billingRow } = await sb
            .from('user_billing')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle();
        if (billingRow?.stripe_customer_id) {
            customerId = billingRow.stripe_customer_id as string;
        }

        // 2) 無ければ Stripe から発見/作成 → DB保存
        if (!customerId) {
            let found: Stripe.Customer | null = null;
            try {
                const search = await stripe.customers.search({
                    query: `metadata['userId']:'${user.id}'`,
                    limit: 1,
                });
                found = search.data[0] ?? null;
            } catch {
                const list = await stripe.customers.list({ email: user.email, limit: 10 });
                found =
                    list.data.find(c => (c.metadata?.userId ?? '') === user.id) ??
                    list.data[0] ??
                    null;
            }
            if (found) {
                customerId = found.id;
            } else {
                const created = await stripe.customers.create({
                    email: user.email,
                    metadata: { userId: user.id },
                });
                customerId = created.id;
            }
            await sb.from('user_billing').upsert(
                { user_id: user.id, stripe_customer_id: customerId },
                { onConflict: 'user_id' }
            );
        }

        // 3) Portal セッション作成
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId!,
            return_url: returnUrl,
            configuration: PORTAL_CONFIGURATION_ID, // 無指定ならStripeデフォルト
            locale: 'auto',
        });

        return NextResponse.json(
            { url: session.url },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'portal error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
