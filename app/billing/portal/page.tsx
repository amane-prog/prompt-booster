// app/billing/portal/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PortalResponse = { url?: string; error?: string };

// .next/types が Promise<any> を許容しているため、Promise互換に揃える（any不使用）
type PageProps = {
    params?: Promise<Record<string, string | string[]>>;
    searchParams?: Promise<Record<string, string | string[]>>;
};

export default function BillingPortalPage(_props: PageProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unauthorized, setUnauthorized] = useState(false);

    async function openPortal() {
        setLoading(true);
        setError(null);
        setUnauthorized(false);
        try {
            const res = await fetch('/api/stripe/portal', { method: 'POST' });
            if (res.status === 401) {
                setUnauthorized(true);
                setLoading(false);
                return;
            }
            const j = (await res.json()) as PortalResponse;
            if (j.url) {
                window.location.href = j.url;
                return;
            }
            setError(j.error ?? 'Failed to open Customer Portal.');
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void openPortal();
    }, []);

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4">
            <div className="w-full rounded-2xl border bg-white p-6 shadow-sm">
                <h1 className="text-lg font-semibold">Manage subscription</h1>
                <p className="mt-2 text-sm text-neutral-600">
<<<<<<< HEAD
                    {loading
                        ? 'Opening Stripe Customer Portal…'
                        : error ?? (unauthorized ? 'Please sign in.' : 'Ready.')}
=======
                    {loading ? 'Opening Stripe Customer Portal驕ｯ・ｶ繝ｻ・ｦ' : (error ?? (unauthorized ? 'Please sign in.' : 'Ready.'))}
>>>>>>> deploy-test
                </p>

                {!loading && (error || unauthorized) && (
                    <div className="mt-4 rounded-md border bg-neutral-50 p-3 text-sm text-neutral-800">
                        {unauthorized
                            ? 'Please sign in to manage your subscription.'
                            : error}
                    </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                        onClick={openPortal}
                        className="rounded bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
                        disabled={loading}
                    >
                        Open Portal
                    </button>
                    {unauthorized ? (
                        <Link
                            href="/signin"
                            className="rounded border px-4 py-2 text-sm hover:bg-neutral-50"
                        >
                            Sign in
                        </Link>
                    ) : (
                        <Link
                            href="/"
                            className="rounded border px-4 py-2 text-sm hover:bg-neutral-50"
                        >
                            Back
                        </Link>
                    )}
                </div>

                <p className="mt-4 text-xs text-neutral-500">
                    You can change plan, cancel, update card, and view invoices in the
                    Stripe Customer Portal.
                </p>
            </div>
        </div>
    );
}
