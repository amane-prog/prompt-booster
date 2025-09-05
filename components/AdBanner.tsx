// components/AdBanner.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type PlanTier = 'free' | 'pro' | 'pro_plus'
type BoostStatus = {
    bannerVisible?: boolean
    planTier?: PlanTier
    isPro?: boolean
}

type Props = {
    /** 位置: fixed(画面下固定) / inline(その場に描画) */
    placement?: 'fixed' | 'inline'
    /** ユーザーが閉じた後、再表示しない最小時間（分）。デフォルト60分 */
    coolDownMinutes?: number
    className?: string
}

const HIDE_UNTIL_KEY = 'ad.hideUntil'

function nowSec(): number {
    return Math.floor(Date.now() / 1000)
}

function getHideUntil(): number {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(HIDE_UNTIL_KEY) : null
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) ? n : 0
}

function setHideFor(minutes: number) {
    if (typeof window === 'undefined') return
    const until = nowSec() + Math.max(1, Math.floor(minutes * 60))
    window.localStorage.setItem(HIDE_UNTIL_KEY, String(until))
}

function parseStatus(json: unknown): BoostStatus {
    if (!json || typeof json !== 'object') return {}
    const o = json as Record<string, unknown>
    const out: BoostStatus = {}
    if (typeof o.bannerVisible === 'boolean') out.bannerVisible = o.bannerVisible
    if (o.planTier === 'free' || o.planTier === 'pro' || o.planTier === 'pro_plus') out.planTier = o.planTier
    if (typeof o.isPro === 'boolean') out.isPro = o.isPro
    return out
}

export default function AdBanner({ placement = 'fixed', coolDownMinutes = 60, className }: Props) {
    const [visible, setVisible] = useState<boolean>(false) // 実際に描画するか
    const [loading, setLoading] = useState<boolean>(true)  // 初回チラつき防止
    const boxRef = useRef<HTMLDivElement>(null)
    const wasImpressed = useRef<boolean>(false)
    const bodyPaddingApplied = useRef<boolean>(false)

    const forceTest = useMemo(() => {
        if (typeof window === 'undefined') return false
        return new URLSearchParams(window.location.search).has('adtest')
    }, [])

    // ステータス取得＆表示判定
    useEffect(() => {
        let alive = true
            ; (async () => {
                try {
                    // 直近で「閉じる」されたら出さない
                    if (!forceTest && getHideUntil() > nowSec()) {
                        if (alive) { setVisible(false); setLoading(false) }
                        return
                    }
                    const res = await fetch('/api/boost/status', { cache: 'no-store' })
                    if (!alive) return

                    if (!res.ok) {
                        // 取得失敗時はデフォルト表示（Free想定）
                        setVisible(true)
                        setLoading(false)
                        return
                    }
                    const data = parseStatus(await res.json())

                    // 新仕様が来ていれば最優先
                    if (typeof data.bannerVisible === 'boolean') {
                        setVisible(data.bannerVisible || forceTest)
                        setLoading(false)
                        return
                    }

                    // 旧仕様の互換: isPro=true → 非表示 / false or undefined → 表示
                    if (typeof data.isPro === 'boolean') {
                        setVisible(!data.isPro || forceTest)
                        setLoading(false)
                        return
                    }

                    // planTier が来ていれば free のみ表示
                    if (data.planTier) {
                        setVisible(data.planTier === 'free' || forceTest)
                        setLoading(false)
                        return
                    }

                    // いずれもなければ安全側＝表示
                    setVisible(true || forceTest)
                    setLoading(false)
                } catch {
                    if (alive) { setVisible(true); setLoading(false) }
                }
            })()
        return () => { alive = false }
    }, [forceTest])

    // fixed の場合は高さを測って body に余白を付ける（被り防止）
    useEffect(() => {
        if (placement !== 'fixed') return
        const el = boxRef.current
        if (!el) return
        const applyPadding = () => {
            const h = el.offsetHeight
            document.body.style.paddingBottom = `${h + 8}px` // 余裕を+8px
            bodyPaddingApplied.current = true
        }
        const clearPadding = () => {
            if (bodyPaddingApplied.current) {
                document.body.style.paddingBottom = ''
                bodyPaddingApplied.current = false
            }
        }
        if (visible) {
            applyPadding()
            // サイズ変化に追随
            const ro = new ResizeObserver(applyPadding)
            ro.observe(el)
            return () => {
                ro.disconnect()
                clearPadding()
            }
        } else {
            clearPadding()
        }
    }, [visible, placement])

    // インプレッション（1回だけ）
    useEffect(() => {
        if (!visible || loading) return
        if (wasImpressed.current) return
        wasImpressed.current = true
        // ここで計測イベント送るなら:
        // void fetch('/api/ads/event', { method: 'POST', body: JSON.stringify({ type: 'impression' }) })
    }, [visible, loading])

    if (loading || !visible) return null

    const content = (
        <div
            ref={boxRef}
            className={`mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-3 text-center text-sm shadow-lg ${className ?? ''}`}
            role="region" aria-label="Advertisement"
        >
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-neutral-500">Ad</span>
                <button
                    onClick={() => { setVisible(false); setHideFor(coolDownMinutes) }}
                    className="rounded bg-black/70 px-2 py-0.5 text-[10px] text-white"
                    aria-label="Close ad"
                >
                    ✕
                </button>
            </div>
            <button
                onClick={() => {
                    // クリック計測するならここで送る
                    // void fetch('/api/ads/event', { method: 'POST', body: JSON.stringify({ type: 'click' }) })
                }}
                className="mt-2 w-full rounded-md border bg-neutral-50 px-3 py-8 hover:bg-neutral-100"
            >
                Banner placeholder (test)
            </button>
        </div>
    )

    if (placement === 'inline') {
        return content
    }

    // fixed
    return (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3">
            {content}
        </div>
    )
}
