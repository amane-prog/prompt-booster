// utils/stripe.ts

export type Plan = 'pro' | 'pro_plus'
export type TopupKind = '300' | '1000'

type CheckoutResp =
    | { url: string }
    | { error: string }

/** ブラウザならそのまま遷移。SSR/Node環境ならURLを返す */
function goOrReturn(url: string): string | void {
    if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
        window.location.href = url
        return
    }
    return url
}

/** 共通: fetch -> JSON -> URL or throw */
async function createSession(endpoint: string): Promise<string> {
    const res = await fetch(endpoint, { method: 'POST' })
    const data = (await res.json()) as CheckoutResp
    if ('url' in data && data.url) return data.url
    throw new Error(('error' in data && data.error) ? data.error : 'Checkout URL error')
}

/** サブスク用チェックアウト（Pro / Pro+） */
export async function startCheckout(plan: Plan): Promise<string | void> {
    const url = await createSession(`/api/stripe/checkout?plan=${plan}`)
    return goOrReturn(url)
}

/** Top-up用チェックアウト（+300 / +1000） */
export async function handleTopup(kind: TopupKind): Promise<string | void> {
    const url = await createSession(`/api/stripe/checkout/topup?kind=${kind}`)
    return goOrReturn(url)
}
