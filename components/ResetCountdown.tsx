// components/ResetCountdown.tsx
'use client'

import { useEffect, useState } from 'react'

type Props = {
    label?: string
    tzOffsetHours?: number   // JST=+9
    initialSec?: number      // サーバからTTLを渡せるならここに（任意）
    className?: string
    onZero?: () => void
}

function formatHMS(total: number): string {
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function secondsUntilNextMidnight(tzOffsetHours: number): number {
    const now = new Date()
    const shifted = new Date(now.getTime() + tzOffsetHours * 3600 * 1000)
    const next = new Date(shifted.getFullYear(), shifted.getMonth(), shifted.getDate() + 1, 0, 0, 0, 0)
    return Math.max(0, Math.floor((next.getTime() - shifted.getTime()) / 1000))
}

export default function ResetCountdown({
    label = 'JSTのリセットまで',
    tzOffsetHours = 9,
    initialSec,
    className,
    onZero,
}: Props) {
    // ★ SSRで描かない（null）→ マウント後に値を入れる
    const [sec, setSec] = useState<number | null>(null)

    useEffect(() => {
        const seed = typeof initialSec === 'number'
            ? Math.max(0, Math.floor(initialSec))
            : secondsUntilNextMidnight(tzOffsetHours)

        setSec(seed)

        const id = window.setInterval(() => {
            setSec(prev => {
                const cur = typeof prev === 'number' ? prev : seed
                const next = cur - 1
                if (next <= 0) {
                    window.clearInterval(id)
                    onZero?.()
                    return 0
                }
                return next
            })
        }, 1000)

        const onVis = () => setSec(secondsUntilNextMidnight(tzOffsetHours))
        document.addEventListener('visibilitychange', onVis)

        return () => {
            window.clearInterval(id)
            document.removeEventListener('visibilitychange', onVis)
        }
    }, [tzOffsetHours, initialSec, onZero])

    return (
        <span className={className}>
            {label}{' '}
            {/* ★ 初回はプレースホルダ、かつ警告抑止 */}
            <span className="tabular-nums" suppressHydrationWarning>
                {sec === null ? '—:—:—' : formatHMS(sec)}
            </span>
        </span>
    )
}
