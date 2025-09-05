import '@/styles/globals.css';
import type { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';
import { type AbstractIntlMessages } from 'next-intl';
import IntlProviderClient from '@/components/IntlProviderClient';

const SUPPORTED = ['en', 'ja', 'es', 'it'] as const;
type Supported = (typeof SUPPORTED)[number];

function pickLocale(cookieLocale?: string, acceptLanguage?: string): Supported {
    const list = SUPPORTED as readonly string[];
    const fromCookie = cookieLocale && list.includes(cookieLocale) ? (cookieLocale as Supported) : undefined;
    const lang2 = acceptLanguage?.split(',')[0]?.slice(0, 2);
    const fromHeader = lang2 && list.includes(lang2) ? (lang2 as Supported) : undefined;
    return fromCookie ?? fromHeader ?? 'en';
}

export default async function BillingLayout({ children }: { children: ReactNode }) {
    const jar = await cookies();
    const hdrs = await headers();

    const locale = pickLocale(jar.get('NEXT_LOCALE')?.value, hdrs.get('accept-language') ?? '');

    let messages: AbstractIntlMessages;
    if (locale === 'ja') {
        messages = (await import('@/messages/ja.json')).default;
    } else if (locale === 'es') {
        messages = (await import('@/messages/es.json')).default;
    } else if (locale === 'it') {
        messages = (await import('@/messages/it.json')).default;
    } else {
        messages = (await import('@/messages/en.json')).default;
    }

    return (
        <html lang={locale}>
            <body className="bg-neutral-50">
                <IntlProviderClient locale={locale} messages={messages}>
                    {/* 画面中央にカード配置 */}
                    <div className="grid min-h-screen place-items-center px-4">{children}</div>
                </IntlProviderClient>
            </body>
        </html>
    );
}
