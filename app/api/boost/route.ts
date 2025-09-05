// app/api/boost/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isPro as isProDate } from '@/lib/plan'
import { Redis } from '@upstash/redis'
import OpenAI from 'openai'

export const runtime = 'nodejs'

// ----- env helpers -----
function unquote(s: string | undefined | null) {
    if (!s) return ''
    return s.replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '')
}

const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 3)
const UPSTASH_URL = unquote(process.env.UPSTASH_REDIS_REST_URL)
const UPSTASH_TOKEN = unquote(process.env.UPSTASH_REDIS_REST_TOKEN)
const OPENAI_KEY = unquote(process.env.OPENAI_API_KEY)

function getRedis(): Redis | null {
    if (UPSTASH_URL && UPSTASH_TOKEN && /^https:\/\//.test(UPSTASH_URL)) {
        return new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })
    }
    return null
}

const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null
const MODEL = 'gpt-4o-mini'

// ----- utilities -----
function jstDateString(): string {
    const now = new Date()
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    return jst.toISOString().slice(0, 10)
}
function secondsUntilJstMidnight(): number {
    const now = new Date()
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const next = new Date(jst.getFullYear(), jst.getMonth(), jst.getDate() + 1, 0, 0, 0, 0)
    return Math.max(1, Math.floor((next.getTime() - jst.getTime()) / 1000))
}
function secondsUntil(iso: string | null): number {
    if (!iso) return 31 * 24 * 60 * 60
    const end = new Date(iso).getTime()
    const now = Date.now()
    return Math.max(60, Math.floor((end - now) / 1000))
}

type BoostBody = {
    input?: string
    prompt?: string
    text?: string
    highlights?: string[] | string | null
    options?: {
        mode?: 'dialogue' | 'generation'
        color?: 'auto' | 'bright' | 'dark' | 'pastel' | 'mono'
        ratio?: 'auto' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
        tone?: 'auto' | 'friendly' | 'formal' | 'concise' | 'enthusiastic' | 'neutral' | 'empathetic'
        tags?: string[]
        styles?: string[]
    }
}

type PlanTier = 'free' | 'pro' | 'pro_plus'

type UserBillingRow = {
    pro_until: string | null
    plan_tier: PlanTier | null
}

type UserTopupRow = {
    id: string
    remain: number | null
    amount: number | null
    expire_at: string
}
function parseBody(jsonUnknown: unknown): BoostBody {
    if (typeof jsonUnknown !== 'object' || jsonUnknown === null) return {}
    const rec = jsonUnknown as Record<string, unknown>
    return {
        input:
            typeof rec.input === 'string'
                ? rec.input
                : typeof rec.prompt === 'string'
                    ? rec.prompt
                    : typeof rec.text === 'string'
                        ? rec.text
                        : undefined,
        highlights:
            Array.isArray(rec.highlights) || typeof rec.highlights === 'string'
                ? (rec.highlights as string[] | string)
                : null,
        options:
            typeof rec.options === 'object' && rec.options !== null
                ? (rec.options as BoostBody['options'])
                : undefined,
    }
}

function extractBracketHighlights(raw: string): { clean: string; highlights: string[] } {
    const found: string[] = []
    const clean = raw.replace(/\[([^\]\r\n]{1,60})\]/g, (_m, g1: string) => {
        const trimmed = g1.trim()
        if (trimmed.length > 0) found.push(trimmed)
        return trimmed
    })
    return { clean, highlights: found }
}

function normalizeHighlights(h: string[] | string | null | undefined): string[] {
    if (!h) return []
    const arr = Array.isArray(h) ? h : h.split(',')
    const cleaned = arr.map(s => s.trim()).filter(s => s.length > 0).slice(0, 50)
    const seen = new Set<string>()
    const out: string[] = []
    for (const s of cleaned) {
        const k = s.toLowerCase()
        if (!seen.has(k)) {
            seen.add(k)
            out.push(s)
        }
        if (out.length >= 10) break
    }
    return out
}

function enforceCharLimit(text: string, tier: 'free' | 'pro' | 'pro_plus') {
    const limit = tier === 'pro_plus' ? 2000 : 500
    if (text.length <= limit) return { text, truncated: false }
    return { text: text.slice(0, limit), truncated: true }
}

