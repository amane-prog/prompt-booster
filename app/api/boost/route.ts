// app/api/boost/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isPro as isProDate } from '@/lib/plan'
import { Redis } from '@upstash/redis'
import OpenAI from 'openai'

export const runtime = 'nodejs' as const

// ===== 設定 =====
const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 3)
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const redis = UPSTASH_URL && UPSTASH_TOKEN ? new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }) : null

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY as string })
const MODEL = 'gpt-4o-mini'

// ===== 型 =====
type Pair = { date: string; value: number }

type BoostBody = {
    input?: string
    prompt?: string
    text?: string
    /** カンマ区切り or 配列どちらでもOK（フロントは配列推奨） */
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

type LlmResult = string

// ===== JST日付/TTL =====
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
// pro_until までのTTL（秒）
function secondsUntil(iso: string | null): number {
    if (!iso) return 31 * 24 * 60 * 60
    const end = new Date(iso).getTime()
    const now = Date.now()
    return Math.max(60, Math.floor((end - now) / 1000))
}

// ===== Cookieユーティリティ =====
function readPair(raw: string | undefined): Pair {
    const today = jstDateString()
    if (!raw) return { date: today, value: 0 }
    const [d, v] = raw.split(':')
    if (d !== today) return { date: today, value: 0 }
    const n = Number(v)
    return { date: today, value: Number.isFinite(n) ? n : 0 }
}
function cookieNames(userId: string | null): { usage: string; bonus: string } {
    const prefix = userId ? `pb_${userId}_` : 'pb_'
    return { usage: `${prefix}usage`, bonus: `${prefix}bonus` }
}

// ===== Top-up在庫ヘルパ =====
// sb は supabaseServer() の戻り（型は any でOK）
async function hasTopup(sb: any, userId: string): Promise<boolean> {
    const nowIso = new Date().toISOString()
    const { data: rows } = await sb
        .from('user_topups')
        .select('remain, amount, expire_at')
        .eq('user_id', userId)
        .gt('expire_at', nowIso)
        .order('expire_at', { ascending: true })
    type TopupRow = { remain?: number | null; amount?: number | null; expire_at: string }
    const rowsArr = (rows ?? []) as TopupRow[]
    const total = rowsArr.reduce((acc: number, r: TopupRow) => {
        const rem = typeof r.remain === 'number' ? r.remain : (typeof r.amount === 'number' ? r.amount : 0)
        return acc + rem
    }, 0)
    return total > 0
}

// 先入れ先出しで Top-up を1消費（有効期限が近い順）
// remain>0 を条件に付けて原子的に減らす
async function consumeOneTopup(sb: any, userId: string): Promise<boolean> {
    const nowIso = new Date().toISOString()
    const { data: rows } = await sb
        .from('user_topups')
        .select('id, remain, amount, expire_at')
        .eq('user_id', userId)
        .gt('expire_at', nowIso)
        .order('expire_at', { ascending: true })

    type TopupRow = { id: string; remain?: number | null; amount?: number | null; expire_at: string }
    const rowsArr = (rows ?? []) as TopupRow[]
    for (const r of rowsArr) {
        const rem = typeof r.remain === 'number' ? r.remain : (typeof r.amount === 'number' ? r.amount : 0)
        if (rem <= 0) continue
        const { data: updated, error } = await sb
            .from('user_topups')
            .update({ remain: rem - 1 })
            .eq('id', r.id)
            .gt('remain', 0)
            .select('id, remain')
            .maybeSingle()
        if (!error && updated) return true
    }
    return false
}

// ===== 入力/強調 抽出 =====
function parseBody(jsonUnknown: unknown): BoostBody {
    if (typeof jsonUnknown !== 'object' || jsonUnknown === null) return {}
    const rec = jsonUnknown as Record<string, unknown>
    return {
        input: typeof rec.input === 'string'
            ? rec.input
            : (typeof rec.prompt === 'string' ? rec.prompt : (typeof rec.text === 'string' ? rec.text : undefined)),
        highlights: Array.isArray(rec.highlights) || typeof rec.highlights === 'string'
            ? (rec.highlights as string[] | string)
            : null,
        options: typeof rec.options === 'object' && rec.options !== null
            ? (rec.options as BoostBody['options'])
            : undefined,
    }
}

/** 入力中の [こういうやつ] を抽出して、括弧を外したクリーンな本文と強調配列を返す */
function extractBracketHighlights(raw: string): { clean: string; highlights: string[] } {
    const found: string[] = []
    const clean = raw.replace(/\[([^\]\r\n]{1,60})\]/g, (_m, g1: string) => {
        const trimmed = g1.trim()
        if (trimmed.length > 0) found.push(trimmed)
        return trimmed
    })
    return { clean, highlights: found }
}

