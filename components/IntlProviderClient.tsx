'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import type { ReactNode } from 'react';

export default function IntlProviderClient({
    locale,
    messages,
    children
}: {
    locale: string;
    messages: AbstractIntlMessages;
    children: ReactNode;
}) {
    return (
        <NextIntlClientProvider
            locale={locale}
            messages={messages}
            // ここはクライアント内なので関数OK
            onError={(err) => {
                if (err.code !== 'MISSING_MESSAGE') console.error(err);
            }}
            getMessageFallback={({ key, namespace }) =>
                `[${namespace ? `${namespace}.` : ''}${key}]`
            }
        >
            {children}
        </NextIntlClientProvider>
    );
}
