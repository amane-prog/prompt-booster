// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer' // サーバ側で使う場合（不要なら削除）

// ここでは「/auth/callback?code=...」で来た時にセッション交換 or リダイレクトだけやる
export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const next = url.searchParams.get('next') || '/'

    if (!code) {
        // locale付きで来た場合なども含め、単にUIページへ流してクライアントで処理してもOK
        // ここで完結させたいなら supabaseServer().auth.exchangeCodeForSession(code) を実行してもよい
        return NextResponse.redirect(new URL(`/auth/callback${url.search}`, url.origin))
    }

    // サーバ側で完結させたい派：コメントアウト解除
    // const sb = supabaseServer()
    // const { error } = await sb.auth.exchangeCodeForSession(code)
    // if (error) return NextResponse.redirect(new URL('/signin?error=auth', url.origin))

    // ここではクライアントUIへ渡す
    return NextResponse.redirect(new URL(`/auth/callback${url.search}`, url.origin))
}