/** highlights: カンマ区切り or 配列 → 正規化（空や重複を除去、最大10件まで） */
function normalizeHighlights(h: string[] | string | null | undefined): string[] {
    if (!h) return []
    const arr = Array.isArray(h) ? h : h.split(',')
    const cleaned = arr
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 50)
    const seen = new Set<string>()
    const out: string[] = []
    for (const s of cleaned) {
        const key = s.toLowerCase()
        if (!seen.has(key)) {
            seen.add(key)
            out.push(s)
        }
        if (out.length >= 10) break
    }
    return out
}

/** プラン別 文字数制限（Free/Pro=500, Pro+=2000） */
function enforceCharLimit(text: string, tier: 'free' | 'pro' | 'pro_plus'): { text: string; truncated: boolean } {
    const limit = tier === 'pro_plus' ? 2000 : 500
    if (text.length <= limit) return { text, truncated: false }
    return { text: text.slice(0, limit), truncated: true }
}

// ===== OpenAI呼び出し =====
async function callLLM(userBrief: string, highlights: string[], options?: BoostBody['options']): Promise<LlmResult> {
    const system =
        [
            'You are Prompt Booster.',
            'Transform the user brief into a sharp, copy-pastable prompt plan.',
            'Always return valid markdown with these sections:',
            '- Goal',
            '- Context (brief, if useful)',
            '- Must-include (verbatim requirements)',
            '- Constraints (limits/time/brand/scope if any)',
            '- Style & Tone',
            '- Output format (bullets/tables/JSON etc.)',
            '- Draft prompt (single block, ready to paste)',
            '',
            'Rules:',
            '- If `Must-include` items are provided, reflect them explicitly and verbatim in the Draft prompt.',
            '- Keep it concise and actionable; avoid fluff.',
        ].join('\n')

    const emphasis =
        highlights.length > 0
            ? `\n\nEMPHASIS (must include verbatim or strongly paraphrased):\n- ${highlights.join('\n- ')}\n`
            : ''

    const extra =
        options ? [
            '\nSETTINGS:',
            options.mode ? `- mode: ${options.mode}` : '',
            options.color ? `- color_tone: ${options.color}` : '',
            options.tone ? `- tone: ${options.tone}` : '',
            options.ratio ? `- ratio: ${options.ratio}` : '',
            options.tags?.length ? `- dialogue_tags: ${options.tags.join(', ')}` : '',
            options.styles?.length ? `- gen_styles: ${options.styles.join(', ')}` : '',
        ].filter(Boolean).join('\n') : ''

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

// ===== ルート本体 =====
export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const ad = url.searchParams.get('ad')
        const jar = req.cookies

        // 認証
        const sb = await supabaseServer()
        let userId: string | null = null
        try {
            const { data: { user } } = await sb.auth.getUser()
            userId = user?.id ?? null
        } catch {
            userId = null
        }

        // 課金情報を確認して tier と proUntil を確定
        let planTier: 'free' | 'pro' | 'pro_plus' = 'free'
        let proUntil: string | null = null
        if (userId) {
            const { data: billing } = await sb
                .from('user_billing')
                .select('pro_until, plan_tier')
                .eq('user_id', userId)
                .maybeSingle()
            const active = isProDate(billing?.pro_until ?? null)
            if (active) {
                planTier = billing?.plan_tier === 'pro_plus' ? 'pro_plus' : 'pro'
                proUntil = billing?.pro_until ?? null
            }
        }
        const proActive = planTier !== 'free'

        // --- Watch Ad (+1) ---
        if (ad) {
            if (proActive) return NextResponse.json({ ok: true, remain: null, tier: planTier })

            if (userId) {
                // Redisに広告ボーナス +1
                const today = jstDateString()
                if (redis) {
                    const bonusKey = `pb:b:${userId}:${today}`
                    const bonus = await redis.incr(bonusKey)
                    if (bonus === 1) await redis.expire(bonusKey, secondsUntilJstMidnight())

                    const usageKey = `pb:q:${userId}:${today}`
                    const used = Number((await redis.get(usageKey)) ?? 0)
                    const remaining = Math.max(0, FREE_DAILY_LIMIT + bonus - used)
                    return NextResponse.json({ ok: true, remain: remaining, tier: 'free' })
                }
            }
            // cookie フォールバック
            const { usage, bonus } = cookieNames(userId)
            const u = readPair(jar.get(usage)?.value)
            const b = readPair(jar.get(bonus)?.value)
            const newBonus = b.value + 1

            const res = NextResponse.json({
                ok: true,
                remain: Math.max(0, FREE_DAILY_LIMIT + newBonus - u.value),
                tier: 'free',
            })
            res.cookies.set(bonus, `${u.date}:${newBonus}`, {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                maxAge: secondsUntilJstMidnight(),
            })
            return res
        }

        // --- 入力 ---
        let bodyJson: unknown = {}
        try {
            bodyJson = await req.json()
        } catch {
            bodyJson = {}
        }
        const parsed = parseBody(bodyJson)
        const rawInput = parsed.input ?? ''
        if (!rawInput) return NextResponse.json({ error: 'empty input' }, { status: 400 })

        // [] マーカー抽出 + クリーン本文生成
        const extracted = extractBracketHighlights(rawInput)
        const extraHi = normalizeHighlights(parsed.highlights)
        const allHighlights = normalizeHighlights([...extracted.highlights, ...extraHi])

        const finalBriefRaw = extracted.clean

        // --- 消費方針（どれを使うか） ---
        let useFreeDaily = false          // Free の日次枠
        let useSubMonthly = false         // Pro/Pro+ の月次枠
        let useTopup = false              // Top-up
        let cookiePathFree = false        // 未ログイン/Redis無しの Free cookie 運用

        if (!proActive) {
            // Free：無料枠 → 0なら Top-up（ログイン+Redis時のみ）
            if (userId && redis) {
                const today = jstDateString()
                const usageKey = `pb:q:${userId}:${today}`
                const bonusKey = `pb:b:${userId}:${today}`
                const used = Number((await redis.get(usageKey)) ?? 0)
                const bonus = Number((await redis.get(bonusKey)) ?? 0)
                const freeLeft = Math.max(0, FREE_DAILY_LIMIT + bonus - used)
                if (freeLeft > 0) {
                    useFreeDaily = true // 成功後にINCR
                } else {
                    if (await hasTopup(sb, userId)) {
                        useTopup = true
                    } else {
                        return NextResponse.json(
                            { error: 'Daily quota exceeded', remain: 0, resetInSec: secondsUntilJstMidnight(), tier: 'free', store: 'redis' },
                            { status: 402 }
                        )
                    }
                }
            } else {
                // 未ログイン or Redisなし → cookie で従来運用（Top-upは未対応）
                const { usage, bonus } = cookieNames(userId)
                const u = readPair(jar.get(usage)?.value)
                const b = readPair(jar.get(bonus)?.value)
                if (u.value >= FREE_DAILY_LIMIT + b.value) {
                    return NextResponse.json(
                        { error: 'Daily quota exceeded', remain: 0, resetInSec: secondsUntilJstMidnight(), tier: 'free', store: 'cookie' },
                        { status: 402 }
                    )
                }
                cookiePathFree = true // 成功後に cookie を+1
            }
        } else {
            // Pro/Pro+：月次1000 → 0なら Top-up
            if (userId) {
                const cycleId = (proUntil ?? '').slice(0, 10) || 'cycle'
                const subCap = 1000 // tier別に変えるならここで分岐
                const key = `pb:m:${userId}:${cycleId}`
                const usedRaw = Number((await redis?.get(key)) ?? 0)
                const subLeft = Math.max(0, subCap - usedRaw)
                if (subLeft > 0) {
                    useSubMonthly = true // 成功後にINCR
                } else {
                    if (await hasTopup(sb, userId)) {
                        useTopup = true
                    } else {
                        return NextResponse.json(
                            { error: 'Monthly quota exceeded', tier: planTier, resetAt: proUntil },
                            { status: 402 }
                        )
                    }
                }
            }
        }

        // --- 文字数制限（UIは常時開放、制限はバックで適用） ---
        const limited = enforceCharLimit(finalBriefRaw, planTier)

        // --- LLM ---
        const text: LlmResult = await callLLM(limited.text, allHighlights, parsed.options)

        // --- 成功後に消費をコミット ---
        // Free (Redis)
        if (useFreeDaily && userId && redis) {
            const today = jstDateString()
            const usageKey = `pb:q:${userId}:${today}`
            const used = await redis.incr(usageKey)
            if (used === 1) await redis.expire(usageKey, secondsUntilJstMidnight())
            const bonusKey = `pb:b:${userId}:${today}`
            const bonus = Number((await redis.get(bonusKey)) ?? 0)
            const remainAfter = Math.max(0, FREE_DAILY_LIMIT + bonus - used)
            return NextResponse.json({
                text,
                remain: remainAfter,
                tier: 'free',
                highlights: allHighlights,
                truncated: limited.truncated || undefined
            })
        }

        // Free (cookie)
        if (cookiePathFree) {
            const { usage, bonus } = cookieNames(userId)
            const u = readPair(jar.get(usage)?.value)
            const b = readPair(jar.get(bonus)?.value)
            const nextUsed = u.value + 1
            const remain = Math.max(0, FREE_DAILY_LIMIT + b.value - nextUsed)
            const res = NextResponse.json({ text, remain, tier: 'free', highlights: allHighlights, truncated: limited.truncated || undefined })
            res.cookies.set(usage, `${u.date}:${nextUsed}`, {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                maxAge: secondsUntilJstMidnight(),
            })
            return res
        }

        // Pro/Pro+ 月次（Redis）
        if (useSubMonthly && userId && redis) {
            const cycleId = (proUntil ?? '').slice(0, 10) || 'cycle'
            const key = `pb:m:${userId}:${cycleId}`
            const used = await redis.incr(key)
            if (used === 1) await redis.expire(key, secondsUntil(proUntil))
            // Pro系は remain=null で返す（フロントは /status 再取得で subRemaining を表示）
            return NextResponse.json({
                text,
                remain: null,
                tier: planTier,
                highlights: allHighlights,
                truncated: limited.truncated || undefined
            })
        }

        // Top-up 消費（全プラン共通のフォールバック）
        if (useTopup && userId) {
            const ok = await consumeOneTopup(sb, userId)
            if (!ok) {
                // 競合で在庫が無くなった等
                return NextResponse.json({ error: 'No top-up balance', tier: planTier }, { status: 402 })
            }
            return NextResponse.json({
                text,
                remain: proActive ? null : undefined,
                tier: planTier,
                highlights: allHighlights,
                truncated: limited.truncated || undefined
            })
        }

        // ここに来るのは Pro だが userId/redis 無し等の稀ケース
        return NextResponse.json({
            text,
            remain: proActive ? null : undefined,
            tier: planTier,
            highlights: allHighlights,
            truncated: limited.truncated || undefined
        })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'internal error'
        console.error('[boost error]', e)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
