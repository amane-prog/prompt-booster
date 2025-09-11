// app/auth/callback/route.ts （または app/api/auth/callback/route.ts）
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
    // ... ここでセッション確立などの処理 ...
    const hdrs = await headers()
    const loc = hdrs.get('cookie')?.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)?.[1] ?? 'ja'
    const origin = hdrs.get('origin') ?? `https://${hdrs.get('host')}`
    const redirectTo = `${origin}/${encodeURIComponent(loc)}/settings/billing`

    return NextResponse.redirect(redirectTo, { headers: { 'Cache-Control': 'no-store' } })
}
