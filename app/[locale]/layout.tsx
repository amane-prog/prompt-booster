<<<<<<< HEAD
// app/[locale]/layout.tsx
import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { locales, type Locale } from '@/i18n'
import Header from '@/components/Header'
import '@/styles/globals.css'

export const dynamic = 'force-static'

type Params = { locale: string }

function isLocale(x: string): x is Locale {
    return (locales as readonly string[]).includes(x)
}

// readonly → mutable に変換して返す
export function generateStaticParams(): { locale: Locale }[] {
    return [...(locales as readonly Locale[])].map((l) => ({ locale: l }))
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: ReactNode
    params: Promise<Params> // あなたの環境に合わせて Promise 受け取り
}) {
    const { locale: rawLocale } = await params

    if (!isLocale(rawLocale)) notFound()

    setRequestLocale(rawLocale)

    let messages: Record<string, unknown>
    try {
        messages = (await import(`@/messages/${rawLocale}.json`)).default as Record<string, unknown>
    } catch {
        messages = (await import('@/messages/en.json')).default as Record<string, unknown>
    }

    const t = await getTranslations({ locale: rawLocale })

    return (
        <html lang={rawLocale}>
            <body className="min-h-dvh bg-white text-gray-900 antialiased">
                <NextIntlClientProvider locale={rawLocale} messages={messages}>
                    <Header />
                    <main className="mx-auto w-full px-4 py-6 max-w-screen-2xl 3xl:max-w-screen-3xl 4xl:max-w-screen-4xl">
                        {children}
                    </main>
                    <footer className="w-full border-t bg-white">
                        <div className="mx-auto flex flex-col md:flex-row md:items-center md:justify-between px-4 py-6 gap-3 max-w-screen-2xl 3xl:max-w-screen-3xl 4xl:max-w-screen-4xl">
                            <span className="text-xs text-neutral-500">
                                © {new Date().getFullYear()} Prompt Booster (Beta)
                            </span>
                            <div className="flex flex-wrap gap-3 text-xs">
                                <Link href={`/${rawLocale}/terms`} className="underline text-neutral-600">
                                    {t('legal.terms')}
                                </Link>
                                <Link href={`/${rawLocale}/privacy`} className="underline text-neutral-600">
                                    {t('legal.privacy')}
                                </Link>
                                <Link href={`/${rawLocale}/billing/portal`} className="underline text-blue-600">
                                    {t('nav.manage')}
                                </Link>
                            </div>
                        </div>
                    </footer>
                </NextIntlClientProvider>
            </body>
        </html>
=======
'use client'

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
