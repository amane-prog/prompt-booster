'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabaseClient' // ★ これが無いと「Cannot find name 'supabase'」

export default function SignInPage() {
    const t = useTranslations()
    const router = useRouter()
    const [email, setEmail] = useState('')         // ★ email を用意（shorthand error対策）
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email) return

        setLoading(true)
        setMsg(null)
        try {
            // ★ 変数名は 'origin' と被りやすいので siteOrigin に
            const siteOrigin =
                typeof window !== 'undefined'
                    ? window.location.origin
                    : process.env.NEXT_PUBLIC_SITE_ORIGIN || 'http://localhost:3000'

            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${siteOrigin}/auth/callback` }, // ★ callbackへ
            })

            if (error) {
                setMsg(error.message)
            } else {
                setMsg(t.has('signin.checkMail') ? t('signin.checkMail') : 'Check your email for the magic link.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mx-auto max-w-md p-6">
            <h1 className="mb-4 text-lg font-semibold">{t.has('signin.title') ? t('signin.title') : 'Sign in'}</h1>
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded border px-3 py-2"
                />
                <button
                    type="submit"
                    disabled={loading || !email}
                    className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                >
                    {loading ? (t.has('signin.sending') ? t('signin.sending') : 'Sending…') : (t.has('signin.send') ? t('signin.send') : 'Send magic link')}
                </button>
            </form>
            {msg && <p className="mt-3 text-sm text-neutral-600">{msg}</p>}
        </div>
    )
}
