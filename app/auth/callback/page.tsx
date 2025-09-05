// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// 動的セグメントなし。`.next/types` 側が Promise を期待するので Promise を許容（any は使わない）
type PageParams = {};
type PageSearchParams = Record<string, string | string[]>;

type PageProps = {
    params?: Promise<PageParams>;
    searchParams?: Promise<PageSearchParams>;
};

export default function AuthCallback(_props: PageProps) {
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                // Supabase: OAuth コードをセッションへ交換
                const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

                // NEXT_LOCALE クッキーから遷移先のロケールを決定（無ければ en）
                const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/);
                const nextLocale = m?.[1] ?? 'en';

                // 先に遷移（エラーはログに残すだけ）
                router.replace(`/${nextLocale}`);
                if (error) console.warn('[auth/callback] exchangeCodeForSession error:', error);
            } catch (e) {
                console.warn('[auth/callback] unexpected error:', e);
                router.replace('/'); // フォールバック
            }
        })();
    }, [router]);

    return (
        <div className="grid min-h-[60vh] place-items-center p-8 text-center">
            <div>
                <div className="mb-2 text-sm text-neutral-500">Signing you in…</div>
                <div className="text-xs text-neutral-400">Please wait</div>
            </div>
        </div>
    );
}
