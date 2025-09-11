import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// import type { Database } from './types' // 髯懷姓・ｹ譏ｶﾂ・ｲ驍ｵ・ｺ郢ｧ繝ｻ・ｽ讙趣ｽｸ・ｺ繝ｻ・ｰ髣厄ｽｴ繝ｻ・ｿ驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ繝ｻ・ｦOK

export async function supabaseServer() {
    const jar = await cookies() // Next.js 15: Promise
    return createServerClient/*<Database>*/(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return jar.get(name)?.value
                },
                // set/remove 驍ｵ・ｺ繝ｻ・ｯ髫ｴ蟷｢・ｽ・ｪ髯橸ｽｳ雋・ｽｯ繝ｻ・｣郢晢ｽｻ邵ｲ荳ｹK郢晢ｽｻ郢晢ｽｻSC驍ｵ・ｺ繝ｻ・ｧ驛｢・ｧ郢ｧ繝ｻ・ｽ・ｮ霑壼生繝ｻ郢晢ｽｻ郢晢ｽｻ
            },
        }
    )
}
