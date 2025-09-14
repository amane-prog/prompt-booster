// utils/stripe.ts
export type Plan = 'pro' | 'pro_plus'
export type TopupKind = '300' | '1000'

type CheckoutResp = { url: string } | { error: string }

/** ブラウザならそのまま遷移。SSR/Node環境ならURLを返す */
function goOrReturn(url: string): string | void {
    if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
        window.location.href = url
        return
    }
    return url
}

/** 共通: fetch -> JSON -> URL or throw (GET/POST bodyなし用) */
async function createSession(endpoint: string): Promise<string> {
    const res = await fetch(endpoint, { method: 'POST' })
    const data = (await res.json()) as CheckoutResp
    if ('url' in data && data.url) return data.url
    throw new Error(('error' in data && data.error) ? data.error : 'Checkout URL error')
}

/** 共通: JSONボディPOST版 */
async function createSessionJson(endpoint: string, body: unknown): Promise<string> {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    const data = (await res.json()) as CheckoutResp
    if ('url' in data && data.url) return data.url
    throw new Error(('error' in data && data.error) ? data.error : 'Checkout URL error')
}

/** ✅ 統合API: free→Checkout, active→Portal（サーバ側で自動分岐） */
export async function startBilling(plan: Plan | null): Promise<string | void> {
    // plan=null のときはサーバ側で「activeならPortal」へ送る用途（Manageボタン等）
    const payload = plan ? { plan } : { plan: 'pro' as Plan }
    const url = await createSessionJson('/api/billing/start', payload)
    return goOrReturn(url)
}

/** 既存: サブスク用チェックアウト（直接Checkoutに行きたいときだけ使用） */
export async function startCheckout(plan: Plan): Promise<string | void> {
    const url = await createSession(`/api/stripe/checkout?plan=${plan}`)
    return goOrReturn(url)
}

/** 既存: Top-up用チェックアウト（+300 / +1000） */
export async function handleTopup(kind: TopupKind): Promise<string | void> {
    const url = await createSession(`/api/stripe/checkout/topup?kind=${kind}`)
    return goOrReturn(url)
}
