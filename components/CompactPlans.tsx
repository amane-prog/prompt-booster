'use client'

import { useTranslations } from 'next-intl'

type Tier = 'free' | 'pro' | 'pro_plus'
type Fn = () => void | Promise<void>

type Props = {
    tier?: Tier
    onOpenDetails?: () => void
    onGoPro?: Fn
    onGoProPlus?: Fn
    onOpenPortal?: Fn
}

function Bullet({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-center gap-2 text-[13px] leading-snug">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-400" />
            <span className="text-neutral-700">{children}</span>
        </li>
    )
}

function PlanCard({
    title, badge, price, bullets, ctaLabel, onClick, highlighted = false
}: {
    title: string
    badge?: string
    price: string
    bullets: string[]
    ctaLabel: string
    onClick?: Fn
    highlighted?: boolean
}) {
    return (
        <div className={[
            'flex flex-col rounded-2xl border bg-white p-3',
            highlighted ? 'ring-1 ring-blue-400 shadow-[0_0_0_1px_rgba(59,130,246,.2)]' : ''
        ].join(' ')}>
            <div className="mb-1 flex items-center justify-between">
                <div className="text-sm font-semibold">{title}</div>
                {badge && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">{badge}</span>}
            </div>
            <div className="mb-2 text-[13px] text-neutral-600">{price}</div>
            <ul className="mb-3 space-y-1.5">
                {bullets.slice(0, 3).map((b, i) => <Bullet key={i}>{b}</Bullet>)}
            </ul>
            <button
                onClick={() => onClick?.()}
                className="mt-auto rounded border px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
                {ctaLabel}
            </button>
        </div>
    )
}

export default function CompactPlans({
    tier = 'free',
    onOpenDetails,
    onGoPro,
    onGoProPlus,
    onOpenPortal
}: Props) {
    const t = useTranslations('plan')
    const tCommon = useTranslations('common')
    const tCompact = useTranslations('compact')
    const tNav = useTranslations('nav')

    const isFree = tier === 'free'
    const proCtaLabel = isFree ? tNav('goPro') : tCommon('managePlan')
    const proPlusCtaLabel = isFree ? tNav('goProPlus') : tCommon('managePlan')

    return (
        <section className="rounded-2xl border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">{tCompact('title')}</h3>
                <button
                    onClick={onOpenDetails}
                    className="text-[12px] underline text-neutral-600 hover:text-neutral-900"
                >
                    {tCompact('seeDetails')}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <PlanCard
                    title={t('free.name')}
                    price={t('free.price')}
                    bullets={[t('bullets.daily3'), t('bullets.chars500'), t('bullets.topup')]}
                    ctaLabel={t('cta.free')}
                    onClick={onOpenDetails}
                />
                <PlanCard
                    title={t('pro.name')}
                    badge={t('badges.mostPopular')}
                    price={t('pro.price')}
                    bullets={[t('bullets.cap1000'), t('bullets.chars500'), t('bullets.noAds')]}
                    ctaLabel={proCtaLabel}
                    onClick={isFree ? onGoPro : onOpenPortal}
                    highlighted
                />
                <PlanCard
                    title={t('pro_plus.name')}
                    badge={t('badges.bestValue')}
                    price={t('pro_plus.price')}
                    bullets={[t('bullets.cap1000'), t('bullets.chars2000'), t('bullets.priority')]}
                    ctaLabel={proPlusCtaLabel}
                    onClick={isFree ? onGoProPlus : onOpenPortal}
                />
            </div>
        </section>
    )
}
