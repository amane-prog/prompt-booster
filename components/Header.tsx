// components/Header.tsx
'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Toast from '@/components/Toast'

type PlanTier = 'free' | 'pro' | 'pro_plus'
type Status = { planTier?: PlanTier; freeRemaining?: number; isPro?: boolean }
type CheckoutPlan = 'pro' | 'pro_plus'

export default function Header() {
    const t = useTranslations()
    const [email, setEmail] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [plan, setPlan] = useState<PlanTier>('free')

    const [toastMsg, setToastMsg] = useState<string | null>(null)
    const showToast = (msg: string) => setToastMsg(msg)

    useEffect(() => {
        let alive = true
        async function refresh() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!alive) return
                setEmail(user?.email ?? null)
                setUserId(user?.id ?? null)

                const r = await fetch('/api/boost/status', { cache: 'no-store' })
                if (r.ok) {
                    const j = (await r.json()) as Status
                    setPlan(j.planTier ?? (j.isPro ? 'pro' : 'free'))
                } else {
                    setPlan('free')
                }
            } catch {
                if (alive) { setEmail(null); setUserId(null); setPlan('free') }
            }
        }
        refresh()
        const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
            if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(evt)) refresh()
        })
        return () => { alive = false; sub?.subscription?.unsubscribe() }
    }, [])

    async function manageBilling() {
        try {
            const res = await fetch('/api/stripe/portal', { method: 'POST' })
            let data: { url?: string; error?: string } | null = null
            try { data = await res.json() } catch { /* ignore */ }
            if (res.ok && data?.url) {
                location.href = data.url
                return
            }
            const msg = data?.error ?? `Open portal failed (${res.status})`
            showToast(msg)
            console.error('portal failed:', { status: res.status, json: data })
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'portal error'
            showToast(msg)
            console.error('portal exception:', e)
        }
    }

    async function goPro(planParam: CheckoutPlan) {
        try {
            const qs = new URLSearchParams({ plan: planParam }).toString()
            const res = await fetch(`/api/stripe/checkout?${qs}`, { method: 'POST' })
            let data: { url?: string; error?: string } | null = null
            let rawText: string | null = null
            try { data = await res.json() } catch { rawText = await res.text().catch(() => null) }

            if (!res.ok || !data?.url) {
                const msg = data?.error ?? `Checkout failed (${res.status})`
                showToast(msg)
                console.group('checkout failed')
                console.log('plan:', planParam)
                console.log('status:', res.status)
                console.log('json:', data)
                if (rawText) console.log('text:', rawText.slice(0, 800))
                console.groupEnd()
                return
            }
            location.href = data.url
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'checkout error'
            showToast(msg)
            console.error('checkout exception:', e)
        }
    }

    const isPro = plan !== 'free'
    const appName = t.has('app.name') ? t('app.name') : 'Prompt Booster'


    // UUIDの末尾だけ表示
    const shortId = userId ? `${userId.slice(0, 6)}…${userId.slice(-4)}` : null

    return (
        <>
            <header className="w-full border-b bg-white">
                {/* 上段 */}
                <div className="mx-auto px-4 py-3 max-w-screen-2xl 3xl:max-w-screen-3xl 4xl:max-w-screen-4xl flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        {appName}
                        {isPro && (
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
                                {plan === 'pro_plus' ? 'PRO+' : 'PRO'}
                            </span>
                        )}
                    </Link>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />

                        {/* ID/メール表示 */}
                        {email ? (
                            <span className="text-sm text-neutral-600">{email}</span>
                        ) : shortId ? (
                            <span className="text-sm text-neutral-600">ID: {shortId}</span>
                        ) : null}

                        {email || userId ? (
                            <>
                                {isPro ? (
                                    <div className="flex items-center gap-2">
                                        {plan === 'pro' && (
                                            <button
                                                onClick={() => goPro('pro_plus')}
                                                className="rounded bg-blue-600 px-2 py-1 text-xs text-white"  // ← Pro+ も青に
                                                title={t.has('header.upgradeToProPlus') ? t('header.upgradeToProPlus') : 'Upgrade to Pro+'}
                                            >
                                                {t.has('header.upgradeToProPlus') ? t('header.upgradeToProPlus') : 'Upgrade to Pro+'}
                                            </button>
                                        )}
                                        <button
                                            onClick={manageBilling}
                                            className="rounded bg-black px-2 py-1 text-xs text-white"
                                        >
                                            {t.has('nav.manage') ? t('nav.manage') : (t.has('header.manageBilling') ? t('header.manageBilling') : 'Manage')}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => goPro('pro')}
                                            className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                                        >
                                            {t.has('nav.goPro') ? t('nav.goPro') : (t.has('billing.checkout.goPro') ? t('billing.checkout.goPro') : 'Go Pro')}
                                        </button>
                                        <button
                                            onClick={() => goPro('pro_plus')}
                                            className="rounded bg-blue-600 px-2 py-1 text-xs text-white"  // ← 青に統一
                                        >
                                            {t.has('nav.goProPlus') ? t('nav.goProPlus') : (t.has('billing.checkout.goProPlus') ? t('billing.checkout.goProPlus') : 'Go Pro+')}
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => supabase.auth.signOut().then(() => location.reload())}
                                    className="text-sm underline"
                                >
                                    {t.has('nav.signOut') ? t('nav.signOut') : 'Sign out'}
                                </button>
                            </>
                        ) : (
                            <Link href="/signin" className="text-sm underline">
                                {t.has('nav.signIn') ? t('nav.signIn') : 'Sign in'}
                            </Link>
                        )}
                    </div>
                </div>

                {/* 下段：説明バー */}
                <div className="border-t bg-neutral-50">
                    <div className="mx-auto max-w-screen-2xl 3xl:max-w-screen-3xl 4xl:max-w-screen-4xl px-4 py-2">
                        <p className="text-[13px] leading-snug text-neutral-800">
                            {t('header.pitch')}
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-neutral-500">
                            {t('header.assurance')}
                        </p>
                    </div>
                </div>
            </header>

            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
        </>
    )
}
