type PageProps = {
  params?: Record<string, string | string[]>;
  searchParams?: Record<string, string | string[]>;
};
// app/[locale]/billing/portal/page.tsx
'use client'

import { useEffect, useState } from 'react'

export default function BillingPortalLocalePage(_props: PageProps) {
    const [err, setErr] = useState<string | null>(null)

    useEffect(() => {
        (async () => {
            try {
                const r = await fetch('/api/stripe/portal', { method: 'POST' })
                const j = await r.json().catch(() => ({}))
                if (r.ok && j?.url) {
                    location.href = j.url
                } else {
                    setErr(j?.error ?? `Open portal failed (${r.status})`)
                }
            } catch (e) {
                setErr(e instanceof Error ? e.message : 'portal error')
            }
        })()
    }, [])

    return (
        <main className="mx-auto max-w-lg px-4 py-16">
            <h1 className="mb-2 text-lg font-semibold">Billing Portal</h1>
            <p>Redirecting to Stripe…</p>
            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
        </main>
    )
}
