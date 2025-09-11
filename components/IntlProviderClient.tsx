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
            // 驍ｵ・ｺ髦ｮ蜻ｻ・ｼ繝ｻ・ｸ・ｺ繝ｻ・ｯ驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｩ驛｢・ｧ繝ｻ・､驛｢・ｧ繝ｻ・｢驛｢譎｢・ｽ・ｳ驛｢譏懶ｽｺ・･郢晢ｽｻ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｧ鬯ｮ・｢繝ｻ・｢髫ｰ・ｨ繝ｻ・ｰOK
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
