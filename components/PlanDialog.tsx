'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import PlanComparison from '@/components/PlanComparison';
import PlanMatrix from '@/components/PlanMatrix';

type Tier = 'free' | 'pro' | 'pro_plus';
type Fn = () => void | Promise<void>;

type Props = {
    open: boolean;
    onClose: () => void;
    tier?: Tier;
    onGoPro?: Fn;
    onGoProPlus?: Fn;
    onTopup300?: Fn;
    onTopup1000?: Fn;
    onOpenPortal?: Fn;
    title?: string;
};

export default function PlanDialog({
    open,
    onClose,
    tier = 'free',
    onGoPro,
    onGoProPlus,
    onTopup300,
    onTopup1000,
    onOpenPortal,
    title,
}: Props) {
    const tPC = useTranslations('planComparison');
    const tCommon = useTranslations('common');
    const tBilling = useTranslations('billing.checkout');
    const panelRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    // Escape で閉じる
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    useEffect(() => { setMounted(true); }, []);
    if (!open || !mounted) return null;

    // ここから body 直下に portal。z を十分に上げて背面の固定要素より前に。
    return createPortal(
        <div
            className="fixed inset-0 z-[9999] pointer-events-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-dialog-title"
        >
            {/* 背景オーバーレイ（クリックで閉じるなら onClick を付与） */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden={true}
            />

            {/* ダイアログ本体 */}
            <div className="absolute inset-0 flex items-start justify-center p-4 overflow-auto">
                <div
                    ref={panelRef}
                    className="mt-8 w-[94%] max-w-3xl rounded-2xl border bg-white shadow-2xl relative z-10"
                >
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h3 id="plan-dialog-title" className="text-base font-semibold">
                            {title ?? tPC('title')}
                        </h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded border px-2 py-1 text-sm"
                            aria-label={tCommon('close')}
                        >
                            {tCommon('close')}
                        </button>
                    </div>

                    <div className="max-h-[78vh] overflow-auto px-4 py-4">
                        <div className="mb-4">
                            <PlanComparison
                                tier={tier}
                                onGoPro={onGoPro}
                                onGoProPlus={onGoProPlus}
                                onOpenPortal={onOpenPortal}
                            />
                        </div>

                        <div className="mb-4">
                            <PlanMatrix />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {onTopup300 && (
                                <button
                                    type="button"
                                    onClick={() => onTopup300()}
                                    className="ml-auto rounded border px-3 py-1.5 text-sm"
                                >
                                    {tBilling('topup300')}
                                </button>
                            )}
                            {onTopup1000 && (
                                <button
                                    type="button"
                                    onClick={() => onTopup1000()}
                                    className="rounded border px-3 py-1.5 text-sm"
                                >
                                    {tBilling('topup1000')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
