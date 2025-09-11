<<<<<<< HEAD
'use client';
type PageParams = { locale: string };
type PageSearchParams = Record<string, string | string[]>;

type PageProps = {
  params?: Promise<PageParams>;
  searchParams?: Promise<PageSearchParams>;
};
// app/[locale]/page.tsx
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import ExecuteFab from '@/components/ExecuteFab';
import Toast from '@/components/Toast';
import AdvancedControls, {
    type Mode,
    type ColorTone,
    type Ratio,
    type DialogueTone
} from '@/components/AdvancedControls';
import { handleTopup } from '@/utils/stripe';
import CompactPlans from '@/components/CompactPlans';
import PlanDialog from '@/components/PlanDialog';
import CreditLimitModal from '@/components/CreditLimitModal';
=======
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabaseClient' // 髫ｨ蛟･繝ｻ驍ｵ・ｺ髦ｮ蜻ｻ・ｽ讙趣ｽｸ・ｺ隶吝ｯゆｼｯ驍ｵ・ｺ郢晢ｽｻ遶雁､・ｸ・ｲ鬮ｱ・ｴannot find name 'supabase'驍ｵ・ｲ郢晢ｽｻ
>>>>>>> deploy-test

export default function SignInPage() {
    const t = useTranslations()
    const router = useRouter()
    const [email, setEmail] = useState('')         // 髫ｨ蛟･繝ｻemail 驛｢・ｧ陜｣・､騾｡鬘鯉ｽｫ・｢隰ｫ・ｾ繝ｻ・ｼ郢晢ｽｻhorthand error髯昴・・ｽ・ｾ鬩包ｽｲ陷ｴ繝ｻ・ｽ・ｼ郢晢ｽｻ
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email) return

<<<<<<< HEAD
    // Pro/Pro+ 用
    subCap?: number | null;
    subUsed?: number | null;
    subRemaining?: number | null;

    // Top-up
    topupRemain?: number;
    topups?: { remain: number; expire_at: string }[];

    isPro?: boolean;
};

type BoostResp = {
    text?: string;
    output?: string;
    remain?: number | null;
    highlights?: string[];
    truncated?: boolean;
};

// ---- util ----
function fmtHMS(total: number): string {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function HomePage(_props: PageProps) {
    const t = useTranslations('ui');
    const toastT = useTranslations('toast');
    const creditT = useTranslations('credit');
    const headerT = useTranslations('header');
    const f = useFormatter();

    // 入力
    const [input, setInput] = useState('');
    const [emphasis, setEmphasis] = useState('');

    // 詳細設定
    const [mode, setMode] = useState<Mode>('dialogue');
    const [color, setColor] = useState<ColorTone>('auto');
    const [tone, setTone] = useState<DialogueTone>('auto');
    const [dialogueTags, setDialogueTags] = useState<string[]>([]);
    const [ratio, setRatio] = useState<Ratio>('auto');
    const [genStyles, setGenStyles] = useState<string[]>([]);

    // 出力/状態
    const [output, setOutput] = useState('');
    const [remain, setRemain] = useState<number | null>(null); // Free用
    const [tier, setTier] = useState<'free' | 'pro' | 'pro_plus'>('free');
    const [proUntil, setProUntil] = useState<string | null>(null);

    // Pro/Pro+ 残数
    const [subRemain, setSubRemain] = useState<number | null>(null);
    const [subCap, setSubCap] = useState<number | null>(null);

    // Top-up
    const [topupRemain, setTopupRemain] = useState<number>(0);
    const [topups, setTopups] = useState<{ remain: number; expire_at: string }[]>([]);
    const [buying, setBuying] = useState<'300' | '1000' | null>(null);

    // トースト
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const showToast = (msg: string) => setToastMsg(msg);

    // モーダル（クレジット不足・プラン詳細）
    const [limitOpen, setLimitOpen] = useState(false);
    const [limitResetSec, setLimitResetSec] = useState<number | null>(null);
    const [planOpen, setPlanOpen] = useState(false);

    const isPro = tier !== 'free';
    const canUseBoost = useMemo(
        () => (isPro ? true : typeof remain === 'number' ? remain > 0 : true),
        [isPro, remain]
    );

    const toHighlightsArray = (raw: string): string[] =>
        raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 10);

    // ---- ステータス再取得 ----
    const refreshStatus = useCallback(async () => {
=======
        setLoading(true)
        setMsg(null)
>>>>>>> deploy-test
        try {
            // 髫ｨ蛟･繝ｻ髯樊ｺｽ蛻､霎溷､頑・鬮ｦ・ｪ郢晢ｽｻ 'origin' 驍ｵ・ｺ繝ｻ・ｨ鬮ｯ・ｲ繝ｻ・ｫ驛｢・ｧ驗呻ｽｫ繝ｻ繝ｻ・ｸ・ｺ陷ｷ・ｶ繝ｻ讓抵ｽｸ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｧ siteOrigin 驍ｵ・ｺ繝ｻ・ｫ
            const siteOrigin =
                typeof window !== 'undefined'
                    ? window.location.origin
                    : process.env.NEXT_PUBLIC_SITE_ORIGIN || 'http://localhost:3000'

            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${siteOrigin}/auth/callback` }, // 髫ｨ蛟･繝ｻcallback驍ｵ・ｺ繝ｻ・ｸ
            })

            if (error) {
                setMsg(error.message)
            } else {
                setMsg(t.has('signin.checkMail') ? t('signin.checkMail') : 'Check your email for the magic link.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mx-auto max-w-md p-6">
            <h1 className="mb-4 text-lg font-semibold">{t.has('signin.title') ? t('signin.title') : 'Sign in'}</h1>
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
                    {loading ? (t.has('signin.sending') ? t('signin.sending') : 'Sending驕ｯ・ｶ繝ｻ・ｦ') : (t.has('signin.send') ? t('signin.send') : 'Send magic link')}
                </button>
            </form>
            {msg && <p className="mt-3 text-sm text-neutral-600">{msg}</p>}
        </div>
    )
}
