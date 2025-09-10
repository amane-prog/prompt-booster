// lib/supabaseServerCtx.ts
import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { getCookieValue } from './cookies.server'
import { parseCookieHeader } from './cookies.server';

export function supabaseServerCtx(req?: NextRequest | Request) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string): string | undefined { const cookie = req?.headers?.get('cookie') ?? ''; const map = parseCookieHeader(cookie); return map[name]; },
                set() { },   // API ���[�g�ł͒ʏ�s�v�i�K�v�Ȃ�Response��Set-Cookie��Ԃ��݌v�Ɂj
                remove() { }
            }
        }
    )
}