async function callLLM(userBrief: string, highlights: string[], options?: BoostBody['options']): Promise<string> {
    if (!openai) return 'LLM disabled (no API key)'
    const system = [
        'You are Prompt Booster.',
        'Transform the user brief into a sharp, copy-pastable prompt plan.',
        'Always return valid markdown with these sections:',
        '- Goal',
        '- Context (brief, if useful)',
        '- Must-include (verbatim requirements)',
        '- Constraints',
        '- Style & Tone',
        '- Output format',
        '- Draft prompt (single block, ready to paste)',
        '',
        'Rules:',
        '- If `Must-include` items are provided, reflect them verbatim in the Draft prompt.',
        '- Keep it concise and actionable.',
    ].join('\n')

    const emphasis =
        highlights.length > 0
            ? `\n\nEMPHASIS (must include):\n- ${highlights.join('\n- ')}\n`
            : ''

    const extra = options
        ? [
            '\nSETTINGS:',
            options.mode ? `- mode: ${options.mode}` : '',
            options.color ? `- color_tone: ${options.color}` : '',
            options.tone ? `- tone: ${options.tone}` : '',
            options.ratio ? `- ratio: ${options.ratio}` : '',
            options.tags?.length ? `- dialogue_tags: ${options.tags.join(', ')}` : '',
            options.styles?.length ? `- gen_styles: ${options.styles.join(', ')}` : '',
        ]
            .filter(Boolean)
            .join('\n')
        : ''

    const resp = await openai.chat.completions.create({
        model: MODEL,
        messages: [
            { role: 'system', content: system },
            { role: 'user', content: `USER BRIEF:\n${userBrief.slice(0, 4000)}${emphasis}${extra}` },
        ],
        temperature: 0.3,
    })
    return resp.choices[0]?.message?.content ?? ''
}

