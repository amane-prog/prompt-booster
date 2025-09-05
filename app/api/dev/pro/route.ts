import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs' // 任意だが推奨（Edgeでは動かないため）

export async function POST(_req: NextRequest) {
    const sb = await supabaseServer() // ← await を付ける

    const { data: userRes } = await sb.auth.getUser().catch(() => ({ data: { user: null } as any }))
    const userId = userRes?.user?.id
    if (!userId) return new NextResponse('unauthorized', { status: 401 })

    const proUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const { error } = await sb
        .from('user_billing')
        .upsert({ user_id: userId, pro_until: proUntil })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, pro_until: proUntil })
}
