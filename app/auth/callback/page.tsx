// app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type PageProps = {
    searchParams?: Record<string, string | string[]>
}

export default function AuthCallback(_props: PageProps) {
    const router = useRouter()

    useEffect(() => {
        ; (async () => {
            try {
                // ブラウザでセッション交換
                const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)

                // NEXT_LOCALE クッキーから遷移先決定（未設定なら en）
                const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
                const nextLocale = m?.[1] ?? 'en'
                router.replace(`/${nextLocale}`)

                if (error) console.warn('[auth/callback] exchangeCodeForSession error:', error)
            } catch (e) {
                console.warn('[auth/callback] unexpected error:', e)
                router.replace('/')
            }
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
