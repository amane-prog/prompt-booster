'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

// 型を外でも使えるように export
export type Mode = 'dialogue' | 'generation';
export type ColorTone = 'auto' | 'bright' | 'dark' | 'pastel' | 'mono';
export type Ratio = 'auto' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type DialogueTone =
    | 'auto'
    | 'friendly'
    | 'formal'
    | 'concise'
    | 'enthusiastic'
    | 'neutral'
    | 'empathetic';

type Props = {
    mode: Mode;
    onModeChange: (m: Mode) => void;

    emphasis: string;
    onEmphasisChange: (s: string) => void;

    color: ColorTone;
    onColorChange: (c: ColorTone) => void;

    tone: DialogueTone;
    onToneChange: (t: DialogueTone) => void;

    dialogueTags: string[];
    onToggleDialogueTag: (tag: string) => void;

    ratio: Ratio;
    onRatioChange: (r: Ratio) => void;

    genStyles: string[];
    onToggleGenStyle: (style: string) => void;

    className?: string;
};

/** 小さなタグチップ */
function Chip({
    active,
    children,
    onClick
}: {
    active?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'rounded-full border px-2 py-1 text-xs',
                active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-neutral-50'
            ].join(' ')}
        >
            {children}
        </button>
    );
}

/** 適用中のバッジ列（値→表示名は呼び出し側で変換して渡す） */
function AppliedRow({ items }: { items: string[] }) {
    const t = useTranslations('advanced.common');
    return (
        <div className="mt-2 flex flex-wrap gap-2">
            {items.length > 0 ? (
                items.map((s) => (
                    <span
                        key={s}
                        className="rounded-full border px-2 py-0.5 text-[11px] bg-neutral-50 text-neutral-700"
                    >
                        #{s}
                    </span>
                ))
            ) : (
                <span className="text-[11px] text-neutral-400">{t('none')}</span>
            )}
        </div>
    );
}

// 内部値（スラッグ）は固定、表示は i18n
const DIALOGUE_TAGS = [
    { value: 'reverse', key: 'reverse' },
    { value: 'substitute', key: 'substitute' },
    { value: 'reorder', key: 'reorder' },
    { value: 'remove', key: 'remove' },
    { value: 'merge', key: 'merge' },
    { value: 'expand', key: 'expand' },
    { value: 'condense', key: 'condense' },
    { value: 'fix', key: 'fix' },
    { value: 'adapt', key: 'adapt' }
] as const;

const GEN_STYLES = [
    'photorealistic',
    'anime',
    'watercolor',
    'flat',
    'minimal',
    'cyberpunk',
    'isometric',
    'line-art'
] as const;

