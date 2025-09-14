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
    placement?: 'fixed' | 'inline'
    className?: string
    disabled?: boolean
    /** モーダルなどが開いている時は FAB を非表示にしたい場合に渡す */
    hiddenWhen?: boolean
    /** 必要なら外から z-index を調整できるように */
    zIndexClassName?: string // 例: 'z-40'
}

export default function ExecuteFab({
    onRun,
    label = '実行',
    isPro = false,
    canUseBoost = true,
    onWatchAd,
    goProHref = '/billing/checkout',
    placement = 'fixed',
    className,
    disabled = false,
    hiddenWhen = false,
    zIndexClassName = 'z-40', // ← 既定を z-40 に（モーダルの z を上回らないように）
}: Props) {
    const [loading, setLoading] = useState(false)
    const [showDialog, setShowDialog] = useState(false)

    async function handleClick() {
        if (loading || disabled) return
        if (isPro || canUseBoost) {
            setLoading(true)
            try {
                await onRun()
            } finally {
                setLoading(false)
            }
            return
        }
        setShowDialog(true)
    }

    async function handleWatchAd() {
        if (!onWatchAd) {
            setShowDialog(false)
            return
        }
        setLoading(true)
        try {
            await onWatchAd()
            setShowDialog(false)
        } finally {
            setLoading(false)
        }
    }

    if (hiddenWhen) return null // ← モーダル中などは描画しない

    const btnBase =
        'rounded-full bg-blue-600 text-white shadow ' +
        'enabled:hover:bg-blue-700 ' + // ← hoverはenabled時のみ
        'disabled:opacity-60 disabled:cursor-not-allowed'

    const Btn = (
        <button
            onClick={handleClick}
            className={
                placement === 'fixed'
                    ? `fixed left-4 bottom-4 ${zIndexClassName} ${btnBase} px-5 py-3`
                    : `${btnBase} px-4 py-2 ${className ?? ''}`
            }
            disabled={loading || disabled}
            aria-disabled={loading || disabled}
            type="button"
            title={loading || disabled ? '現在は実行できません' : label}
        >
            {loading ? '処理中…' : label}
        </button>
    )

    return (
        <>
            {Btn}

            {showDialog && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="absolute inset-0 bg-black/40"
                        aria-hidden
                        onClick={() => setShowDialog(false)}
                    />
                    <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-semibold">本日のブーストは上限です</h2>
                        <p className="mt-2 text-sm text-gray-600">本日の無料ブーストは使い切りました。</p>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <button
                                onClick={handleWatchAd}
                                className="rounded-xl border px-4 py-2 text-sm enabled:hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                disabled={loading}
                                aria-disabled={loading}
                            >
                                {loading ? '処理中…' : '広告を見る（+1）'}
                            </button>

                            <Link
                                href={goProHref}
                                className="rounded-xl bg-black px-4 py-2 text-center text-sm text-white hover:opacity-90"
                                prefetch
                            >
                                Go Pro
                            </Link>
                        </div>

                        <button
                            onClick={() => setShowDialog(false)}
                            className="mt-4 block w-full text-center text-xs text-gray-500 hover:underline"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
