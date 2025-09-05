// components/ExecuteFab.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'

type Props = {
    onRun: () => Promise<void> | void
    label?: string
    isPro?: boolean
    canUseBoost?: boolean
    onWatchAd?: () => Promise<void> | void
    goProHref?: string
    /** 'fixed'=従来の画面左下固定 / 'inline'=その場に描画 */
    placement?: 'fixed' | 'inline'
    /** placement='inline'のときに適用するクラス */
    className?: string
    disabled?: boolean
}

export default function ExecuteFab({
    onRun,
    label = '実行 ⚡',
    isPro = false,
    canUseBoost = true,
    onWatchAd,
    goProHref = '/billing/checkout',
    placement = 'fixed',
    className,
    disabled = false,
}: Props) {
    const [loading, setLoading] = useState(false)
    const [showDialog, setShowDialog] = useState(false)

    async function handleClick() {
        if (loading || disabled) return
        if (isPro || canUseBoost) {
            setLoading(true)
            try { await onRun() } finally { setLoading(false) }
            return
        }
        setShowDialog(true)
    }

    async function handleWatchAd() {
        if (!onWatchAd) { setShowDialog(false); return }
        setLoading(true)
        try { await onWatchAd(); setShowDialog(false) } finally { setLoading(false) }
    }

    const Btn = (
        <button
            onClick={handleClick}
            className={
                placement === 'fixed'
                    ? 'fixed left-4 bottom-4 z-50 rounded-full px-5 py-3 shadow-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed'
                    : `rounded-full bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed ${className ?? ''}`
            }
            disabled={loading || disabled}
            aria-label="実行"
            type="button"
        >
            {loading ? '実行中…' : label}
        </button>
    )

    return (
        <>
            {Btn}

            {showDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
                    <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-semibold">Out of boosts today 🚫</h2>
                        <p className="mt-2 text-sm text-gray-600">You’ve used all free boosts for today.</p>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                onClick={handleWatchAd}
                                className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? 'Processing…' : 'Watch Ad (+1)'}
                            </button>

                            <Link
                                href={goProHref}
                                className="rounded-xl bg-black px-4 py-2 text-center text-sm text-white hover:opacity-90"
                                prefetch
                            >
                                Go Pro
                            </Link>
                        </div>

                        <button onClick={() => setShowDialog(false)} className="mt-4 block w-full text-center text-xs text-gray-500 hover:underline">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
