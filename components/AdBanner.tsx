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
    /** 髣厄ｽｴ陷･・ｲ繝ｻ・ｽ繝ｻ・ｮ: fixed(鬨ｾ蛹・ｽｽ・ｻ鬯ｮ・ｱ繝ｻ・｢髣包ｽｳ陷ｿ・･陝邇匁･懃ｹ晢ｽｻ / inline(驍ｵ・ｺ隴擾ｽｴ郢晢ｽｻ髯懶ｽ｣繝ｻ・ｴ驍ｵ・ｺ繝ｻ・ｫ髫ｰ・ｰ陷諤懈・) */
    placement?: 'fixed' | 'inline'
    /** 驛｢譎｢・ｽ・ｦ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｶ驛｢譎｢・ｽ・ｼ驍ｵ・ｺ驕停・髯ｶ驍ｵ・ｺ陋滂ｽ･隨ｳ繝ｻ・ｰ蜍滂ｽｾ蛟仰遶乗亢繝ｻ鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ驍ｵ・ｺ陷会ｽｱ遶企・・ｸ・ｺ郢晢ｽｻ隲､蜻ｵ豌｣闕ｵ諤懊・鬯ｮ・｢鬮ｮ・｣繝ｻ・ｼ闔・･郢晢ｽｻ郢晢ｽｻ陝ｲ・ｨ・つ郢ｧ繝ｻﾎ咎Δ譎・ｽｼ譁青ｰ驛｢譎｢・ｽ・ｫ驛｢譏ｴ繝ｻ0髯具ｽｻ郢晢ｽｻ*/
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
    const [visible, setVisible] = useState<boolean>(false) // 髯橸ｽｳ雋翫・諤咎し・ｺ繝ｻ・ｫ髫ｰ・ｰ陷諤懈・驍ｵ・ｺ陷ｷ・ｶ繝ｻ迢暦ｽｸ・ｺ郢晢ｽｻ
    const [loading, setLoading] = useState<boolean>(true)  // 髯具ｽｻ隴惹ｸ橸ｽｱ骰具ｽｹ譏ｶ繝ｻ・主ｸｷ・ｸ・ｺ繝ｻ・､驍ｵ・ｺ陜難ｽｼ闔貅ｯ・ｱ繝ｻ・ｽ・｢
    const boxRef = useRef<HTMLDivElement>(null)
    const wasImpressed = useRef<boolean>(false)
    const bodyPaddingApplied = useRef<boolean>(false)

    const forceTest = useMemo(() => {
        if (typeof window === 'undefined') return false
        return new URLSearchParams(window.location.search).has('adtest')
    }, [])

    // 驛｢・ｧ繝ｻ・ｹ驛｢譏ｴ繝ｻ郢晢ｽｻ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・ｹ髯ｷ・ｿ鬮｢ﾂ繝ｻ・ｾ隴会ｽｦ繝ｻ・ｼ郢晢ｽｻ繝ｻ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ髯具ｽｻ繝ｻ・､髯橸ｽｳ郢晢ｽｻ
    useEffect(() => {
        let alive = true
            ; (async () => {
                try {
                    // 鬨ｾ・ｶ繝ｻ・ｴ鬮ｴ蜿ｰ・ｻ・｣邵ｲ蝣､・ｸ・ｲ驕停・髯ｶ驍ｵ・ｺ陋滂ｽ･繝ｻ迢暦ｽｸ・ｲ鬮ｦ・ｪ繝ｻ繝ｻ・ｹ・ｧ陟募ｨｯ陞ｺ驛｢・ｧ霑壼生繝ｻ驍ｵ・ｺ髴域喚繝ｻ驍ｵ・ｺ郢晢ｽｻ
                    if (!forceTest && getHideUntil() > nowSec()) {
                        if (alive) { setVisible(false); setLoading(false) }
                        return
                    }
                    const res = await fetch('/api/boost/status', { cache: 'no-store' })
                    if (!alive) return

                    if (!res.ok) {
                        // 髯ｷ・ｿ鬮｢ﾂ繝ｻ・ｾ隲､諛ｶ・ｽ・､繝ｻ・ｱ髫ｰ・ｨ驍・ｽｲ陷・ｽｾ驍ｵ・ｺ繝ｻ・ｯ驛｢譏ｴ繝ｻ郢晢ｽｵ驛｢・ｧ繝ｻ・ｩ驛｢譎｢・ｽ・ｫ驛｢譎槭Γ繝ｻ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ郢晢ｽｻ郢晢ｽｻree髫ｲ・ｰ繝ｻ・ｳ髯橸ｽｳ陞滂ｽｲ繝ｻ・ｼ郢晢ｽｻ
                        setVisible(true)
                        setLoading(false)
                        return
                    }
                    const data = parseStatus(await res.json())

                    // 髫ｴ繝ｻ・ｽ・ｰ髣皮甥・｢髮｣・ｽ・ｧ陋滂ｽ･遯ｶ・ｲ髫ｴ螟ｲ・ｽ・･驍ｵ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ繝ｻ讙趣ｽｸ・ｺ繝ｻ・ｰ髫ｴ蟠｢ﾂ髯ｷ繝ｻ・ｽ・ｪ髯ｷ蛹ｻ繝ｻ
                    if (typeof data.bannerVisible === 'boolean') {
                        setVisible(data.bannerVisible || forceTest)
                        setLoading(false)
                        return
                    }

                    // 髫ｴ魃会ｽｽ・ｧ髣皮甥・｢髮｣・ｽ・ｧ陋滂ｽ･郢晢ｽｻ髣費｣ｰ陷ｻ逎ｯ蜈ｱ: isPro=true 驕ｶ鄙ｫ繝ｻ鬯ｮ・ｱ隶壹・・ｽ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ / false or undefined 驕ｶ鄙ｫ繝ｻ鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ
                    if (typeof data.isPro === 'boolean') {
                        setVisible(!data.isPro || forceTest)
                        setLoading(false)
                        return
                    }

                    // planTier 驍ｵ・ｺ隴ｴ・ｧ隰ｫ繧会ｽｸ・ｺ繝ｻ・ｦ驍ｵ・ｺ郢晢ｽｻ繝ｻ讙趣ｽｸ・ｺ繝ｻ・ｰ free 驍ｵ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｿ鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ
                    if (data.planTier) {
                        setVisible(data.planTier === 'free' || forceTest)
                        setLoading(false)
                        return
                    }

                    // 驍ｵ・ｺ郢晢ｽｻ隨倥・・ｹ・ｧ陟暮ｯ会ｽｽ繧会ｽｸ・ｺ繝ｻ・ｪ驍ｵ・ｺ闔会ｽ｣繝ｻ讙趣ｽｸ・ｺ繝ｻ・ｰ髯橸ｽｳ霑壼生繝ｻ髯句ｹ｢・ｽ・ｴ郢晢ｽｻ隴弱・・ｽ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ
                    setVisible(true || forceTest)
                    setLoading(false)
                } catch {
                    if (alive) { setVisible(true); setLoading(false) }
                }
            })()
        return () => { alive = false }
    }, [forceTest])

    // fixed 驍ｵ・ｺ繝ｻ・ｮ髯懶ｽ｣繝ｻ・ｴ髯ｷ・ｷ陋ｹ・ｻ郢晢ｽｻ鬯ｯ・ｮ陋滂ｽ･繝ｻ繝ｻ・ｹ・ｧ陷ｻ闌ｨ・ｽ・ｸ繝ｻ・ｬ驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ繝ｻ・ｦ body 驍ｵ・ｺ繝ｻ・ｫ髣厄ｽｴ陷･荳樣・Δ・ｧ陷代・・ｽ・ｻ陋滂ｽ･繝ｻ・ｰ驛｢・ｧ陷茨ｽｷ繝ｻ・ｼ鬩帙・・ｽ・｢繝ｻ・ｫ驛｢・ｧ闔ｨ竏ｽ・ｺ貅ｯ・ｱ繝ｻ・ｽ・｢郢晢ｽｻ郢晢ｽｻ
    useEffect(() => {
        if (placement !== 'fixed') return
        const el = boxRef.current
        if (!el) return
        const applyPadding = () => {
            const h = el.offsetHeight
            document.body.style.paddingBottom = `${h + 8}px` // 髣厄ｽｴ陷ｻ・ｵ繝ｻ・｣髴郁ｲｻ・ｽ繝ｻ8px
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
            // 驛｢・ｧ繝ｻ・ｵ驛｢・ｧ繝ｻ・､驛｢・ｧ繝ｻ・ｺ髯樊ｺｽ逕･陜滂ｽｧ驍ｵ・ｺ繝ｻ・ｫ鬮ｴ謇假ｽｽ・ｽ鬯ｮ・ｫ郢晢ｽｻ
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

    // 驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ驛｢譎丞ｹｲ・取ｨ抵ｽｹ譏ｴ繝ｻ邵ｺ蜥擾ｽｹ譎｢・ｽ・ｧ驛｢譎｢・ｽ・ｳ郢晢ｽｻ郢晢ｽｻ髯懃軸・ｧ・ｭ隨・ｽ｡驍ｵ・ｺ隰・∞・ｽ・ｼ郢晢ｽｻ
    useEffect(() => {
        if (!visible || loading) return
        if (wasImpressed.current) return
        wasImpressed.current = true
        // 驍ｵ・ｺ髦ｮ蜻ｻ・ｼ繝ｻ・ｸ・ｺ繝ｻ・ｧ鬮ｫ・ｪ陜捺ｻゑｽｽ・ｸ繝ｻ・ｬ驛｢・ｧ繝ｻ・､驛｢譎冗函・趣ｽｦ驛｢譎会ｽ｣・ｯ・つ遶丞､ｲ・ｽ迢暦ｽｸ・ｺ繝ｻ・ｪ驛｢・ｧ郢晢ｽｻ
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
                    髫ｨ・ｨ郢晢ｽｻ
                </button>
            </div>
            <button
                onClick={() => {
                    // 驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢譏ｴ繝ｻ邵ｺ鮃ｹ蝮手搏貊ゑｽｽ・ｸ繝ｻ・ｬ驍ｵ・ｺ陷ｷ・ｶ繝ｻ迢暦ｽｸ・ｺ繝ｻ・ｪ驛｢・ｧ陝ｲ・ｨ繝ｻ繝ｻ・ｸ・ｺ髦ｮ蜷ｶﾂ蟶晢ｽｨ・ｾ遶丞､ｲ・ｽ繝ｻ
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
