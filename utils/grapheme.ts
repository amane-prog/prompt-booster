// utils/grapheme.ts
let seg: Intl.Segmenter | null = null
function getSeg(): Intl.Segmenter | null {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        if (!seg) seg = new Intl.Segmenter('ja', { granularity: 'grapheme' })
        return seg
    }
    return null
}

export function countGraphemes(s: string): number {
    const sgm = getSeg()
    if (sgm) {
        let n = 0
        for (const _ of sgm.segment(s)) n++
        return n
    }
    // Fallback: code points
    return Array.from(s).length
}

export function sliceGraphemes(s: string, max: number): string {
    const sgm = getSeg()
    if (sgm) {
        let out = ''
        let n = 0
        for (const part of sgm.segment(s)) {
            if (n >= max) break
            out += part.segment
            n++
        }
        return out
    }
    // Fallback: code points
    return Array.from(s).slice(0, max).join('')
}