export default function AdvancedControls({
    mode,
    onModeChange,
    emphasis,
    onEmphasisChange,
    color,
    onColorChange,
    tone,
    onToneChange,
    dialogueTags,
    onToggleDialogueTag,
    ratio,
    onRatioChange,
    genStyles,
    onToggleGenStyle,
    className
}: Props) {
    const t = useTranslations('advanced');

    const colorOptions = useMemo(
        () =>
        ([
            { value: 'auto', label: t('color.options.auto') },
            { value: 'bright', label: t('color.options.bright') },
            { value: 'dark', label: t('color.options.dark') },
            { value: 'pastel', label: t('color.options.pastel') },
            { value: 'mono', label: t('color.options.mono') }
        ] as const),
        [t]
    );

    const ratioOptions = useMemo(
        () =>
        ([
            { value: 'auto', label: t('ratio.options.auto') },
            { value: '1:1', label: '1:1' },
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '4:3', label: '4:3' },
            { value: '3:4', label: '3:4' }
        ] as const),
        [t]
    );

    const toneOptions = useMemo(
        () =>
        ([
            { value: 'auto', label: t('tone.options.auto') },
            { value: 'friendly', label: t('tone.options.friendly') },
            { value: 'formal', label: t('tone.options.formal') },
            { value: 'concise', label: t('tone.options.concise') },
            { value: 'enthusiastic', label: t('tone.options.enthusiastic') },
            { value: 'neutral', label: t('tone.options.neutral') },
            { value: 'empathetic', label: t('tone.options.empathetic') }
        ] as const),
        [t]
    );

    // 表示用に値→ラベルへ変換
    const appliedDialogueLabels = useMemo(
        () =>
            dialogueTags
                .map((v) => t(`tags.${v}` as any))
                .filter(Boolean),
        [dialogueTags, t]
    );

    const appliedGenStyleLabels = useMemo(
        () =>
            genStyles
                .map((s) => t(`style.tags.${s}` as any)) // advanced.style.tags.*
                .filter(Boolean),
        [genStyles, t]
    );

    return (
        <div className={['rounded-2xl border bg-white p-4', className ?? ''].join(' ')}>
            {/* ヘッダ：左=タイトル / 右=モード切替 */}
            <div className="mb-2 flex items-center">
                <h2 className="font-semibold">{t('emphasis.title')}</h2>
                <div className="ml-auto inline-flex rounded-full bg-neutral-100 p-1" role="tablist" aria-label={t('mode.label')}>
                    <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded-full ${mode === 'dialogue' ? 'bg-white shadow' : ''}`}
                        onClick={() => onModeChange('dialogue')}
                        aria-pressed={mode === 'dialogue'}
                    >
                        {t('mode.dialogue')}
                    </button>
                </div>
                <div className="inline-flex -ml-1 rounded-full bg-neutral-100 p-1">
                    <button
                        type="button"
                        className={`px-3 py-1 text-xs rounded-full ${mode === 'generation' ? 'bg-white shadow' : ''}`}
                        onClick={() => onModeChange('generation')}
                        aria-pressed={mode === 'generation'}
                    >
                        {t('mode.generation')}
                    </button>
                </div>
            </div>

            {/* 強調語句入力 */}
            <input
                value={emphasis}
                onChange={(e) => onEmphasisChange(e.target.value)}
                type="text"
                className="w-full rounded border p-2"
                placeholder={t('emphasis.placeholder')}
                aria-label={t('emphasis.aria')}
            />
            <p className="mt-2 text-xs text-neutral-500">{t('emphasis.help')}</p>

            <hr className="my-3 border-neutral-200" />

            {/* 共通：色彩 */}
            <div className="mb-3">
                <label className="block text-sm mb-1">{t('color.label')}</label>
                <select
                    aria-label={t('color.label')}
                    className="w-full rounded border p-2 text-sm"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value as ColorTone)}
                >
                    {colorOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>

            {mode === 'dialogue' ? (
                <>
                    {/* 対話：Tone */}
                    <div className="mb-3">
                        <label className="block text-sm mb-1">{t('tone.label')}</label>
                        <select
                            aria-label={t('tone.label')}
                            className="w-full rounded border p-2 text-sm"
                            value={tone}
                            onChange={(e) => onToneChange(e.target.value as DialogueTone)}
                        >
                            {toneOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 対話：タグ群 */}
                    <div className="text-sm mb-2 text-neutral-600">{t('tags.label')}</div>
                    <div className="flex flex-wrap gap-2">
                        {DIALOGUE_TAGS.map(({ value, key }) => (
                            <Chip key={value} active={dialogueTags.includes(value)} onClick={() => onToggleDialogueTag(value)}>
                                #{t(`tags.${key}` as const)}
                            </Chip>
                        ))}
                    </div>

                    {/* 適用中 */}
                    <div className="mt-3 text-xs text-neutral-600">
                        <span className="mr-2">{t('common.applied')}:</span>
                        <AppliedRow items={appliedDialogueLabels} />
                    </div>
                </>
            ) : (
                <>
                    {/* 生成：比率 */}
                    <div className="mb-3">
                        <label className="block text-sm mb-1">{t('ratio.label')}</label>
                        <select
                            aria-label={t('ratio.label')}
                            className="w-full rounded border p-2 text-sm"
                            value={ratio}
                            onChange={(e) => onRatioChange(e.target.value as Ratio)}
                        >
                            {ratioOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 生成：スタイル */}
                    <div className="mb-1">
                        <div className="block text-sm mb-1">{t('style.label')}</div>
                        <div className="flex flex-wrap gap-2">
                            {GEN_STYLES.map((s) => (
                                <Chip key={s} active={genStyles.includes(s)} onClick={() => onToggleGenStyle(s)}>
                                    #{t(`style.tags.${s}` as const)}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    {/* 適用中 */}
                    <div className="mt-3 text-xs text-neutral-600">
                        <span className="mr-2">{t('common.applied')}:</span>
                        <AppliedRow items={appliedGenStyleLabels} />
                    </div>
                </>
            )}
        </div>
    );
}
