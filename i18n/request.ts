// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';

export default getRequestConfig(async ({ requestLocale }) => {
    const req = (await requestLocale) || 'ja';
    const supported = new Set(['ja', 'en'] as const);
    const locale = (supported.has(req as any) ? req : 'ja') as 'ja' | 'en';

    let messages: AbstractIntlMessages;
    if (locale === 'ja') {
        messages = (await import('@/messages/ja.json')).default;
    } else {
        messages = (await import('@/messages/en.json')).default;
    }

    return { locale, messages };
});
