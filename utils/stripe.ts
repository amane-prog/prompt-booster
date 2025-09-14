// utils/stripe.ts
export type Plan = 'pro' | 'pro_plus'
export type TopupKind = '300' | '1000'

type CheckoutResp = { url: string } | { error: string }

function goOrReturn(url: string): string | void {
    if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
        window.location.href = url
        return
    }
    return url
}

async function parseJsonSafely(res: Response): Promise<CheckoutResp | null> {
    try { return (await res.json()) as CheckoutResp }
    catch {
        try {
            const txt = await res.text()
            console.group('[billing] non-JSON response')
            console.log('status:', res.status)
            console.log('text:', txt.slice(0, 1000))
            console.groupEnd()
        } catch {/* ignore */ }
        return null
    }
}

async function createSessionJson(endpoint: string, body: unknown): Promise<string> {
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    const data = await parseJsonSafely(res)
    if (res.ok && data && 'url' in data && data.url) return data.url
    const err = data && 'error' in data ? data.error : `HTTP ${res.status}`
    throw new Error(err)
}

export async function startBilling(plan: Plan | null): Promise<string | void> {
    const payload = plan ? { plan } : {} // ← null時は空ボディでもOK（サーバ側で既定pro）
    const url = await createSessionJson('/api/billing/start', payload)
    return goOrReturn(url)
}

export async function startCheckout(plan: Plan): Promise<string | void> {
    const res = await fetch(`/api/stripe/checkout?plan=${plan}`, { method: 'POST' })
    const data = await parseJsonSafely(res)
    if (res.ok && data && 'url' in data && data.url) return goOrReturn(data.url)
    const err = data && 'error' in data ? data.error : `HTTP ${res.status}`
    throw new Error(err)
}

export async function handleTopup(kind: TopupKind): Promise<string | void> {
    const res = await fetch(`/api/stripe/checkout/topup?kind=${kind}`, { method: 'POST' })
    const data = await parseJsonSafely(res)
    if (res.ok && data && 'url' in data && data.url) return goOrReturn(data.url)
    const err = data && 'error' in data ? data.error : `HTTP ${res.status}`
    throw new Error(err)
}
