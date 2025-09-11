// app/api/stripe/portal/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { supabaseServer } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

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

        // Origin allowlist郢晢ｽｻ郢晢ｽｻSRF鬩搾ｽｱ繝ｻ・ｩ髯ｷ・･鬲・ｼ夲ｽｽ・ｼ郢晢ｽｻ
        const hdrs = await headers();
        const origin = computeOrigin(hdrs);
        const allowed = new Set([
            process.env.NEXT_PUBLIC_SITE_ORIGIN,
            'http://localhost:3000',
        ].filter(Boolean) as string[]);
        if (!allowed.has(origin)) {
            return NextResponse.json({ error: 'forbidden origin' }, { status: 403 });
        }

        // 鬮ｴ隨ｬ・ｳ謔滄飭髯ｷ莠･迴ｾ郢晢ｽｻ驛｢譎｢・ｽ・ｭ驛｢・ｧ繝ｻ・ｱ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ髣皮甥ﾂ・･遯ｶ・ｳ驍ｵ・ｺ繝ｻ・ｫ郢晢ｽｻ鬩帙・・ｽ・ｨ・つ鬮ｫ・ｱ隶楢ｲｻ・ｽ・ｸ・つ鬮ｮ蜈ｷ・ｽ・ｫ髫ｲ・､繝ｻ・ｧ郢晢ｽｻ郢晢ｽｻ
        const loc = hdrs.get('cookie')?.match(/NEXT_LOCALE=([^;]+)/)?.[1] ?? 'ja';
        const returnUrl = `${origin}/${encodeURIComponent(loc)}/settings/billing`;

        // 1) DB驍ｵ・ｺ繝ｻ・ｫ髣厄ｽｫ隴取得・ｽ・ｭ闖ｫ・ｶ繝ｻ・ｸ陋ｹ・ｻ遶擾ｽｩ驍ｵ・ｺ繝ｻ・ｮ customerId 驛｢・ｧ髮区ｨ樒・髯ｷ蛹ｻ繝ｻ
        let customerId: string | null = null;
        const { data: billingRow } = await sb
            .from('user_billing')
            .select('stripe_customer_id')
            .eq('user_id', user.id)
            .maybeSingle();
        if (billingRow?.stripe_customer_id) {
            customerId = billingRow.stripe_customer_id as string;
        }

        // 2) 髴取ｻゑｽｽ・｡驍ｵ・ｺ闔会ｽ｣繝ｻ讙趣ｽｸ・ｺ繝ｻ・ｰ Stripe 驍ｵ・ｺ闕ｵ譎｢・ｽ陋ｾﾂ蜈ｷ・ｽ・ｺ鬮ｫ霈斐・髣厄ｽｴ隲帛現繝ｻ 驕ｶ鄙ｫ繝ｻDB髣厄ｽｫ隴取得・ｽ・ｭ郢晢ｽｻ
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

        // 3) Portal 驛｢・ｧ繝ｻ・ｻ驛｢譏ｴ繝ｻ邵ｺ蜥擾ｽｹ譎｢・ｽ・ｧ驛｢譎｢・ｽ・ｳ髣厄ｽｴ隲帛現繝ｻ
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId!,
            return_url: returnUrl,
            configuration: PORTAL_CONFIGURATION_ID, // 髴取ｻゑｽｽ・｡髫ｰ謔ｶ繝ｻ繝ｻ・ｮ陞｢・ｹ遶企・・ｹ・ｧ陷墟ｴripe驛｢譏ｴ繝ｻ郢晢ｽｵ驛｢・ｧ繝ｻ・ｩ驛｢譎｢・ｽ・ｫ驛｢譏ｴ繝ｻ
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
