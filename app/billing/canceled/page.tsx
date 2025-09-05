'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function CanceledPage() {
    const t = useTranslations()
    const loc =
        typeof document !== 'undefined'
            ? (document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)?.[1] || 'en')
            : 'en'

    return (
        <main className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg">
            <h1 className="mb-2 text-2xl font-semibold">{t('billing.canceled.title')}</h1>
            <p className="mb-6 text-neutral-600">{t('billing.canceled.body')}</p>
            <Link href={`/${loc}`} className="rounded bg-neutral-700 px-4 py-2 text-white">
                {t('billing.canceled.back')}
            </Link>
        </main>
    )
}
