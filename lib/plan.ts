// lib/plan.ts
export type PlanTier = 'free' | 'pro' | 'pro_plus'

export const Plan = {
    limits(tier: PlanTier) {
        switch (tier) {
            case 'pro_plus': return { monthly: 1000, maxChars: 2000, banner: false, adWatch: false }
            case 'pro': return { monthly: 1000, maxChars: 500, banner: false, adWatch: false }
            default: return { monthly: 0, maxChars: 500, banner: true, adWatch: true }
        }
    },
    isProLike(tier: PlanTier) { return tier === 'pro' || tier === 'pro_plus' },
}

/** pro_until が未来なら Pro 扱い */
export function isPro(proUntil: string | Date | null | undefined): boolean {
    if (!proUntil) return false
    const d = typeof proUntil === 'string' ? new Date(proUntil) : proUntil
    return Number.isFinite(d.getTime()) && d.getTime() > Date.now()
}

/** JST の yyyy-mm-dd */
export const jstDayKey = (d = new Date()): string => {
    const utc = d.getTime() + d.getTimezoneOffset() * 60000
    const jst = new Date(utc + 9 * 3600000)
    const y = jst.getFullYear()
    const m = String(jst.getMonth() + 1).padStart(2, '0')
    const day = String(jst.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}
