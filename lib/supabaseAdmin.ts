import { createClient } from '@supabase/supabase-js'
// import type { Database } from './types'

export function supabaseAdmin() {
    return createClient/*<Database>*/(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,   // ← server 専用。公開しない！
        { auth: { persistSession: false, autoRefreshToken: false } }
    )
}
