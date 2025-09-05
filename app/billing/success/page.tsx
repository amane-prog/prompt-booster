// app/[locale]/billing/success/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// .next/types 側が Promise を期待しているので Promise<> 互換に修正
type PageProps = {
    params?: Promise<Record<string, string | string[]>>;
    searchParams?: Promise<Record<string, string | string[]>>;
};

export default function SuccessPage(_props: PageProps) {
    const t = useTranslations();
    const router = useRouter();
    const sp = useSearchParams();
    const sid = sp.get('session_id') ?? 'unknown';
    const loc =
        sp.get('loc') ||
        (typeof document !== 'undefined'
            ? document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)?.[1]
            : '') ||
        'en';

    useEffect(() => {
        const tmr = setTimeout(() => router.refresh(), 500);
        return () => clearTimeout(tmr);
    }, [router]);

    return (
        <main className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-lg">
            <h1 className="mb-2 text-2xl font-semibold">{t('billing.success.title')}</h1>
            <p className="mb-4 text-neutral-600">{t('billing.success.body')}</p>

            <div className="mb-6 rounded bg-neutral-50 p-2">
                <div className="text-xs text-neutral-500">session_id</div>
                <code className="block break-all text-sm">{sid}</code>
            </div>

            <div className="flex items-center gap-3">
                <Link
                    href={`/${loc}`}
                    className="rounded bg-blue-600 px-4 py-2 text-white"
                >
                    {t('billing.success.back')}
                </Link>
                <button
                    onClick={() => router.refresh()}
                    className="rounded border px-3 py-2"
                >
                    {t('billing.success.refresh')}
                </button>
            </div>

            <p className="mt-4 text-sm text-neutral-500">{t('billing.success.note')}</p>
        </main>
    );
}
