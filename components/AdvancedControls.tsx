'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

// 髯懷姓・ｹ譎｢・ｽ螳壽｣碑ｬ費ｽｶ邵ｲ蝣､・ｹ・ｧ郢ｧ繝ｻ・ｽ・ｽ繝ｻ・ｿ驍ｵ・ｺ陋ｹ・ｻ繝ｻ迢暦ｽｹ・ｧ陋ｹ・ｻ遶包ｽｧ驍ｵ・ｺ繝ｻ・ｫ export
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

/** 髯昴・・ｸ螂・ｽｼ繝ｻ・ｸ・ｺ繝ｻ・ｪ驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・ｰ驛｢譏ｶ繝ｻ郢晢ｽ｣驛｢譏ｴ繝ｻ*/
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

/** 鬯ｩ蛹・ｽｽ・ｩ鬨ｾ蛹・ｽｽ・ｨ髣包ｽｳ繝ｻ・ｭ驍ｵ・ｺ繝ｻ・ｮ驛｢譎√・郢晢ｽ｣驛｢・ｧ繝ｻ・ｸ髯具ｽｻ隴会ｽｦ繝ｻ・ｼ闔・･・つ繝ｻ・､驕ｶ髮・ｽｮ螟ｲ・ｽ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ髯ｷ・ｷ鬮ｦ・ｪ郢晢ｽｻ髯ｷ・ｻ繝ｻ・ｼ驍ｵ・ｺ繝ｻ・ｳ髯ｷ繝ｻ・ｽ・ｺ驍ｵ・ｺ隲､諛翫・驍ｵ・ｺ繝ｻ・ｧ髯樊ｺｽ蛻､鬩ｪ・､驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ髮九ｑ・ｽ・｡驍ｵ・ｺ陷ｻ・ｻ繝ｻ・ｼ郢晢ｽｻ*/
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

// 髯ｷﾂ郢晢ｽｻ・主､雁ｱ舌・・､郢晢ｽｻ陋ｹ・ｻ邵ｺ蟶ｷ・ｹ譎｢・ｽ・ｩ驛｢譏ｴ繝ｻ邵ｺ蛛ｵ繝ｻ陝ｲ・ｨ郢晢ｽｻ髯懈圜・ｽ・ｺ髯橸ｽｳ陞｢・ｹ・つ遶擾ｽｬ繝ｻ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ驍ｵ・ｺ繝ｻ・ｯ i18n
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

    // 鬮ｯ・ｦ繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ鬨ｾ蛹・ｽｽ・ｨ驍ｵ・ｺ繝ｻ・ｫ髯区ｻゑｽｽ・､驕ｶ髮√・・主ｸｷ・ｹ譎冗函・取刮・ｸ・ｺ繝ｻ・ｸ髯樊ｺｽ蛻､鬩ｪ・､
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
            {/* 驛｢譎渉・･郢晢ｽ｣驛｢謨鳴郢晢ｽｻ陞｢・ｼ繝ｻ・ｷ繝ｻ・ｦ=驛｢・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎冗樟・弱・/ 髯ｷ・ｿ繝ｻ・ｳ=驛｢譎｢・ｽ・｢驛｢譎｢・ｽ・ｼ驛｢譎臥櫨郢晢ｽｻ髫ｴ蜴・ｽｽ・ｿ */}
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

            {/* 髯滓汚・ｽ・ｷ鬮ｫ・ｱ繝ｻ・ｿ鬮ｫ・ｱ隶抵ｽｫ陷夲ｽｱ髯ｷ闌ｨ・ｽ・･髯ｷ蟲ｨ繝ｻ*/}
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

            {/* 髯ｷ闌ｨ・ｽ・ｱ鬯ｨ・ｾ陞滂ｽｲ繝ｻ・ｼ陞滄｡疲ｨｪ髯溷私・ｽ・ｩ */}
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
                    {/* 髯昴・・ｽ・ｾ鬮ｫ・ｧ繝ｻ・ｱ郢晢ｽｻ陜蠕冢e */}
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

                    {/* 髯昴・・ｽ・ｾ鬮ｫ・ｧ繝ｻ・ｱ郢晢ｽｻ陞｢・ｹ邵ｺ・｡驛｢・ｧ繝ｻ・ｰ鬩玲慣・ｽ・､ */}
                    <div className="text-sm mb-2 text-neutral-600">{t('tags.label')}</div>
                    <div className="flex flex-wrap gap-2">
                        {DIALOGUE_TAGS.map(({ value, key }) => (
                            <Chip key={value} active={dialogueTags.includes(value)} onClick={() => onToggleDialogueTag(value)}>
                                #{t(`tags.${key}` as const)}
                            </Chip>
                        ))}
                    </div>

                    {/* 鬯ｩ蛹・ｽｽ・ｩ鬨ｾ蛹・ｽｽ・ｨ髣包ｽｳ繝ｻ・ｭ */}
                    <div className="mt-3 text-xs text-neutral-600">
                        <span className="mr-2">{t('common.applied')}:</span>
                        <AppliedRow items={appliedDialogueLabels} />
                    </div>
                </>
            ) : (
                <>
                    {/* 鬨ｾ蠅難ｽｻ阮吶・郢晢ｽｻ陞｢・ｽ繝ｻ・ｯ騾ｧ・ｮ驍擾ｽｫ */}
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

                    {/* 鬨ｾ蠅難ｽｻ阮吶・郢晢ｽｻ陞｢・ｹ邵ｺ蟶ｷ・ｹ・ｧ繝ｻ・ｿ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｫ */}
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

                    {/* 鬯ｩ蛹・ｽｽ・ｩ鬨ｾ蛹・ｽｽ・ｨ髣包ｽｳ繝ｻ・ｭ */}
                    <div className="mt-3 text-xs text-neutral-600">
                        <span className="mr-2">{t('common.applied')}:</span>
                        <AppliedRow items={appliedGenStyleLabels} />
                    </div>
                </>
            )}
        </div>
    );
}
