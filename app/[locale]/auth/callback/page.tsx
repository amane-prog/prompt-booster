'use client'
import * as React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
    const router = useRouter()
    useEffect(() => {
        ; (async () => {
            try {
                const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
                const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
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
