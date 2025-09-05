'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { locales } from '@/i18n';

export default function LanguageSwitcher({ className }: { className?: string }) {
    const current = useLocale();
    const t = useTranslations();
    const router = useRouter();
    const pathname = usePathname() || '/';
    const searchParams = useSearchParams();

    // 当面は ja/en のみ
    const enabled = (locales as readonly string[]).filter(l => l === 'ja' || l === 'en');

    function swapLocaleInPath(path: string, next: string) {
        const list = locales as readonly string[];
        const parts = path.split('/');
        if (parts[1] && list.includes(parts[1])) {
            parts[1] = next;
            const replaced = parts.join('/');
            return replaced.startsWith('/') ? replaced : `/${replaced}`;
        }
        return `/${next}${path === '/' ? '' : path}`;
    }

    function labelFor(code: string) {
        try {
            const dn = new Intl.DisplayNames([current], { type: 'language' });
            return dn.of(code) ?? code.toUpperCase();
        } catch {
            return code.toUpperCase();
        }
    }

    const value = enabled.includes(current) ? current : enabled[0];

    return (
        <select
            aria-label={t('nav.language')}
            className={className ?? 'h-8 rounded-md border px-2 text-sm bg-white'}
            value={value}
            onChange={e => {
                const next = e.target.value;
                const newPath = swapLocaleInPath(pathname, next);
                const qs = searchParams.toString();
                router.replace(qs ? `${newPath}?${qs}` : newPath);

                const isProd = process.env.NODE_ENV === 'production';
                document.cookie = [
                    `NEXT_LOCALE=${next}`,
                    'Path=/',
                    'Max-Age=31536000',
                    'SameSite=Lax',
                    isProd ? 'Secure' : '',
                ].filter(Boolean).join('; ');
            }}
        >
            {enabled.map(loc => (
                <option key={loc} value={loc}>
                    {labelFor(loc)}
                </option>
            ))}
        </select>
    );
}
