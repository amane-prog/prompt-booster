// app/api/boost/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isPro as isProDate } from '@/lib/plan'
import { Redis } from '@upstash/redis'
import OpenAI from 'openai'

export const runtime = 'nodejs'

// ===== 險ｭ螳・=====
const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 3)
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const redis = UPSTASH_URL && UPSTASH_TOKEN ? new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }) : null

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY as string })
const MODEL = 'gpt-4o-mini'

// ===== 蝙・=====
type Pair = { date: string; value: number }

type BoostBody = {
    input?: string
    prompt?: string
    text?: string
    /** 繧ｫ繝ｳ繝槫玄蛻・ｊ or 驟榊・縺ｩ縺｡繧峨〒繧０K・医ヵ繝ｭ繝ｳ繝医・驟榊・謗ｨ螂ｨ・・*/
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

// ===== JST譌･莉・TTL =====
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
// pro_until 縺ｾ縺ｧ縺ｮTTL・育ｧ抵ｼ・
function secondsUntil(iso: string | null): number {
    if (!iso) return 31 * 24 * 60 * 60
    const end = new Date(iso).getTime()
    const now = Date.now()
    return Math.max(60, Math.floor((end - now) / 1000))
}

// ===== Cookie繝ｦ繝ｼ繝・ぅ繝ｪ繝・ぅ =====
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

// ===== Top-up蝨ｨ蠎ｫ繝倥Ν繝・=====
// sb 縺ｯ supabaseServer() 縺ｮ謌ｻ繧奇ｼ亥梛縺ｯ any 縺ｧOK・・
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

// 蜈亥・繧悟・蜃ｺ縺励〒 Top-up 繧・豸郁ｲｻ・域怏蜉ｹ譛滄剞縺瑚ｿ代＞鬆・ｼ・
// remain>0 繧呈擅莉ｶ縺ｫ莉倥￠縺ｦ蜴溷ｭ千噪縺ｫ貂帙ｉ縺・
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

// ===== 蜈･蜉・蠑ｷ隱ｿ 謚ｽ蜃ｺ =====
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

/** 蜈･蜉帑ｸｭ縺ｮ [縺薙≧縺・≧繧・▽] 繧呈歓蜃ｺ縺励※縲∵峡蠑ｧ繧貞､悶＠縺溘け繝ｪ繝ｼ繝ｳ縺ｪ譛ｬ譁・→蠑ｷ隱ｿ驟榊・繧定ｿ斐☆ */
function extractBracketHighlights(raw: string): { clean: string; highlights: string[] } {
    const found: string[] = []
    const clean = raw.replace(/\[([^\]\r\n]{1,60})\]/g, (_m, g1: string) => {
        const trimmed = g1.trim()
        if (trimmed.length > 0) found.push(trimmed)
        return trimmed
    })
    return { clean, highlights: found }
}

/** highlights: 繧ｫ繝ｳ繝槫玄蛻・ｊ or 驟榊・ 竊・豁｣隕丞喧・育ｩｺ繧・㍾隍・ｒ髯､蜴ｻ縲∵怙螟ｧ10莉ｶ縺ｾ縺ｧ・・*/
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

/** 繝励Λ繝ｳ蛻･ 譁・ｭ玲焚蛻ｶ髯撰ｼ・ree/Pro=500, Pro+=2000・・*/
function enforceCharLimit(text: string, tier: 'free' | 'pro' | 'pro_plus'): { text: string; truncated: boolean } {
    const limit = tier === 'pro_plus' ? 2000 : 500
    if (text.length <= limit) return { text, truncated: false }
    return { text: text.slice(0, limit), truncated: true }
}

// ===== OpenAI蜻ｼ縺ｳ蜃ｺ縺・=====
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

