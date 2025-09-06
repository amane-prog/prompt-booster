'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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
    }

    if (sent) {
        return (
            <main className="max-w-md mx-auto p-6">
                <h1 className="text-lg font-semibold mb-2">メールを送信しました</h1>
                <p className="text-sm text-neutral-600">受信メールのリンクからサインインしてください。</p>
            </main>
        )
    }

    return (
        <main className="max-w-md mx-auto p-6">
            <h1 className="text-lg font-semibold mb-4">サインイン</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded border px-3 py-2"
                    required
                />
                <button
                    disabled={loading}
                    className="rounded px-4 py-2 border w-full disabled:opacity-60"
                >
                    {loading ? '送信中…' : 'マジックリンクを送る'}
                </button>
            </form>
        </main>
    )
}
