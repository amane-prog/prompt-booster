import { createClient } from '@supabase/supabase-js'
// import type { Database } from './types'

export function supabaseAdmin() {
    return createClient/*<Database>*/(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,   // 驕ｶ鄙ｫ繝ｻserver 髯昴・・蛾｡驢搾ｽｸ・ｲ郢ｧ繝ｻ繝ｻ鬯ｮ・｢闕ｵ譎｢・ｼ・ｰ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻ
        { auth: { persistSession: false, autoRefreshToken: false } }
    )
}
