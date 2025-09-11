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

export interface AdvancedControlsProps {
    value: ControlsValue
    onChange: (next: Partial<ControlsValue>) => void
}

export default function AdvancedControls({ value, onChange }: AdvancedControlsProps) {
    const id = useId()

    const set = <K extends keyof ControlsValue>(key: K, v: ControlsValue[K]) =>
        onChange({ [key]: v } as Pick<ControlsValue, K>)

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
        </div>
    )
}
