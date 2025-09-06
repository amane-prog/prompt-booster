// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const next = url.searchParams.get('next') || '/'

    if (!code) return NextResponse.redirect(new URL('/signin?error=missing_code', url.origin))

    const sb = supabaseServer()
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(new URL('/signin?error=auth', url.origin))

    // ロケールCookie（NEXT_LOCALE）に従って遷移したい場合は必要に応じて読み替え
    return NextResponse.redirect(new URL(next, url.origin))
}
