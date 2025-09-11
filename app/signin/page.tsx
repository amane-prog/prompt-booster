// app/signin/page.tsx
'use client';

<<<<<<< HEAD
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabaseClient';

// .next/types が Promise<any> を期待しているため、Promise 互換に揃える（any 不使用）
type PageProps = {
    params?: Promise<Record<string, string | string[]>>;
    searchParams?: Promise<Record<string, string | string[]>>;
};
=======
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabaseClient' // 髫ｨ蛟･繝ｻ驍ｵ・ｺ髦ｮ蜻ｻ・ｽ讙趣ｽｸ・ｺ隶吝ｯゆｼｯ驍ｵ・ｺ郢晢ｽｻ遶雁､・ｸ・ｲ鬮ｱ・ｴannot find name 'supabase'驍ｵ・ｲ郢晢ｽｻ

export default function SignInPage() {
    const t = useTranslations()
    const router = useRouter()
    const [email, setEmail] = useState('')         // 髫ｨ蛟･繝ｻemail 驛｢・ｧ陜｣・､騾｡鬘鯉ｽｫ・｢隰ｫ・ｾ繝ｻ・ｼ郢晢ｽｻhorthand error髯昴・・ｽ・ｾ鬩包ｽｲ陷ｴ繝ｻ・ｽ・ｼ郢晢ｽｻ
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)
>>>>>>> deploy-test

export default function SignInPage(_props: PageProps) {
    const t = useTranslations();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setMsg(null);
        try {
<<<<<<< HEAD
            // リダイレクト先のオリジンを決定
=======
            // 髫ｨ蛟･繝ｻ髯樊ｺｽ蛻､霎溷､頑・鬮ｦ・ｪ郢晢ｽｻ 'origin' 驍ｵ・ｺ繝ｻ・ｨ鬮ｯ・ｲ繝ｻ・ｫ驛｢・ｧ驗呻ｽｫ繝ｻ繝ｻ・ｸ・ｺ陷ｷ・ｶ繝ｻ讓抵ｽｸ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｧ siteOrigin 驍ｵ・ｺ繝ｻ・ｫ
>>>>>>> deploy-test
            const siteOrigin =
                typeof window !== 'undefined'
                    ? window.location.origin
                    : process.env.NEXT_PUBLIC_SITE_ORIGIN || 'http://localhost:3000';

            const { error } = await supabase.auth.signInWithOtp({
                email,
<<<<<<< HEAD
                options: { emailRedirectTo: `${siteOrigin}/auth/callback` },
            });
=======
                options: { emailRedirectTo: `${siteOrigin}/auth/callback` }, // 髫ｨ蛟･繝ｻcallback驍ｵ・ｺ繝ｻ・ｸ
            })
>>>>>>> deploy-test

            if (error) {
                setMsg(error.message);
            } else {
                setMsg(
                    t.has('signin.checkMail')
                        ? t('signin.checkMail')
                        : 'Check your email for the magic link.'
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-md p-6">
            <h1 className="mb-4 text-lg font-semibold">
                {t.has('signin.title') ? t('signin.title') : 'Sign in'}
            </h1>
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded border px-3 py-2"
                />
                <button
                    type="submit"
                    disabled={loading || !email}
                    className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                >
<<<<<<< HEAD
                    {loading
                        ? t.has('signin.sending')
                            ? t('signin.sending')
                            : 'Sending…'
                        : t.has('signin.send')
                            ? t('signin.send')
                            : 'Send magic link'}
=======
                    {loading ? (t.has('signin.sending') ? t('signin.sending') : 'Sending驕ｯ・ｶ繝ｻ・ｦ') : (t.has('signin.send') ? t('signin.send') : 'Send magic link')}
>>>>>>> deploy-test
                </button>
            </form>
            {msg && <p className="mt-3 text-sm text-neutral-600">{msg}</p>}
        </div>
    );
}
