import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

<<<<<<< HEAD
export const runtime = 'nodejs' // 莉ｻ諢上□縺梧耳螂ｨ・・dge縺ｧ縺ｯ蜍輔°縺ｪ縺・◆繧・ｼ・

export async function POST(_req: NextRequest) {
    const sb = await supabaseServer() // 竊・await 繧剃ｻ倥￠繧・
=======
export const runtime = 'nodejs' // 髣比ｼ夲ｽｽ・ｻ髫ｲ・｢闕ｳ蟯ｩ蜻ｳ驍ｵ・ｺ隴ｴ・ｧ髢・ｳ髯槭ｑ・ｽ・ｨ郢晢ｽｻ郢晢ｽｻdge驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ繝ｻ・ｯ髯ｷ蟠趣ｽｼ譚ｿ・ｰ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ隨ｳ繝ｻ・ｹ・ｧ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻ

export async function POST(_req: NextRequest) {
    const sb = await supabaseServer() // 驕ｶ鄙ｫ繝ｻawait 驛｢・ｧ陷代・・ｽ・ｻ陋滂ｽ･繝ｻ・ｰ驛｢・ｧ郢晢ｽｻ
>>>>>>> deploy-test

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
