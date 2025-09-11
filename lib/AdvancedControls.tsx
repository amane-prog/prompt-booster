// components/AdvancedControls.tsx
'use client'

import { useId } from 'react'

export type Mode = 'dialogue' | 'rewrite' | 'summary' | 'chat' | 'auto'
export type ColorTone = 'auto' | 'warm' | 'cool' | 'mono'
export type Ratio = 'auto' | 'short' | 'medium' | 'long'
export type DialogueTone = 'auto' | 'friendly' | 'formal' | 'casual'

// 親と共有する“状態”の型（named export）
export type ControlsValue = {
    mode: Mode
    color: ColorTone
    ratio: Ratio
    tone: DialogueTone
    dialogueTags: string[]
    genStyles: string[]
}

// Props（value + onChange）のみ。**これがページ側の期待と一致**
export type Props = {
    value: ControlsValue
    onChange: (next: Partial<ControlsValue>) => void
}

export default function AdvancedControls({ value, onChange }: Props) {
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

            {/* color / ratio / tone / dialogueTags / genStyles も同様に set(...) を呼ぶ */}
        </div>
    )
}
