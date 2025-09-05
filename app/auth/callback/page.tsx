'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'   // ★ import 忘れ防止

export default function AuthCallback() {
    const router = useRouter()

    useEffect(() => {
        ; (async () => {
            // ★ トップレベル await を避け、useEffect 内で await
            const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
            // Cookie の NEXT_LOCALE を読んで戻るロケールを決定
            const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
            const nextLocale = m?.[1] || 'en'
            router.replace(`/${nextLocale}`)
            if (error) console.warn('[auth callback] exchange error:', error)
        })()
    }, [router])

    return (
        <div className="grid min-h-[60vh] place-items-center p-8 text-center">
            <div>
                <div className="mb-2 text-sm text-neutral-500">Signing you in…</div>
                <div className="text-xs text-neutral-400">Please wait</div>
            </div>
        </div>
    )
}
