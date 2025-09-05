import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// import type { Database } from './types' // 型があれば使ってOK

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
                // set/remove は未実装でOK（RSCでも安全）
            },
        }
    )
}