// ----- handler -----
export async function POST(req: Request): Promise<Response> {
    try {
        const redis = getRedis()
        const url = new URL(req.url)
        const isAd = url.searchParams.get('ad')
        const sb = await supabaseServer()

        // auth
        let userId: string | null = null
        try {
            const { data: { user } } = await sb.auth.getUser()
            userId = user?.id ?? null
        } catch {
            userId = null
        }

        // plan
        let planTier: PlanTier = 'free'
        let proUntil: string | null = null

        if (userId) {
            const { data: billing } = await sb
                .from('user_billing')
                .select('pro_until, plan_tier')
                .eq('user_id', userId)
                .maybeSingle<UserBillingRow>()

            const active = isProDate(billing?.pro_until ?? null)
            if (active) {
                planTier = billing?.plan_tier === 'pro_plus' ? 'pro_plus' : 'pro'
                proUntil = billing?.pro_until ?? null
            }
        }

        // ad bonus (+1 free for today)
        if (isAd) {
            if (planTier !== 'free') {
                return NextResponse.json({ ok: true, remain: null, tier: planTier })
            }
            if (userId && redis) {
                const today = jstDateString()
                const bonusKey = `pb:b:${userId}:${today}`
                const usageKey = `pb:q:${userId}:${today}`
                const bonus = await redis.incr(bonusKey)
                if (bonus === 1) await redis.expire(bonusKey, secondsUntilJstMidnight())
                const used = Number((await redis.get(usageKey)) ?? 0)
                const remaining = Math.max(0, FREE_DAILY_LIMIT + bonus - used)
                return NextResponse.json({ ok: true, remain: remaining, tier: 'free' })
            }
            // cookie path (no redis): just acknowledge
            return NextResponse.json({ ok: true, remain: undefined, tier: 'free' })
        }

        // body
        let json: unknown = {}
        try {
            json = await req.json()
        } catch {
            json = {}
        }
        const parsed = parseBody(json)
        const rawInput = parsed.input ?? ''
        if (!rawInput) {
            return NextResponse.json({ error: 'empty input' }, { status: 400 })
        }

        const extracted = extractBracketHighlights(rawInput)
        const extraHi = normalizeHighlights(parsed.highlights)
        const allHighlights = normalizeHighlights([...extracted.highlights, ...extraHi])
        const { text: limitedText, truncated } = enforceCharLimit(extracted.clean, planTier)

        // quota check
        let useFree = false
        let useMonthly = false
        let useTopup = false

        if (planTier === 'free') {
            if (userId && redis) {
                const today = jstDateString()
                const usageKey = `pb:q:${userId}:${today}`
                const bonusKey = `pb:b:${userId}:${today}`
                const used = Number((await redis.get(usageKey)) ?? 0)
                const bonus = Number((await redis.get(bonusKey)) ?? 0)
                const left = Math.max(0, FREE_DAILY_LIMIT + bonus - used)
                if (left > 0) useFree = true
                else {
                    // check topup (simplified: presence means ok)
                    const nowIso = new Date().toISOString()
                    const { data: rows } = await sb
                        .from('user_topups')
                        .select('remain, amount, expire_at')
                        .eq('user_id', userId)
                        .gt('expire_at', nowIso)
                        .returns<UserTopupRow[]>()

                    const total = (rows ?? []).reduce<number>((acc, r) => {
                        const rem = typeof r.remain === 'number' ? r.remain
                            : (typeof r.amount === 'number' ? r.amount : 0)
                        return acc + rem
                    }, 0)
                    if (total > 0) useTopup = true
                    else {
                        return NextResponse.json(
                            { error: 'Daily quota exceeded', remain: 0, resetInSec: secondsUntilJstMidnight(), tier: 'free' },
                            { status: 402 }
                        )
                    }
                }
            } else {
                // no user or no redis: allow one (client cookie will count)
                useFree = true
            }
        } else {
            if (userId && redis) {
                const cycleId = (proUntil ?? '').slice(0, 10) || 'cycle'
                const key = `pb:m:${userId}:${cycleId}`
                const used = Number((await redis.get(key)) ?? 0)
                const cap = 1000
                if (used < cap) useMonthly = true
                else {
                    // try topup fallback
                    const nowIso = new Date().toISOString()
                    const { data: rows } = await sb
                        .from('user_topups')
                        .select('remain, amount, expire_at')
                        .eq('user_id', userId)
                        .gt('expire_at', nowIso)
                        .returns<UserTopupRow[]>()

                    const total = (rows ?? []).reduce<number>((acc, r) => {
                        const rem = typeof r.remain === 'number' ? r.remain
                            : (typeof r.amount === 'number' ? r.amount : 0)
                        return acc + rem
                    }, 0)
                    if (total > 0) useTopup = true
                    else {
                        return NextResponse.json(
                            { error: 'Monthly quota exceeded', tier: planTier, resetAt: proUntil },
                            { status: 402 }
                        )
                    }
                }
            } else {
                // no redis: just allow (no counting)
                useMonthly = true
            }
        }

        // llm
        const out = await callLLM(limitedText, allHighlights, parsed.options)

        // record usage
        if (userId && redis) {
            if (useFree) {
                const today = jstDateString()
                const usageKey = `pb:q:${userId}:${today}`
                const used = await redis.incr(usageKey)
                if (used === 1) await redis.expire(usageKey, secondsUntilJstMidnight())
            } else if (useMonthly) {
                const cycleId = (proUntil ?? '').slice(0, 10) || 'cycle'
                const key = `pb:m:${userId}:${cycleId}`
                const used = await redis.incr(key)
                if (used === 1) await redis.expire(key, secondsUntil(proUntil))
            } else if (useTopup) {
                // consume one (FIFO)
                const nowIso = new Date().toISOString()
                const { data: rows } = await sb
                    .from('user_topups')
                    .select('id, remain, amount, expire_at')
                    .eq('user_id', userId)
                    .gt('expire_at', nowIso)
                    .order('expire_at', { ascending: true })
                    .returns<UserTopupRow[]>()

                for (const r of rows ?? []) {
                    const rem = typeof r.remain === 'number' ? r.remain
                        : (typeof r.amount === 'number' ? r.amount : 0)
                    if (rem > 0) {
                        const { data: updated, error } = await sb
                            .from('user_topups')
                            .update({ remain: rem - 1 })
                            .eq('id', r.id)
                            .gt('remain', 0)
                            .select('id')
                            .maybeSingle<{ id: string }>()
                        if (!error && updated) break
                    }
                }
            }
        }

        return NextResponse.json({
            text: out,
            tier: planTier,
            remain: planTier === 'free' ? undefined : null,
            highlights: allHighlights,
            truncated: truncated || undefined,
        })
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'internal error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
