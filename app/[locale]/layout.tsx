// app/[locale]/layout.tsx
import type { ReactNode } from 'react';
import type { LayoutProps } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n';
import Header from '@/components/Header';
import '@/styles/globals.css';

export const dynamic = 'force-static';

function isLocale(x: string): x is Locale {
    return (locales as readonly string[]).includes(x);
}

export function generateStaticParams(): ReadonlyArray<{ locale: Locale }> {
    return (locales as readonly Locale[]).map((l) => ({ locale: l }));
}

export default async function LocaleLayout({
    children,
    params,
}: LayoutProps<'/[locale]'>) {
    // ★ Next 15 では params が Promise なので await が必要
    const { locale: rawLocale } = await params;

    if (!isLocale(rawLocale)) notFound();
    setRequestLocale(rawLocale);

    let messages: Record<string, unknown>;
    try {
        messages = (await import(`@/messages/${rawLocale}.json`)).default as Record<string, unknown>;
    } catch {
        messages = (await import('@/messages/en.json')).default as Record<string, unknown>;
    }

    const t = await getTranslations({ locale: rawLocale });

    return (
        <html lang={rawLocale}>
            <body className="min-h-dvh bg-white text-gray-900 antialiased">
                <NextIntlClientProvider locale={rawLocale} messages={messages}>
                    <Header />
                    <main className="mx-auto w-full px-4 py-6 max-w-screen-2xl 3xl:max-w-screen-3xl 4xl:max-w-screen-4xl">
                        {children}
                    </main>
                    <footer className="w-full border-t bg-white">
                        <div className="mx-auto flex flex-col md:flex-row md:items-center md:justify-between px-4 py-6 gap-3 max-w-screen-2xl 3xl:max-w-screen-3xl 4xl:max-w-screen-4xl">
                            <span className="text-xs text-neutral-500">
                                © {new Date().getFullYear()} Prompt Booster (Beta)
                            </span>
                            <div className="flex flex-wrap gap-3 text-xs">
                                <a href={`/${rawLocale}/terms`} className="underline text-neutral-600">
                                    {t('legal.terms')}
                                </a>
                                <a href={`/${rawLocale}/privacy`} className="underline text-neutral-600">
                                    {t('legal.privacy')}
                                </a>
                                <a href={`/${rawLocale}/billing/portal`} className="underline text-blue-600">
                                    {t('nav.manage')}
                                </a>
                            </div>
                        </div>
                    </footer>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
