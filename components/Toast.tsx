'use client'
import { useEffect } from 'react'

type ToastProps = {
    message: string
    onClose: () => void
    /** 自動で閉じるまでのミリ秒 */
    duration?: number
}

export default function Toast({ message, onClose, duration = 1800 }: ToastProps) {
    useEffect(() => {
        const id = window.setTimeout(onClose, duration)
        return () => window.clearTimeout(id)
    }, [onClose, duration])

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-x-0 bottom-6 z-[70] flex justify-center px-3"
        >
            <div className="max-w-sm rounded-full bg-black text-white px-4 py-2 text-sm shadow-lg">
                {message}
            </div>
        </div>
    )
}
