'use client'

<<<<<<< HEAD
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
                    // 数秒後にトップへ戻す（必要なら調整）
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
=======
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabaseClient' // 髫ｨ蛟･繝ｻ驍ｵ・ｺ髦ｮ蜻ｻ・ｽ讙趣ｽｸ・ｺ隶吝ｯゆｼｯ驍ｵ・ｺ郢晢ｽｻ遶雁､・ｸ・ｲ鬮ｱ・ｴannot find name 'supabase'驍ｵ・ｲ郢晢ｽｻ

export default function SignInPage() {
    const t = useTranslations()
    const router = useRouter()
    const [email, setEmail] = useState('')         // 髫ｨ蛟･繝ｻemail 驛｢・ｧ陜｣・､騾｡鬘鯉ｽｫ・｢隰ｫ・ｾ繝ｻ・ｼ郢晢ｽｻhorthand error髯昴・・ｽ・ｾ鬩包ｽｲ陷ｴ繝ｻ・ｽ・ｼ郢晢ｽｻ
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email) return

        setLoading(true)
        setMsg(null)
        try {
            // 髫ｨ蛟･繝ｻ髯樊ｺｽ蛻､霎溷､頑・鬮ｦ・ｪ郢晢ｽｻ 'origin' 驍ｵ・ｺ繝ｻ・ｨ鬮ｯ・ｲ繝ｻ・ｫ驛｢・ｧ驗呻ｽｫ繝ｻ繝ｻ・ｸ・ｺ陷ｷ・ｶ繝ｻ讓抵ｽｸ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｧ siteOrigin 驍ｵ・ｺ繝ｻ・ｫ
            const siteOrigin =
                typeof window !== 'undefined'
                    ? window.location.origin
                    : process.env.NEXT_PUBLIC_SITE_ORIGIN || 'http://localhost:3000'

            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${siteOrigin}/auth/callback` }, // 髫ｨ蛟･繝ｻcallback驍ｵ・ｺ繝ｻ・ｸ
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
                    {loading ? (t.has('signin.sending') ? t('signin.sending') : 'Sending驕ｯ・ｶ繝ｻ・ｦ') : (t.has('signin.send') ? t('signin.send') : 'Send magic link')}
                </button>
            </form>
            {msg && <p className="mt-3 text-sm text-neutral-600">{msg}</p>}
        </div>
>>>>>>> deploy-test
    )
}
