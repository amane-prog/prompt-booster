// app/[locale]/page.tsx
'use client';

type PageParams = { locale: string };
type PageSearchParams = Record<string, string | string[]>;

type PageProps = {
    params?: Promise<PageParams>;
    searchParams?: Promise<PageSearchParams>;
};

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
const toHighlightsArray = (raw: string): string[] =>
    raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 10);

// ---- ページ本体 ----
export default function HomePage(_props: PageProps) {
    const t = useTranslations('ui');
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
    const [remain, setRemain] = useState<number | null>(null);
    const [tier, setTier] = useState<'free' | 'pro' | 'pro_plus'>('free');
    const [proUntil, setProUntil] = useState<string | null>(null);

    const [subRemain, setSubRemain] = useState<number | null>(null);
    const [subCap, setSubCap] = useState<number | null>(null);

    const [topupRemain, setTopupRemain] = useState<number>(0);
    const [topups, setTopups] = useState<{ remain: number; expire_at: string }[]>([]);

    // トースト & モーダル
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const showToast = (msg: string) => setToastMsg(msg);

    const [limitOpen, setLimitOpen] = useState(false);
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

    // ---- Boost 実行 ----
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
            void refreshStatus();
            setToastMsg(null);
        } catch (e) {
            setToastMsg((e as Error).message || 'Failed');
        }
    }, [input, emphasis, mode, color, ratio, tone, dialogueTags, genStyles, refreshStatus]);

    // ---- Stripe: Portal / Topup ----
    const openPortal = useCallback(async () => {
        try {
            const r = await fetch('/api/stripe/portal', { method: 'POST' });
            const j = await r.json();
            if (r.ok && j.url) { window.location.href = j.url; return; }
            showToast(j.error ?? 'Failed to open portal');
        } catch (e) { showToast((e as Error).message); }
    }, []);

    const buyTopup300 = useCallback(async () => {
        try {
            const r = await fetch('/api/stripe/checkout/topup?kind=300', { method: 'POST' });
            const j = await r.json();
            if (r.ok && j.url) { window.location.href = j.url; return; }
            showToast(j.error ?? 'Topup 300 failed');
        } catch (e) { showToast((e as Error).message); }
    }, []);

    const buyTopup1000 = useCallback(async () => {
        try {
            const r = await fetch('/api/stripe/checkout/topup?kind=1000', { method: 'POST' });
            const j = await r.json();
            if (r.ok && j.url) { window.location.href = j.url; return; }
            showToast(j.error ?? 'Topup 1000 failed');
        } catch (e) { showToast((e as Error).message); }
    }, []);

    const goPro = useCallback(async () => { await openPortal(); }, [openPortal]);
    const goProPlus = useCallback(async () => { await openPortal(); }, [openPortal]);

    return (
        <main className="w-full px-4 md:px-6 py-6">
            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6 min-h-[calc(100vh-140px)]">

                {/* 左：プラン＋ステータス（中だけスクロール） */}
                <div className="md:col-span-3 flex flex-col min-h-0">
                    <section className="rounded-2xl border bg-white p-3 flex flex-col max-h-[76vh] min-h-0">
                        <div className="mb-2 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-sm font-medium">プラン</h3>
                            <button className="text-[12px] underline text-neutral-600" onClick={() => setPlanOpen(true)}>
                                詳細を見る
                            </button>
                        </div>

                        <div className="overflow-y-auto min-h-0 space-y-4">
                            <CompactPlans tier={tier} onGoPro={goPro} onGoProPlus={goProPlus} onOpenPortal={openPortal} />
                            <section className="rounded-2xl border bg-white p-3">
                                <h4 className="mb-1 text-sm font-medium">ステータス</h4>
                                <p className="text-sm text-neutral-700">
                                    {t('status')}: {remain ?? '—'} {isPro ? '(Pro)' : '(Free)'}
                                </p>
                                {typeof subRemain === 'number' && typeof subCap === 'number' && (
                                    <p className="mt-1 text-xs text-neutral-500">Subscription: {subRemain}/{subCap}</p>
                                )}
                            </section>
                        </div>
                    </section>
                </div>

                {/* 中央：Input（本文は伸縮、下にボタン固定） */}
                <section className="md:col-span-4 rounded-2xl border bg-white p-4 flex flex-col max-h-[76vh] min-h-0">
                    <label className="mb-2 block text-sm font-medium">Input</label>

                    <textarea
                        className="flex-1 w-full min-h-[180px] resize-y border rounded-lg p-3 focus:outline-none focus:ring"
                        placeholder="Write your brief here..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />

                    <div className="sticky bottom-0 pt-3 bg-white/90">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleRun}
                                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                                disabled={!canUseBoost}
                            >
                                実行
                            </button>
                        </div>
                    </div>
                </section>

                {/* 右：条件式（上見出し固定・中スクロール） */}
                <aside className="md:col-span-5 rounded-2xl border bg-white p-4 flex flex-col max-h-[76vh] min-h-0">
                    <h3 className="text-sm font-medium sticky top-0 bg-white z-10 pb-2">条件式</h3>

                    <div className="overflow-y-auto min-h-0 space-y-4">
                        {/* Emphasis */}
                        <div>
                            <label className="mb-1 block text-sm font-medium">Emphasis (comma-separated)</label>
                            <input
                                className="w-full border rounded-lg p-2"
                                placeholder="short, brand-safe, ..."
                                value={emphasis}
                                onChange={(e) => setEmphasis(e.target.value)}
                            />
                            <p className="mt-1 text-[11px] text-neutral-500">[must include] の角括弧でも抽出されます。</p>
                        </div>

                        {/* Tags / Styles はそのまま */}
                        {/* …既存の Tags / Styles / AdvancedControlsV2 をここに… */}
                        <AdvancedControlsV2
                            value={{ mode, color, ratio, tone, dialogueTags, genStyles }}
                            onChange={(next) => {
                                if (next.mode !== undefined) setMode(next.mode);
                                if (next.color !== undefined) setColor(next.color);
                                if (next.ratio !== undefined) setRatio(next.ratio);
                                if (next.tone !== undefined) setTone(next.tone);
                                if (next.dialogueTags !== undefined) setDialogueTags(next.dialogueTags);
                                if (next.genStyles !== undefined) setGenStyles(next.genStyles);
                            }}
                        />
                    </div>
                </aside>

                {/* 下段：Output（本文スクロール、操作は下固定） */}
                <section className="rounded-2xl border bg-white p-4 md:col-span-9 md:col-start-4 flex flex-col max-h-[70vh] min-h-[40vh]">
                    <h2 className="mb-2 text-sm font-semibold text-neutral-700">Output</h2>

                    <pre className="flex-1 overflow-y-auto whitespace-pre-wrap border rounded-lg p-3 bg-neutral-50">
                        {output || '—'}
                    </pre>

                    <div className="sticky bottom-0 bg-white/90 pt-2">
                        <div className="mt-2 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded border px-3 py-1.5 text-sm"
                                onClick={() => navigator.clipboard?.writeText(output || '')}
                                disabled={!output}
                            >
                                コピー
                            </button>
                            <button
                                type="button"
                                className="rounded border px-3 py-1.5 text-sm"
                                onClick={async () => {
                                    if (navigator.share && output) { try { await navigator.share({ text: output }); } catch { } }
                                    else { await navigator.clipboard?.writeText(output || '') }
                                }}
                                disabled={!output}
                            >
                                共有
                            </button>
                        </div>
                    </div>
                </section>
            </div>


            {/* モーダル */}
            <PlanDialog
                open={planOpen}
                onClose={() => setPlanOpen(false)}
                tier={tier}
                onGoPro={goPro}
                onGoProPlus={goProPlus}
                onTopup300={buyTopup300}
                onTopup1000={buyTopup1000}
                onOpenPortal={openPortal}
            />
            <CreditLimitModal
                open={limitOpen}
                onClose={() => setLimitOpen(false)}
                title="Credit limit reached"
                body="You've hit today’s free quota. Wait for reset or upgrade your plan."
            />
        </main>
    );

}
