'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingPortalRedirect() {
    const router = useRouter()
    const [msg, setMsg] = useState('Opening billing portal…')

    useEffect(() => {
        let alive = true
            ; (async () => {
                try {
                    const res = await fetch('/api/stripe/portal', { method: 'POST' })
                    // 正常時: { url } / 異常時: { error }
                    const data: { url?: string; error?: string } = await res.json().catch(() => ({} as any))

                    if (!alive) return

                    if (res.ok && data?.url) {
                        location.href = data.url
                        return
                    }

                    setMsg(data?.error || `Open portal failed (${res.status})`)
                    // 数秒後にトップへ戻す
                    setTimeout(() => router.replace('/'), 2500)
                } catch (e) {
                    if (!alive) return
                    setMsg(e instanceof Error ? e.message : 'Portal error')
                    setTimeout(() => router.replace('/'), 2500)
                }
            })()
        return () => {
            alive = false
        }
    }, [router])

    return (
        <main className="grid min-h-[50vh] place-items-center p-8 text-center">
            <div>
                <div className="mb-2 text-sm text-neutral-600">{msg}</div>
                <div className="text-xs text-neutral-400">Please wait…</div>
            </div>
        </main>
    )
}
