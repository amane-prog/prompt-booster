'use client'

type Props = {
    open: boolean
    onClose: () => void
    title: string
    body: string
    resetInSec?: number | null
    onSeePlans?: () => void
    onTopup?: () => void
}

function fmtHMS(total: number): string {
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export default function CreditLimitModal({
    open,
    onClose,
    title,
    body,
    resetInSec,
    onSeePlans,
    onTopup
}: Props) {
    if (!open) return null
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-[92%] max-w-md rounded-2xl border bg-white p-5 shadow-xl">
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-neutral-700 whitespace-pre-line">
                    {body}
                </p>

                {typeof resetInSec === 'number' && resetInSec >= 0 && (
                    <div className="mt-2 rounded bg-neutral-50 p-2 text-[12px] text-neutral-600">
                        次のリセットまで：<span className="tabular-nums font-semibold">{fmtHMS(resetInSec)}</span>
                    </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="rounded border px-3 py-1.5 text-sm"
                    >
                        閉じる
                    </button>
                    {onSeePlans && (
                        <button
                            onClick={onSeePlans}
                            className="rounded border px-3 py-1.5 text-sm"
                        >
                            プランを見る
                        </button>
                    )}
                    {onTopup && (
                        <button
                            onClick={onTopup}
                            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white"
                        >
                            Top-up
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
