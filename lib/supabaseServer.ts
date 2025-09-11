// lib/supabaseServer.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// import type { Database } from './types'

export async function supabaseServer() {
    const jar = (await cookies()) as import('next/dist/server/web/spec-extension/adapters/request-cookies').ReadonlyRequestCookies

    return createServerClient/*<Database>*/(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return jar.get(name)?.value
                },
                set() { /* no-op for server */ },
                remove() { /* no-op for server */ },
            },
        }
    )
}
