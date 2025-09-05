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

type StatusResp = {
    planTier?: 'free' | 'pro' | 'pro_plus';
    proUntil?: string | null;

    freeRemaining?: number;    // Free の残回数
    remain?: number | null;    // 互換

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
        try {
            const r = await fetch('/api/boost/status', { cache: 'no-store' });
            if (!r.ok) return;
            const j = (await r.json()) as StatusResp;

            if (typeof j.freeRemaining === 'number') setRemain(j.freeRemaining);
            else if (typeof j.remain === 'number') setRemain(j.remain ?? null);
            else setRemain(null);

            if (j.planTier) setTier(j.planTier);
            setProUntil(j.proUntil ?? null);

            setSubRemain(typeof j.subRemaining === 'number' ? j.subRemaining : null);
            setSubCap(typeof j.subCap === 'number' ? j.subCap : null);

            if (typeof j.topupRemain === 'number') setTopupRemain(j.topupRemain);
            if (Array.isArray(j.topups)) setTopups(j.topups);
        } catch { /* noop */ }
    }, []);

    // 初期ロード
    useEffect(() => { refreshStatus(); }, [refreshStatus]);

    // Checkout（Free → Pro/Pro+）
    const startCheckout = useCallback(async (plan: 'pro' | 'pro_plus') => {
        try {
            const qs = new URLSearchParams({ plan }).toString();
            const r = await fetch(`/api/stripe/checkout?${qs}`, { method: 'POST' });
            const j = await r.json().catch(() => ({}));
            if (r.ok && j?.url) location.href = j.url;
            else showToast(j?.error ?? `Checkout failed (${r.status})`);
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'checkout error');
        }
    }, []);

    // Portal（プラン変更/解約）
    const openPortal = useCallback(async () => {
        try {
            const r = await fetch('/api/stripe/portal', { method: 'POST' });
            const j = await r.json().catch(() => ({}));
            if (r.ok && j?.url) location.href = j.url;
            else showToast(j?.error ?? `Open portal failed (${r.status})`);
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'portal error');
        }
    }, []);

    // 実行
    const onRun = useCallback(async () => {
        const payload = {
            input,
            highlights: toHighlightsArray(emphasis),
            options: { mode, color, tone, ratio, tags: dialogueTags, styles: genStyles }
        };
        const r = await fetch('/api/boost', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (r.ok) {
            const j = (await r.json()) as BoostResp;
            setOutput(j.text ?? j.output ?? '');
            if (typeof j.remain === 'number') setRemain(j.remain); // Free即時更新
            if (j.truncated) showToast(t('truncated'));
            await refreshStatus(); // Pro/Top-up を含む最新ステータスへ
            return;
        }

        // クレジット枯渇
        if (r.status === 402 || r.status === 429) {
            const j = await r.json().catch(() => ({} as any));
            const sec = typeof j?.resetInSec === 'number' ? j.resetInSec : null;
            setLimitResetSec(sec);
            setLimitOpen(true);
            setRemain(0);
            return;
        }

        const j = await r.json().catch(() => ({ error: undefined } as { error?: string }));
        showToast(j?.error ?? `Error (${r.status})`);
    }, [t, input, emphasis, mode, color, tone, ratio, dialogueTags, genStyles, refreshStatus]);

    // コピー
    const onCopyOutput = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(output ?? '');
            showToast(toastT('copied'));
        } catch {
            showToast(toastT('error'));
        }
    }, [output, toastT]);

    // 共有
    const onShareOutput = useCallback(async () => {
        const text = output ?? '';
        const title = 'Prompt Booster';
        const url = typeof window !== 'undefined' ? window.location.href : undefined;
        try {
            if ((navigator as any).share) {
                await (navigator as any).share({ title, text, url });
            } else {
                await navigator.clipboard.writeText(text);
                showToast(toastT('copied'));
            }
        } catch {
            showToast(t('error')); // フォールバック
        }
    }, [output, t, toastT]);

    // Free の JST 日次リセット
    const [resetSec, setResetSec] = useState<number>(0);
    useEffect(() => {
        if (tier !== 'free') return;
        function calc(): number {
            const now = new Date();
            const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
            const next = new Date(
                jstNow.getFullYear(),
                jstNow.getMonth(),
                jstNow.getDate() + 1,
                0, 0, 0, 0
            );
            return Math.max(0, Math.floor((next.getTime() - jstNow.getTime()) / 1000));
        }
        setResetSec(calc());
        const id = window.setInterval(() => setResetSec(calc()), 1000);
        return () => window.clearInterval(id);
    }, [tier]);

    // Top-up 購入
    const buyTopup = useCallback(async (n: '300' | '1000') => {
        try {
            setBuying(n);
            await handleTopup(n);
            await refreshStatus();
        } catch (e) {
            showToast(String((e as Error).message ?? e));
        } finally {
            setBuying(null);
        }
    }, [refreshStatus]);

    const planLabel =
        tier === 'pro_plus'
            ? headerT('status.pro_plus')
            : tier === 'pro'
                ? headerT('status.pro')
                : headerT('status.free');

    const nearestExpire =
        topups.length > 0 ? f.dateTime(new Date(topups[0].expire_at), { dateStyle: 'medium' }) : null;

    return (
        <div className="grid grid-cols-12 gap-4">
            {/* 左サイド：圧縮プラン＋ステータス */}
            <aside className="col-span-12 md:col-span-4 lg:col-span-3 xl:col-span-3">
                <div className="sticky top-16">
                    <div className="flex max-h-[calc(100vh-5rem)] flex-col gap-4 overflow-auto pr-1">
                        <CompactPlans
                            tier={tier}
                            onOpenDetails={() => setPlanOpen(true)}
                            onGoPro={() => (tier === 'free' ? startCheckout('pro') : openPortal())}
                            onGoProPlus={() => (tier === 'free' ? startCheckout('pro_plus') : openPortal())}
                            onOpenPortal={openPortal}
                        />

                        <section className="rounded-2xl border bg-white p-3">
                            <div className="mb-1 text-sm font-medium">{t('status')}</div>
                            <div className="space-y-2 text-sm">
                                <div>
                                    {t('plan')}:{" "}
                                    <span className="rounded border bg-white px-2 py-0.5">{planLabel}</span>
                                </div>

                                {/* Free → 日次カウント / Pro → サブスク残数 */}
                                {tier === 'free' ? (
                                    <div>
                                        {t('remainingRequests')}:{" "}
                                        <span className="tabular-nums font-semibold">{remain ?? t('empty')}</span>
                                        <span className="text-neutral-400"> / {t('freeDailyCap')}</span>
                                        <div className="mt-1 text-[11px] text-neutral-500">
                                            {t('jstResetCountdown', { time: fmtHMS(resetSec) })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-neutral-700">
                                        {t('subscriptionRemaining')}:{" "}
                                        <span className="tabular-nums font-semibold">{subRemain ?? t('empty')}</span>
                                        {typeof subCap === 'number' && (
                                            <span className="ml-1 text-[11px] text-neutral-500">/ {subCap}</span>
                                        )}
                                        <span className="ml-2 text-[11px] text-neutral-500">
                                            {t('resetsOn', {
                                                date: proUntil
                                                    ? f.dateTime(new Date(proUntil), { dateStyle: 'medium' })
                                                    : t('empty'),
                                            })}
                                        </span>
                                    </div>
                                )}

                                {/* Top-up */}
                                <div className={topupRemain > 0 ? 'text-blue-700' : 'text-neutral-600'}>
                                    {t('topupRemaining')}:{" "}
                                    <span className="tabular-nums font-semibold">{topupRemain}</span>
                                    {nearestExpire && (
                                        <span className="ml-1 text-[11px] text-neutral-500">
                                            {t('earliestExpiry', { date: nearestExpire })}
                                        </span>
                                    )}
                                </div>

                                {/* Top-up 横並び（sm以上2列） */}
                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <button
                                        onClick={() => buyTopup('300')}
                                        disabled={!!buying}
                                        aria-busy={buying === '300'}
                                        className="w-full rounded bg-blue-600 px-3 py-1.5 text-xs text-white disabled:opacity-60"
                                    >
                                        {buying === '300' ? t('processing') : t('buyTopupN', { count: 300, price: 3 })}
                                    </button>
                                    <button
                                        onClick={() => buyTopup('1000')}
                                        disabled={!!buying}
                                        aria-busy={buying === '1000'}
                                        className="w-full rounded bg-blue-600 px-3 py-1.5 text-xs text-white disabled:opacity-60"
                                    >
                                        {buying === '1000' ? t('processing') : t('buyTopupN', { count: 1000, price: 5 })}
                                    </button>
                                </div>

                                <div className="text-right">
                                    <button
                                        onClick={() => setPlanOpen(true)}
                                        className="text-[12px] underline text-neutral-600 hover:text-neutral-900"
                                    >
                                        {t('seePlans')}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </aside>

            {/* メイン：入力/詳細設定/出力 */}
            <section className="col-span-12 md:col-span-8 lg:col-span-9 xl:col-span-9">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* 入力 */}
                    <div className="rounded-2xl border bg-white p-4">
                        <h2 className="mb-2 font-semibold">{t('input')}</h2>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="h-[38vh] w-full resize-vertical rounded border p-3"
                            placeholder={t('inputPlaceholder')}
                            aria-label={t('input')}
                        />
                        <p className="mt-2 text-xs text-neutral-500">{t('tipBracket')}</p>
                        <p className="mt-1 text-[11px] text-neutral-500">
                            {t('maxCharsPerRequest', { n: tier === 'pro_plus' ? 2000 : 500 })}
                        </p>

                        <div className="mt-3 flex items-center">
                            <div className="ml-auto">
                                <ExecuteFab
                                    onRun={onRun}
                                    isPro={isPro}
                                    canUseBoost={canUseBoost}
                                    placement="inline"
                                    label={t('generate')}
                                    className="px-4 py-2"
                                    disabled={!input.trim()}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 詳細設定 */}
                    <AdvancedControls
                        mode={mode}
                        onModeChange={setMode}
                        emphasis={emphasis}
                        onEmphasisChange={setEmphasis}
                        color={color}
                        onColorChange={setColor}
                        tone={tone}
                        onToneChange={setTone}
                        dialogueTags={dialogueTags}
                        onToggleDialogueTag={(tag: string) =>
                            setDialogueTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]))
                        }
                        ratio={ratio}
                        onRatioChange={setRatio}
                        genStyles={genStyles}
                        onToggleGenStyle={(s: string) =>
                            setGenStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
                        }
                    />

                    {/* 出力 */}
                    <div className="rounded-2xl border bg-white p-4 md:col-span-2">
                        <h2 className="mb-2 font-semibold">{t('output')}</h2>
                        <div className="prose prose-sm max-w-none h-[38vh] whitespace-pre-wrap overflow-auto rounded border bg-neutral-50 p-3">
                            {output || t('empty')}
                        </div>

                        <div className="mt-2 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={onCopyOutput}
                                disabled={!output}
                                className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
                            >
                                {t('copy')}
                            </button>
                            <button
                                type="button"
                                onClick={onShareOutput}
                                disabled={!output}
                                className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
                            >
                                {t('share')}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

            {/* クレジット不足モーダル */}
            {limitOpen && (
                <CreditLimitModal
                    open={limitOpen}
                    onClose={() => setLimitOpen(false)}
                    title={creditT('busyTitle')}
                    body={tier === 'free' ? creditT('freeModalBody') : creditT('proModalBody')}
                    resetInSec={limitResetSec}
                    onSeePlans={() => {
                        setLimitOpen(false);
                        setPlanOpen(true);
                    }}
                    onTopup={() => {
                        setLimitOpen(false);
                        buyTopup('300');
                    }}
                />
            )}

            {/* プラン詳細モーダル */}
            <PlanDialog
                open={planOpen}
                onClose={() => setPlanOpen(false)}
                tier={tier}
                onGoPro={() => { setPlanOpen(false); startCheckout('pro'); }}
                onGoProPlus={() => { setPlanOpen(false); startCheckout('pro_plus'); }}
                onTopup300={() => { setPlanOpen(false); buyTopup('300'); }}
                onTopup1000={() => { setPlanOpen(false); buyTopup('1000'); }}
                onOpenPortal={() => { setPlanOpen(false); openPortal(); }}
            />
        </div>
    );
}
