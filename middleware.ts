// middleware.ts
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';

// next-intl による i18n 付与（/ja/... /en/... を常に付ける）
const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always'
});

export default function middleware(req: NextRequest) {
    // i18n ルーティングをまず適用
    const res = intlMiddleware(req);

    // 追加の軽量セキュリティヘッダ（CSPは next.config.ts の headers() 推奨）
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return res;
}

// i18n を適用する対象を指定
// 除外: /api, /_next, 静的ファイル(拡張子あり), robots.txt/sitemap.xml/favicon.ico 等
export const config = {
    matcher: [
        '/((?!api|_next|.*\\..*|robots\\.txt|sitemap\\.xml|favicon\\.ico).*)'
    ]
};
