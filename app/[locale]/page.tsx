// app/[locale]/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslations, useFormatter } from 'next-intl';

import ExecuteFab from '@/components/ExecuteFab';
import Toast from '@/components/Toast';
import AdvancedControlsV2, {
    type Mode,
    type ColorTone,
    type Ratio,
    type DialogueTone,
    type ControlsValue,
} from '@/components/AdvancedControlsV2';
import CompactPlans from '@/components/CompactPlans';
import PlanDialog from '@/components/PlanDialog';
import CreditLimitModal from '@/components/CreditLimitModal';

// ---- ルーティング型（必要なら）----
type PageParams = { locale: string };
type PageSearchParams = Record<string, string | string[]>;
type PageProps = {
    params?: Promise<PageParams>;
    searchParams?: Promise<PageSearchParams>;
};

// ---- APIレスポンス型 ----
type StatusResp = {
    planTier?: 'free' | 'pro' | 'pro_plus';
    proUntil?: string | null;

    freeRemaining?: number;
    remain?: number | null;

    subCap?: number | null;
    subUsed?: number | null;
    subRemaining?: number | null;

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
const toHighlightsArray = (raw: string): string[] =>
    raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 10);

// ---- ページ本体 ----
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

    // ---- ステータス再取得 ----
    const refreshStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/boost/status', { cache: 'no-store' });
            const j = (await res.json()) as StatusResp;
            setRemain(j.freeRemaining ?? j.remain ?? null);
            setTier(j.planTier ?? 'free');
            setProUntil(j.proUntil ?? null);
            setSubRemain(j.subRemaining ?? null);
            setSubCap(j.subCap ?? null);
            setTopupRemain(j.topupRemain ?? 0);
            setTopups(j.topups ?? []);
        } catch {
            /* noop */
        }
    }, []);

    useEffect(() => {
        void refreshStatus();
    }, [refreshStatus]);

    // ---- 実行ハンドラ ----
    const handleRun = useCallback(async () => {
        try {
            showToast('Running...');
            const res = await fetch('/api/boost', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    input,
                    highlights: toHighlightsArray(emphasis),
                    options: {
                        mode,
                        color,
                        ratio,
                        tone,
                        tags: dialogueTags,
                        styles: genStyles,
                    },
                }),
            });

            if (res.status === 402) {
                // 残数不足 → モーダルで誘導
                const j = await res.json().catch(() => ({}));
                if (typeof j.remain === 'number') setRemain(j.remain);
                setLimitOpen(true);
                setToastMsg(null);
                return;
            }

            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error ?? `Request failed: ${res.status}`);
            }

            const j = (await res.json()) as BoostResp;
            setOutput(j.text ?? j.output ?? '');
            if (typeof j.remain === 'number') setRemain(j.remain);
            // ステータスも更新（残数など）
            void refreshStatus();
            setToastMsg(null);
        } catch (e) {
            setToastMsg((e as Error).message || 'Failed');
        }
    }, [input, emphasis, mode, color, ratio, tone, dialogueTags, genStyles, refreshStatus]);

    return (
        <main className="max-w-3xl mx-auto p-4 space-y-6">
            {/* ステータス */}
            <p className="text-sm text-neutral-600">
                {t('status')}: {remain ?? '—'} {isPro ? '(Pro)' : '(Free)'}
            </p>

            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

            {/* 入力欄 */}
            <section className="space-y-3">
                <label className="block text-sm font-medium">Input</label>
                <textarea
                    className="w-full h-40 border rounded-lg p-3 focus:outline-none focus:ring"
                    placeholder="Write your brief here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium">Emphasis (comma-separated)</label>
                        <input
                            className="w-full border rounded-lg p-2"
                            placeholder="short, brand-safe, ..."
                            value={emphasis}
                            onChange={(e) => setEmphasis(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* 詳細設定 */}
            <section className="space-y-3">
                <AdvancedControlsV2
                    value={{ mode, color, ratio, tone, dialogueTags, genStyles }}
                    onChange={(next: Partial<ControlsValue>) => {
                        if (next.mode !== undefined) setMode(next.mode);
                        if (next.color !== undefined) setColor(next.color);
                        if (next.ratio !== undefined) setRatio(next.ratio);
                        if (next.tone !== undefined) setTone(next.tone);
                        if (next.dialogueTags !== undefined) setDialogueTags(next.dialogueTags);
                        if (next.genStyles !== undefined) setGenStyles(next.genStyles);
                    }}
                />
            </section>

            {/* 実行ボタン */}
            <ExecuteFab onRun={handleRun} isPro={isPro} canUseBoost={canUseBoost} />

            <PlanDialog open={planOpen} onClose={() => setPlanOpen(false)} />

            <CreditLimitModal
                open={limitOpen}
                onClose={() => setLimitOpen(false)}
                title="Credit limit reached"
                body="You've hit today’s free quota. Wait for reset or upgrade your plan."
            />

            <CompactPlans />

            {/* 出力表示 */}
            <section className="space-y-2">
                <h2 className="text-sm font-semibold text-neutral-700">Output</h2>
                <pre className="whitespace-pre-wrap border rounded-lg p-3 bg-neutral-50 min-h-24">
                    {output || '—'}
                </pre>
            </section>
        </main>
    );
}
