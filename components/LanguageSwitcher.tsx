'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { locales } from '@/i18n';

// 髯懈圜・ｽ・ｺ髯橸ｽｳ陞｢・ｼ繝ｻ・ｯ繝ｻ・ｾ髯滂ｽ｢隲幄時貅ｽ・ｹ・ｧ繝ｻ・ｱ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ郢晢ｽｻ闔・･繝ｻ・ｽ鬯･・ｴ隰ｫ繝ｻ・ｸ・ｺ繝ｻ・ｯ ja/en郢晢ｽｻ郢晢ｽｻ
const enabled = ['ja', 'en'] as const;
type EnabledLocale = typeof enabled[number];

function isEnabledLocale(x: string): x is EnabledLocale {
    return (enabled as readonly string[]).includes(x);
}

export default function LanguageSwitcher({ className }: { className?: string }) {
    const current = useLocale(); // string 髫ｰ繝ｻ・ｽ・ｱ驍ｵ・ｺ郢晢ｽｻ
    const t = useTranslations();
    const router = useRouter();
    const pathname = usePathname() || '/';
    const searchParams = useSearchParams();

    function swapLocaleInPath(path: string, next: EnabledLocale) {
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

    // current 驍ｵ・ｺ繝ｻ・ｯ string 驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｲ邵ｲ蜿角e guard 驍ｵ・ｺ繝ｻ・ｧ EnabledLocale 驍ｵ・ｺ繝ｻ・ｫ鬩搾ｽｨ隶抵ｽｭ繝ｻ繝ｻ
    const value: EnabledLocale = isEnabledLocale(current) ? current : enabled[0];

    return (
        <select
            aria-label={t('nav.language')}
            className={className ?? 'h-8 rounded-md border px-2 text-sm bg-white'}
            value={value}
            onChange={(e) => {
                const next = e.target.value as EnabledLocale;
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
                ]
                    .filter(Boolean)
                    .join('; ');
            }}
        >
            {enabled.map((loc) => (
                <option key={loc} value={loc}>
                    {labelFor(loc)}
                </option>
            ))}
        </select>
    );
}
