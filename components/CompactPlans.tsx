'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import PlanDialog from '@/components/PlanDialog'
import PlanComparison from '@/components/PlanComparison'

type Tier = 'free' | 'pro' | 'pro_plus'
type Fn = () => void | Promise<void>
type Props = { tier?: Tier; onGoPro?: Fn; onGoProPlus?: Fn; onOpenPortal?: Fn; onTopup300?: Fn; onTopup1000?: Fn }

export default function CompactPlans(props: Props) {
    const t = useTranslations('compact')
    const [open, setOpen] = useState(false)
    const locale = useLocale()
    const langClass = locale === 'ja' ? 'lang-ja' : 'lang-en'

    return (
        <section className={`rounded-2xl border bg-white p-3 ${langClass}`}>
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">{t('title')}</h3>
                <button type="button" onClick={() => setOpen(true)}
                    className="text-[12px] underline text-neutral-600 hover:text-neutral-900">
                    {t('seeDetails')}
                </button>
            </div>

            {/* 横スクロールのカードレール */}
            <div className="flex flex-col gap-3">
                <PlanComparison {...props} />
            </div>

            <PlanDialog open={open} onClose={() => setOpen(false)} {...props} />
        </section>
    )
}
