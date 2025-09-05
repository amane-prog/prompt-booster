// middleware.ts（置き換え）
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

const intl = createMiddleware({ locales, defaultLocale, localePrefix: 'always' })

const BYPASS = [
    /^\/auth\/callback$/,             // Supabase Magic Link 受け口（非ロケール）
    /^\/(ja|en)\/auth\/callback$/,    // ロケール付きは中継ルートが対応
    /^\/api\/stripe\/webhook$/,       // Stripe Webhook（外部サービス → BASIC不可）
    /^\/_next\//, /^\/favicon\.ico$/, /^\/robots\.txt$/, /^\/sitemap\.xml$/, /\.[\w]+$/
]

// ── 追加: BASIC判定関数（共通化）
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

    // ── 1) メンテスイッチ（無料で全停止）
    if (process.env.MAINTENANCE === '1') {
        return new NextResponse('Service temporarily unavailable', { status: 503 })
    }

    // ── 2) /api は i18n を適用しない
    if (pathname.startsWith('/api')) {
        // webhook は BASIC もスキップ
        if (/^\/api\/stripe\/webhook$/.test(pathname)) {
            return NextResponse.next()
        }
        // それ以外の /api は BASIC 必須（同一オリジンからは自動で送られる）
        const gate = requireBasic(req)
        if (gate) return gate
        return NextResponse.next()
    }

    // ── 3) BYPASS は素通り（静的/コールバック等）
    if (BYPASS.some(re => re.test(pathname))) {
        return NextResponse.next()
    }

    // ── 4) ページは BASIC → i18n を適用
    const gate = requireBasic(req)
    if (gate) return gate

    const res = intl(req)
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    return res
}

export const config = { matcher: '/:path*' }
