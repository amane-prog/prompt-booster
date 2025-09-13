//カード部分
'use client'

import { useTranslations } from 'next-intl'

type Tier = 'free' | 'pro' | 'pro_plus'
type Fn = () => void | Promise<void>

type Props = {
    tier?: Tier
    onGoPro?: Fn
    onGoProPlus?: Fn
    onOpenPortal?: Fn
}

function Card({
    title, badge, price, bullets, cta, onClick, highlight
}: {
    title: string; badge?: string; price: string; bullets: string[];
    cta?: string; onClick?: Fn; highlight?: boolean;
}) {
    return (
        <div className={[
            'w-full min-w-0 flex flex-col rounded-2xl border bg-white p-4',
            highlight ? 'ring-1 ring-blue-400 shadow-[0_0_0_1px_rgba(59,130,246,.2)]' : ''
        ].join(' ')}>
            <div className="mb-2 flex items-center justify-between">
                <div className="text-base font-semibold">{title}</div>
                {badge && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{badge}</span>}
            </div>
            <div className="mb-2 text-sm text-neutral-700">{price}</div>
            <ul className="mb-4 space-y-1 text-sm text-neutral-700">
                {bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-neutral-400" />
                        <span>{b}</span>
                    </li>
                ))}
            </ul>
            {cta && (
                <button onClick={() => onClick?.()} className="mt-auto rounded border px-3 py-1.5 text-sm hover:bg-neutral-50">
                    {cta}
                </button>
            )}
        </div>
    )
}

export default function PlanComparison({
    tier = 'free',
    onGoPro,
    onGoProPlus,
    onOpenPortal
}: Props) {
    const t = useTranslations('plan')
    const tPC = useTranslations('planComparison')
    const tNav = useTranslations('nav')
    const tCommon = useTranslations('common')

    const isFree = tier === 'free'
    const ctaPro = isFree ? tNav('goPro') : tCommon('managePlan')
    const ctaProPlus = isFree ? tNav('goProPlus') : tCommon('managePlan')
    const clickPro = isFree ? onGoPro : onOpenPortal
    const clickProPlus = isFree ? onGoProPlus : onOpenPortal

    return (
        <section>
            <h3 className="mb-2 text-sm font-medium">{tPC('title')}</h3>
            <div className="grid grid-cols-1 gap-4">
                <Card
                    title={t('free.name')}
                    price={t('free.price')}
                    bullets={[t('bullets.daily3'), t('bullets.chars500'), t('bullets.topup')]}
                    cta={t('cta.free')}
                    onClick={onOpenPortal}
                />
                <Card
                    title={t('pro.name')}
                    badge={t('badges.mostPopular')}
                    price={t('pro.price')}
                    bullets={[t('bullets.cap1000'), t('bullets.chars500'), t('bullets.noAds')]}
                    cta={ctaPro}
                    onClick={clickPro}
                    highlight
                />
                <Card
                    title={t('pro_plus.name')}
                    badge={t('badges.bestValue')}
                    price={t('pro_plus.price')}
                    bullets={[t('bullets.cap1000'), t('bullets.chars2000'), t('bullets.priority')]}
                    cta={ctaProPlus}
                    onClick={clickProPlus}
                />
            </div>
        </section>
    )
}
