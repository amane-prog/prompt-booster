'use client'

import { useTranslations } from 'next-intl'
import PlanComparison from '@/components/PlanComparison'
import PlanMatrix from '@/components/PlanMatrix'

type Tier = 'free' | 'pro' | 'pro_plus'
type Fn = () => void | Promise<void>

type Props = {
    open: boolean
    onClose: () => void
    tier?: Tier
    onGoPro?: Fn
    onGoProPlus?: Fn
    onTopup300?: Fn
    onTopup1000?: Fn
    onOpenPortal?: Fn
    title?: string
}

export default function PlanDialog({
    open, onClose, tier = 'free',
    onGoPro, onGoProPlus, onTopup300, onTopup1000, onOpenPortal,
    title
}: Props) {
    const tPC = useTranslations('planComparison')
    const tCommon = useTranslations('common')
    const tBilling = useTranslations('billing.checkout')

    if (!open) return null
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 m-3 w-[94%] max-w-3xl rounded-2xl border bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-base font-semibold">{title ?? tPC('title')}</h3>
                    <button onClick={onClose} className="rounded border px-2 py-1 text-sm">
                        {tCommon('close')}
                    </button>
                </div>

                <div className="max-h-[78vh] overflow-auto px-4 py-4">
                    <div className="mb-4">
                        <PlanComparison
                            tier={tier}
                            onGoPro={onGoPro}
                            onGoProPlus={onGoProPlus}
                            onOpenPortal={onOpenPortal}
                        />
                    </div>

                    <div className="mb-4">
                        <PlanMatrix />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {onTopup300 && (
                            <button onClick={() => onTopup300()} className="ml-auto rounded border px-3 py-1.5 text-sm">
                                {tBilling('topup300')}
                            </button>
                        )}
                        {onTopup1000 && (
                            <button onClick={() => onTopup1000()} className="rounded border px-3 py-1.5 text-sm">
                                {tBilling('topup1000')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
