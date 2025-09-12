//表部分
'use client';

import { useTranslations } from 'next-intl';
import React from 'react';

export default function PlanMatrix() {
    const t = useTranslations('plan');
    const lastUpdated = '2025-09-02'; // 必要なら props / env / git rev 連携に差し替えOK

    const Row = ({
        label,
        free,
        pro,
        proPlus,
    }: {
        label: React.ReactNode;
        free: React.ReactNode;
        pro: React.ReactNode;
        proPlus: React.ReactNode;
    }) => (
        <tr className="[&>td]:border [&>td]:px-3 [&>td]:py-2 [&>td]:align-top [&>td]:text-sm">
            <th
                scope="row"
                className="sticky left-0 z-10 bg-neutral-50 border px-3 py-2 text-sm whitespace-nowrap"
            >
                {label}
            </th>
            <td className="whitespace-nowrap">{free}</td>
            <td className="whitespace-nowrap">{pro}</td>
            <td className="whitespace-nowrap">{proPlus}</td>
        </tr>
    );

    return (
        <section className="rounded-2xl border bg-white p-4">
            <h3 className="mb-3 text-sm font-medium">{t('matrixTitle')}</h3>

            <div className="-mx-4 overflow-x-auto md:mx-0">
                <table className="w-full border-collapse min-w-[900px]" aria-label={t('matrixTitle')}>
                    <thead>
                        <tr className="[&>th]:border [&>th]:px-3 [&>th]:py-2 bg-neutral-50 text-left">
                            <th
                                className="sticky left-0 z-10 bg-neutral-50 w-40 min-w-[160px] whitespace-nowrap"
                                scope="col"
                            >
                                {t('feature')}
                            </th>
                            <th className="w-60 min-w-[220px] whitespace-nowrap" scope="col">
                                {t('free.name')}
                            </th>
                            <th className="w-60 min-w-[220px] whitespace-nowrap" scope="col">
                                {t('pro.name')}
                            </th>
                            <th className="w-60 min-w-[220px] whitespace-nowrap" scope="col">
                                {t('pro_plus.name')}
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        <Row
                            label={t('monthly')}
                            free={t('free.price')}
                            pro={t('pro.price')}
                            proPlus={t('pro_plus.price')}
                        />
                        <Row
                            label={t('maxPerMonth')}
                            free={t('free.limit')}
                            pro={t('pro.limit')}
                            proPlus={t('pro_plus.limit')}
                        />
                        <Row
                            label={t('topup')}
                            free={t('notes.topupNote')}
                            pro={t('notes.topupNote')}
                            proPlus={t('notes.topupNote')}
                        />
                        <Row
                            label={t('bullets.bannerAds')}
                            free={t('bullets.bannerAds')}
                            pro={t('bullets.noAds')}
                            proPlus={t('bullets.noAds')}
                        />
                    </tbody>
                </table>
            </div>

            <ol className="mt-3 list-decimal space-y-1 pl-5 text-[12px] text-neutral-500">
                <li>{t('notes.commonCap')}</li>
                <li>{t('notes.topupNote')}</li>
            </ol>

            <p className="mt-2 text-right text-[11px] text-neutral-400">
                {t('lastUpdated', { date: lastUpdated })}
            </p>
        </section>
    );
}
