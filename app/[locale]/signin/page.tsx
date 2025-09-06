'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useTranslations } from 'next-intl'
export default function SignInPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const params = useSearchParams()
    const locale = pathname.split('/')[1] || 'ja'

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email) return
        setLoading(true)
        try {
            const next = params.get('next') || `/${locale}`
            const redirectTo = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/auth/callback?next=${encodeURIComponent(next)}`
            const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
            if (error) throw error
            setSent(true)
        } catch (err) {
            alert('Failed to send magic link')
        } finally {
            setLoading(false)
        }
        const origin =
            typeof window !== 'undefined'
                ? window.location.origin
                : process.env.NEXT_PUBLIC_SITE_ORIGIN!; 

        const redirectTo = `${origin}/auth/callback`;

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: redirectTo }
        });

        if (!error) setSent(true);
    }

    const t = useTranslations('auth')

    if (sent) {
        return (
            <main className="max-w-md mx-auto p-6">
                <h1 className="text-lg font-semibold mb-2">{t('checkInbox')}</h1>
                {/* 既存キーだけ使うので補足文は省略 */}
            </main>
        )
    }

    return (
        <main className="max-w-md mx-auto p-6">
            {/* タイトルは既存キーで代用 */}
            <h1 className="text-lg font-semibold mb-4">{t('sendMagicLink')}</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('email')}
                    className="w-full rounded border px-3 py-2"
                    required
                />
                <button
                    disabled={loading}
                    className="rounded px-4 py-2 border w-full disabled:opacity-60"
                >
                    {loading ? `${t('sendMagicLink')}…` : t('sendMagicLink')}
                </button>
            </form>
        </main>
    )
}
