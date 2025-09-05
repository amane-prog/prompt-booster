type PageProps = {
  params?: Record<string, string | string[]>;
  searchParams?: Record<string, string | string[]>;
};
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'   // 笘・import 蠢倥ｌ髦ｲ豁｢

export default function AuthCallback(_props: PageProps) {
    const router = useRouter()

    useEffect(() => {
        ; (async () => {
            // 笘・繝医ャ繝励Ξ繝吶Ν await 繧帝∩縺代「seEffect 蜀・〒 await
            const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
            // Cookie 縺ｮ NEXT_LOCALE 繧定ｪｭ繧薙〒謌ｻ繧九Ο繧ｱ繝ｼ繝ｫ繧呈ｱｺ螳・
            const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
            const nextLocale = m?.[1] || 'en'
            router.replace(`/${nextLocale}`)
            if (error) console.warn('[auth callback] exchange error:', error)
        })()
    }, [router])

    return (
        <div className="grid min-h-[60vh] place-items-center p-8 text-center">
            <div>
                <div className="mb-2 text-sm text-neutral-500">Signing you in窶ｦ</div>
                <div className="text-xs text-neutral-400">Please wait</div>
            </div>
        </div>
    )
}
