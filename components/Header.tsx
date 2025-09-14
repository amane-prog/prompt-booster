'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Toast from '@/components/Toast'
import { startBilling } from '@/utils/stripe'

type PlanTier = 'free' | 'pro' | 'pro_plus'
type Status = { planTier?: PlanTier; freeRemaining?: number; isPro?: boolean }
type CheckoutPlan = 'pro' | 'pro_plus'

export default function Header() {
    const t = useTranslations()
    const locale = useLocale()
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
        void refresh()
        const { data: sub } = supabase.auth.onAuthStateChange((evt) => {
            if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED'].includes(evt)) void refresh()
        })
        return () => { alive = false; sub?.subscription?.unsubscribe() }
    }, [])

    async function onBilling(planParam: CheckoutPlan | null) {
        try {
            await startBilling(planParam) // server側で free→Checkout / active→Portal を自動分岐
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'billing error'
            showToast(msg)
            console.error('billing error:', e)
        }
    }

    const isPro = plan !== 'free'
    const appName = t.has('app.name') ? t('app.name') : 'Prompt Booster'
    const shortId = userId ? `${userId.slice(0, 6)}…${userId.slice(-4)}` : null

    return (
        <>
            <header className="w-full border-b bg-white">
                {/* Top bar */}
                <div className="mx-auto px-4 py-3 max-w-screen-2xl 3xl:max-w-screen-3xl 4xl:max-w-screen-4xl flex items-center justify-between">
                    <Link href={`/${locale}`} className="flex items-center gap-2 font-semibold">
                        {appName}
                        {isPro && (
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
                                {plan === 'pro_plus' ? 'PRO+' : 'PRO'}
                            </span>
                        )}
                    </Link>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />

                        {/* user info */}
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
                                                onClick={() => onBilling('pro_plus')}
                                                className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                                                title={t.has('header.upgradeToProPlus') ? t('header.upgradeToProPlus') : 'Upgrade to Pro+'}
                                            >
                                                {t.has('header.upgradeToProPlus') ? t('header.upgradeToProPlus') : 'Upgrade to Pro+'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onBilling(null)} // activeならPortalへ
                                            className="rounded bg-black px-2 py-1 text-xs text-white"
                                        >
                                            {t.has('nav.manage') ? t('nav.manage') : (t.has('header.manageBilling') ? t('header.manageBilling') : 'Manage')}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => onBilling('pro')}
                                            className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                                        >
                                            {t.has('nav.goPro') ? t('nav.goPro') : (t.has('billing.checkout.goPro') ? t('billing.checkout.goPro') : 'Go Pro')}
                                        </button>
                                        <button
                                            onClick={() => onBilling('pro_plus')}
                                            className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
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
                            <Link href={`/${locale}/signin`} className="text-sm underline">
                                {t.has('nav.signIn') ? t('nav.signIn') : 'Sign in'}
                            </Link>
                        )}
                    </div>
                </div>

                {/* Sub bar */}
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
