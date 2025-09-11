'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'   // 髫ｨ蛟･繝ｻimport 髯滂ｽ｢陋滂ｽ･繝ｻ遒・ｽｫ・ｦ繝ｻ・ｲ髮弱・・ｽ・｢

export default function AuthCallback() {
    const router = useRouter()

    useEffect(() => {
        ; (async () => {
            // 髫ｨ蛟･繝ｻ驛｢譎冗樟郢晢ｽ｣驛｢譎丞ｹｲ・取ｨ抵ｽｹ譎冗函・弱・await 驛｢・ｧ陝ｶ譏ｶ闌憺し・ｺ闔会ｽ｣・つ邵ｲ闌仔Effect 髯ｷﾂ郢晢ｽｻ邵ｲ繝ｻawait
            const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
            // Cookie 驍ｵ・ｺ繝ｻ・ｮ NEXT_LOCALE 驛｢・ｧ陞ｳ螟ｲ・ｽ・ｪ繝ｻ・ｭ驛｢・ｧ髦ｮ蜷ｶﾂ螳夲ｽｬ魃会ｽｽ・ｻ驛｢・ｧ闕ｵ譁滓ｺｽ・ｹ・ｧ繝ｻ・ｱ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ驛｢・ｧ陷ｻ闌ｨ・ｽ・ｱ繝ｻ・ｺ髯橸ｽｳ郢晢ｽｻ
            const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
            const nextLocale = m?.[1] || 'en'
            router.replace(`/${nextLocale}`)
            if (error) console.warn('[auth callback] exchange error:', error)
        })()
    }, [router])

    return (
        <div className="grid min-h-[60vh] place-items-center p-8 text-center">
            <div>
                <div className="mb-2 text-sm text-neutral-500">Signing you in驕ｯ・ｶ繝ｻ・ｦ</div>
                <div className="text-xs text-neutral-400">Please wait</div>
            </div>
        </div>
    )
}