// ===== 繝ｫ繝ｼ繝域悽菴・=====
export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const ad = url.searchParams.get('ad')
        const jar = req.cookies

        // 隱崎ｨｼ
        const sb = await supabaseServer()
        let userId: string | null = null
        try {
            const { data: { user } } = await sb.auth.getUser()
            userId = user?.id ?? null
        } catch {
            userId = null
        }

        // 隱ｲ驥第ュ蝣ｱ繧堤｢ｺ隱阪＠縺ｦ tier 縺ｨ proUntil 繧堤｢ｺ螳・
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
                // Redis縺ｫ蠎・相繝懊・繝翫せ +1
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
            // cookie 繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ
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

        // --- 蜈･蜉・---
        let bodyJson: unknown = {}
        try {
            bodyJson = await req.json()
        } catch {
            bodyJson = {}
        }
        const parsed = parseBody(bodyJson)
        const rawInput = parsed.input ?? ''
        if (!rawInput) return NextResponse.json({ error: 'empty input' }, { status: 400 })

        // [] 繝槭・繧ｫ繝ｼ謚ｽ蜃ｺ + 繧ｯ繝ｪ繝ｼ繝ｳ譛ｬ譁・函謌・
        const extracted = extractBracketHighlights(rawInput)
        const extraHi = normalizeHighlights(parsed.highlights)
        const allHighlights = normalizeHighlights([...extracted.highlights, ...extraHi])

        const finalBriefRaw = extracted.clean

        // --- 豸郁ｲｻ譁ｹ驥晢ｼ医←繧後ｒ菴ｿ縺・°・・---
        let useFreeDaily = false          // Free 縺ｮ譌･谺｡譫
        let useSubMonthly = false         // Pro/Pro+ 縺ｮ譛域ｬ｡譫
        let useTopup = false              // Top-up
        let cookiePathFree = false        // 譛ｪ繝ｭ繧ｰ繧､繝ｳ/Redis辟｡縺励・ Free cookie 驕狗畑

        if (!proActive) {
            // Free・夂┌譁呎棧 竊・0縺ｪ繧・Top-up・医Ο繧ｰ繧､繝ｳ+Redis譎ゅ・縺ｿ・・
            if (userId && redis) {
                const today = jstDateString()
                const usageKey = `pb:q:${userId}:${today}`
                const bonusKey = `pb:b:${userId}:${today}`
                const used = Number((await redis.get(usageKey)) ?? 0)
                const bonus = Number((await redis.get(bonusKey)) ?? 0)
                const freeLeft = Math.max(0, FREE_DAILY_LIMIT + bonus - used)
                if (freeLeft > 0) {
                    useFreeDaily = true // 謌仙粥蠕後↓INCR
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
                // 譛ｪ繝ｭ繧ｰ繧､繝ｳ or Redis縺ｪ縺・竊・cookie 縺ｧ蠕捺擂驕狗畑・・op-up縺ｯ譛ｪ蟇ｾ蠢懶ｼ・
                const { usage, bonus } = cookieNames(userId)
                const u = readPair(jar.get(usage)?.value)
                const b = readPair(jar.get(bonus)?.value)
                if (u.value >= FREE_DAILY_LIMIT + b.value) {
                    return NextResponse.json(
                        { error: 'Daily quota exceeded', remain: 0, resetInSec: secondsUntilJstMidnight(), tier: 'free', store: 'cookie' },
                        { status: 402 }
                    )
                }
                cookiePathFree = true // 謌仙粥蠕後↓ cookie 繧・1
            }
        } else {
            // Pro/Pro+・壽怦谺｡1000 竊・0縺ｪ繧・Top-up
            if (userId) {
                const cycleId = (proUntil ?? '').slice(0, 10) || 'cycle'
                const subCap = 1000 // tier蛻･縺ｫ螟峨∴繧九↑繧峨％縺薙〒蛻・ｲ・
                const key = `pb:m:${userId}:${cycleId}`
                const usedRaw = Number((await redis?.get(key)) ?? 0)
                const subLeft = Math.max(0, subCap - usedRaw)
                if (subLeft > 0) {
                    useSubMonthly = true // 謌仙粥蠕後↓INCR
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

        // --- 譁・ｭ玲焚蛻ｶ髯撰ｼ・I縺ｯ蟶ｸ譎る幕謾ｾ縲∝宛髯舌・繝舌ャ繧ｯ縺ｧ驕ｩ逕ｨ・・---
        const limited = enforceCharLimit(finalBriefRaw, planTier)

        // --- LLM ---
        const text: LlmResult = await callLLM(limited.text, allHighlights, parsed.options)

        // --- 謌仙粥蠕後↓豸郁ｲｻ繧偵さ繝溘ャ繝・---
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

        // Pro/Pro+ 譛域ｬ｡・・edis・・
        if (useSubMonthly && userId && redis) {
            const cycleId = (proUntil ?? '').slice(0, 10) || 'cycle'
            const key = `pb:m:${userId}:${cycleId}`
            const used = await redis.incr(key)
            if (used === 1) await redis.expire(key, secondsUntil(proUntil))
            // Pro邉ｻ縺ｯ remain=null 縺ｧ霑斐☆・医ヵ繝ｭ繝ｳ繝医・ /status 蜀榊叙蠕励〒 subRemaining 繧定｡ｨ遉ｺ・・
            return NextResponse.json({
                text,
                remain: null,
                tier: planTier,
                highlights: allHighlights,
                truncated: limited.truncated || undefined
            })
        }

        // Top-up 豸郁ｲｻ・亥・繝励Λ繝ｳ蜈ｱ騾壹・繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ・・
        if (useTopup && userId) {
            const ok = await consumeOneTopup(sb, userId)
            if (!ok) {
                // 遶ｶ蜷医〒蝨ｨ蠎ｫ縺檎┌縺上↑縺｣縺溽ｭ・
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

        // 縺薙％縺ｫ譚･繧九・縺ｯ Pro 縺縺・userId/redis 辟｡縺礼ｭ峨・遞繧ｱ繝ｼ繧ｹ
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
