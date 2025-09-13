// app/[locale]/auth/callback/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallback() {
    const router = useRouter();
    const sp = useSearchParams();

    useEffect(() => {
        const code = sp.get('code');
        if (!code) { router.replace('/'); return; }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        (async () => {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            // ����/���s�ǂ����ł��z�[���ցi�D�݂Ń��_�C���N�g�撲���j
            router.replace('/');
        })();
    }, [router, sp]);

    return <div className="p-6 text-sm text-neutral-600">Signing you in�c</div>;
}
