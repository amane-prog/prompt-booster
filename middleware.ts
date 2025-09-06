// middleware.ts
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

// i18n は「ページだけ」に適用
const intl = createMiddleware({ locales, defaultLocale, localePrefix: 'always' })

// 素通り対象
const BYPASS = [
    /^\/auth\/callback$/,           // Supabase Magic Link（非ロケール）
    /^\/(ja|en)\/auth\/callback$/,  // ロケール付き中継
    /^\/api\/stripe\/webhook$/,     // Stripe Webhook
    /^\/_next\//, /^\/favicon\.ico$/, /^\/robots\.txt$/, /^\/sitemap\.xml$/, /\.[\w]+$/ // 静的
]

// メンテ：1/true/on/yes のいずれかでON
function isMaintenanceOn() {
    const v = (process.env.MAINTENANCE ?? '').trim().toLowerCase()
    return v === '1' || v === 'true' || v === 'on' || v === 'yes'
}

// BASIC 共通
function requireBasic(req: NextRequest): NextResponse | null {
    const user = process.env.BASIC_AUTH_USER
    const pass = process.env.BASIC_AUTH_PASS
    const hdr = req.headers.get('authorization') || ''
    if (!user || !pass || !hdr.startsWith('Basic ')) {
        return new NextResponse('Auth required', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
        })
    }
    const [u, p] = atob(hdr.slice(6)).split(':')
    if (u !== user || p !== pass) {
        return new NextResponse('Invalid credentials', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
        })
    }
    return null
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // 1) メンテ最優先（全ルート503）
    if (isMaintenanceOn() && !/^\/api\/stripe\/webhook$/.test(pathname)) {
        return new NextResponse('Service temporarily unavailable', { status: 503 })
    }

    // 2) /api は i18n を適用しない
    if (pathname.startsWith('/api')) {
        // webhook は BASIC もスキップ
        if (/^\/api\/stripe\/webhook$/.test(pathname)) {
            return NextResponse.next()
        }
        // それ以外の /api は BASIC のみ要求
        const gate = requireBasic(req); if (gate) return gate
        return NextResponse.next()
    }

    // 3) BYPASS は素通り
    if (BYPASS.some(re => re.test(pathname))) {
        return NextResponse.next()
    }

    // 4) ページは BASIC → i18n
    const gate = requireBasic(req); if (gate) return gate

    const res = intl(req)
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    return res
}

// ✅ ここが超重要：/api を matcher から除外（/ja/api/... への巻き込みを物理的に防ぐ）
export const config = {
    matcher: [
        '/((?!api|_next|.*\\..*|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)'
    ]
}
