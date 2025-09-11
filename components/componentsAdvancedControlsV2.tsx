// components/AdvancedControlsV2.tsx
'use client'

import { useId } from 'react'

export type Mode = 'dialogue' | 'rewrite' | 'summary' | 'chat' | 'auto'
export type ColorTone = 'auto' | 'warm' | 'cool' | 'mono'
export type Ratio = 'auto' | 'short' | 'medium' | 'long'
export type DialogueTone = 'auto' | 'friendly' | 'formal' | 'casual'

export type ControlsValue = {
    mode: Mode
    color: ColorTone
    ratio: Ratio
    tone: DialogueTone
    dialogueTags: string[]
    genStyles: string[]
}

export type Props = {
    value: ControlsValue
    onChange: (next: Partial<ControlsValue>) => void
}

// 署名確認用（デバッグ用に import してもOK）
export const __ADVANCED_SIGNATURE__ = 'AdvancedControlsV2@value+onChange'

export default function AdvancedControlsV2({ value, onChange }: Props) {
    const id = useId()
    const set = <K extends keyof ControlsValue>(k: K, v: ControlsValue[K]) =>
        onChange({ [k]: v } as Pick<ControlsValue, K>)

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <label htmlFor={`${id}-mode`} className="text-sm">Mode</label>
                <select
                    id={`${id}-mode`}
                    className="border rounded px-2 py-1"
                    value={value.mode}
                    onChange={(e) => set('mode', e.target.value as Mode)}
                >
                    <option value="dialogue">dialogue</option>
                    <option value="rewrite">rewrite</option>
                    <option value="summary">summary</option>
                    <option value="chat">chat</option>
                    <option value="auto">auto</option>
                </select>
            </div>

            {/* 他の項目（color/ratio/tone/dialogueTags/genStyles）は必要になったらUI追加して set(...) を呼ぶ */}
        </div>
    )
}
