// app/api/boost/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isPro as isProDate } from '@/lib/plan'
import { Redis } from '@upstash/redis'
import OpenAI from 'openai'

export const runtime = 'nodejs'

<<<<<<< HEAD
// ----- env helpers -----
function unquote(s: string | undefined | null) {
    if (!s) return ''
    return s.replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '')
=======
// ===== 鬮ｫ・ｪ繝ｻ・ｭ髯橸ｽｳ郢晢ｽｻ=====
const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 3)
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const redis = UPSTASH_URL && UPSTASH_TOKEN ? new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }) : null

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY as string })
const MODEL = 'gpt-4o-mini'

// ===== 髯懷生繝ｻ=====
type Pair = { date: string; value: number }

type BoostBody = {
    input?: string
    prompt?: string
    text?: string
    /** 驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・ｳ驛｢譎・ｽｧ・ｫ驍・・蟠慕ｹ晢ｽｻ繝ｻ繝ｻor 鬯ｩ貊難ｽｦ鄙ｫ繝ｻ驍ｵ・ｺ繝ｻ・ｩ驍ｵ・ｺ繝ｻ・｡驛｢・ｧ陝ｲ・ｨ邵ｲ蝣､・ｹ・ｧ繝ｻ蟆ｻ郢晢ｽｻ陋ｹ・ｻ郢晢ｽｵ驛｢譎｢・ｽ・ｭ驛｢譎｢・ｽ・ｳ驛｢譎冗樟郢晢ｽｻ鬯ｩ貊難ｽｦ鄙ｫ繝ｻ髫ｰ證ｦ・ｽ・ｨ髯槭ｑ・ｽ・ｨ郢晢ｽｻ郢晢ｽｻ*/
    highlights?: string[] | string | null
    options?: {
        mode?: 'dialogue' | 'generation'
        color?: 'auto' | 'bright' | 'dark' | 'pastel' | 'mono'
        ratio?: 'auto' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
        tone?: 'auto' | 'friendly' | 'formal' | 'concise' | 'enthusiastic' | 'neutral' | 'empathetic'
        tags?: string[]
        styles?: string[]
    }
>>>>>>> deploy-test
}

const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 3)
const UPSTASH_URL = unquote(process.env.UPSTASH_REDIS_REST_URL)
const UPSTASH_TOKEN = unquote(process.env.UPSTASH_REDIS_REST_TOKEN)
const OPENAI_KEY = unquote(process.env.OPENAI_API_KEY)

<<<<<<< HEAD
function getRedis(): Redis | null {
    if (UPSTASH_URL && UPSTASH_TOKEN && /^https:\/\//.test(UPSTASH_URL)) {
        return new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })
    }
    return null
}

const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null
const MODEL = 'gpt-4o-mini'

// ----- utilities -----
=======
// ===== JST髫ｴ魃会ｽｽ・･髣泌ｳｨ繝ｻTTL =====
>>>>>>> deploy-test
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
<<<<<<< HEAD
=======
// pro_until 驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ繝ｻ・ｮTTL郢晢ｽｻ髢ｧ・ｲ繝ｻ・ｧ隰夲ｽｵ繝ｻ・ｼ郢晢ｽｻ
>>>>>>> deploy-test
function secondsUntil(iso: string | null): number {
    if (!iso) return 31 * 24 * 60 * 60
    const end = new Date(iso).getTime()
    const now = Date.now()
    return Math.max(60, Math.floor((end - now) / 1000))
}

<<<<<<< HEAD
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
=======
// ===== Cookie驛｢譎｢・ｽ・ｦ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ邵ｺ繝ｻ・ｹ譎｢・ｽ・ｪ驛｢譏ｴ繝ｻ邵ｺ繝ｻ=====
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

// ===== Top-up髯懶ｽｨ繝ｻ・ｨ髯溯ｶ｣・ｽ・ｫ驛｢譎渉・･・取刮・ｹ譏ｴ繝ｻ=====
// sb 驍ｵ・ｺ繝ｻ・ｯ supabaseServer() 驍ｵ・ｺ繝ｻ・ｮ髫ｰ魃会ｽｽ・ｻ驛｢・ｧ陞ゅ・・ｽ・ｼ闔・･隴ｴ蟶ｷ・ｸ・ｺ繝ｻ・ｯ any 驍ｵ・ｺ繝ｻ・ｧOK郢晢ｽｻ郢晢ｽｻ
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

// 髯ｷ莠包ｽｺ・･郢晢ｽｻ驛｢・ｧ隰疲ｺ倥・髯ｷ繝ｻ・ｽ・ｺ驍ｵ・ｺ陷会ｽｱ邵ｲ繝ｻTop-up 驛｢・ｧ郢晢ｽｻ髮趣ｽｸ鬩帙・・ｽ・ｲ繝ｻ・ｻ郢晢ｽｻ陜捺ｻ督蜑ｰ諤上・・ｹ髫ｴ蟶ｶ・ｻ繝ｻ蠢憺し・ｺ霑ｹ螟ｲ・ｽ・ｿ闔会ｽ｣繝ｻ讓｣・ｬ繝ｻ繝ｻ繝ｻ・ｼ郢晢ｽｻ
// remain>0 驛｢・ｧ陷ｻ蝓溷･鈴濫莨夲ｽｽ・ｶ驍ｵ・ｺ繝ｻ・ｫ髣皮甥ﾂ・･繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｦ髯ｷ・ｴ雋・ｽｷ繝ｻ・ｭ陷翫・鬟ｭ驍ｵ・ｺ繝ｻ・ｫ髮九ｇ・ｸ蜻ｻ・ｽ閾･・ｸ・ｺ郢晢ｽｻ
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
>>>>>>> deploy-test
    }
}

<<<<<<< HEAD
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
=======
// ===== 髯ｷ闌ｨ・ｽ・･髯ｷ蟲ｨ繝ｻ髯滓汚・ｽ・ｷ鬮ｫ・ｱ繝ｻ・ｿ 髫ｰ螟ｲ・ｽ・ｽ髯ｷ繝ｻ・ｽ・ｺ =====
>>>>>>> deploy-test
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

<<<<<<< HEAD
=======
/** 髯ｷ闌ｨ・ｽ・･髯ｷ迚呻ｽｸ謇假ｽｽ・ｸ繝ｻ・ｭ驍ｵ・ｺ繝ｻ・ｮ [驍ｵ・ｺ髦ｮ蜷ｮ魘ｬ驍ｵ・ｺ郢晢ｽｻ遶包ｽｧ驛｢・ｧ郢晢ｽｻ隨・ｽｽ] 驛｢・ｧ陷ｻ蝓滂ｽｭ讌｢諤弱・・ｺ驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ驍ｵ・ｲ遶擾ｽｵ陝ｲ・｡髯滓汚・ｽ・ｧ驛｢・ｧ髮区ｩｸ・ｽ・､隰費ｽｶ繝ｻ・ｰ驍ｵ・ｺ雋・･・驛｢譎｢・ｽ・ｪ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｪ髫ｴ蟷｢・ｽ・ｬ髫ｴ竏壹・遶雁ｮ夲｣ｰ謇假ｽｽ・ｷ鬮ｫ・ｱ繝ｻ・ｿ鬯ｩ貊難ｽｦ鄙ｫ繝ｻ驛｢・ｧ陞ｳ螟ｲ・ｽ・ｿ隴∫ｵｶ繝ｻ */
>>>>>>> deploy-test
function extractBracketHighlights(raw: string): { clean: string; highlights: string[] } {
    const found: string[] = []
    const clean = raw.replace(/\[([^\]\r\n]{1,60})\]/g, (_m, g1: string) => {
        const trimmed = g1.trim()
        if (trimmed.length > 0) found.push(trimmed)
        return trimmed
    })
    return { clean, highlights: found }
}

<<<<<<< HEAD
=======
/** highlights: 驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・ｳ驛｢譎・ｽｧ・ｫ驍・・蟠慕ｹ晢ｽｻ繝ｻ繝ｻor 鬯ｩ貊難ｽｦ鄙ｫ繝ｻ 驕ｶ鄙ｫ繝ｻ髮弱・・ｽ・｣鬮ｫ遨ゑｽｸ讒ｫ蟇・ｹ晢ｽｻ髢ｧ・ｲ繝ｻ・ｩ繝ｻ・ｺ驛｢・ｧ郢晢ｽｻ郤・ｽｾ鬮ｫ髦ｪ繝ｻ繝ｻ蟶晢ｽｫ・ｯ繝ｻ・､髯ｷ・ｴ繝ｻ・ｻ驍ｵ・ｲ遶擾ｽｵ隲､蜻ｵ譽斐・・ｧ10髣比ｼ夲ｽｽ・ｶ驍ｵ・ｺ繝ｻ・ｾ驍ｵ・ｺ繝ｻ・ｧ郢晢ｽｻ郢晢ｽｻ*/
>>>>>>> deploy-test
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

<<<<<<< HEAD
function enforceCharLimit(text: string, tier: 'free' | 'pro' | 'pro_plus') {
=======
/** 驛｢譎丞ｹｲ・主ｸｷ・ｹ譎｢・ｽ・ｳ髯具ｽｻ繝ｻ・･ 髫ｴ竏壹・繝ｻ・ｭ驍・ｽｲ霎溷､雁ｴ輔・・ｶ鬯ｮ・ｯ隰ｦ・ｰ繝ｻ・ｼ郢晢ｽｻree/Pro=500, Pro+=2000郢晢ｽｻ郢晢ｽｻ*/
function enforceCharLimit(text: string, tier: 'free' | 'pro' | 'pro_plus'): { text: string; truncated: boolean } {
>>>>>>> deploy-test
    const limit = tier === 'pro_plus' ? 2000 : 500
    if (text.length <= limit) return { text, truncated: false }
    return { text: text.slice(0, limit), truncated: true }
}

<<<<<<< HEAD
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
=======
// ===== OpenAI髯ｷ・ｻ繝ｻ・ｼ驍ｵ・ｺ繝ｻ・ｳ髯ｷ繝ｻ・ｽ・ｺ驍ｵ・ｺ郢晢ｽｻ=====
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
>>>>>>> deploy-test

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

<<<<<<< HEAD
// ----- handler -----
export async function POST(req: Request): Promise<Response> {
=======
// ===== 驛｢譎｢・ｽ・ｫ驛｢譎｢・ｽ・ｼ驛｢譎乗ｲｺ隰費ｽｽ髣厄ｽｴ郢晢ｽｻ=====
export async function POST(req: NextRequest) {
>>>>>>> deploy-test
    try {
        const redis = getRedis()
        const url = new URL(req.url)
<<<<<<< HEAD
        const isAd = url.searchParams.get('ad')
=======
        const ad = url.searchParams.get('ad')
        const jar = req.cookies

        // 鬮ｫ・ｱ陝雜｣・ｽ・ｨ繝ｻ・ｼ
>>>>>>> deploy-test
        const sb = await supabaseServer()

        // auth
        let userId: string | null = null
        try {
            const { data: { user } } = await sb.auth.getUser()
            userId = user?.id ?? null
        } catch {
            userId = null
        }

<<<<<<< HEAD
        // plan
        let planTier: PlanTier = 'free'
=======
        // 鬮ｫ・ｱ繝ｻ・ｲ鬯ｩ・･髫ｨ・ｬ郢晢ｽ･髯懶ｽ｣繝ｻ・ｱ驛｢・ｧ陜｣・､繝ｻ・｢繝ｻ・ｺ鬮ｫ・ｱ鬮ｦ・ｪ繝ｻ・ｰ驍ｵ・ｺ繝ｻ・ｦ tier 驍ｵ・ｺ繝ｻ・ｨ proUntil 驛｢・ｧ陜｣・､繝ｻ・｢繝ｻ・ｺ髯橸ｽｳ郢晢ｽｻ
        let planTier: 'free' | 'pro' | 'pro_plus' = 'free'
>>>>>>> deploy-test
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

<<<<<<< HEAD
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
=======
        // --- Watch Ad (+1) ---
        if (ad) {
            if (proActive) return NextResponse.json({ ok: true, remain: null, tier: planTier })

            if (userId) {
                // Redis驍ｵ・ｺ繝ｻ・ｫ髯溷ｼｱ繝ｻ騾ｶ・ｸ驛｢譎・鯵郢晢ｽｻ驛｢譎会ｽｿ・ｫ邵ｺ繝ｻ+1
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
            // cookie 驛｢譎・ｽｼ譁青ｰ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ驛｢譎√・郢晢ｽ｣驛｢・ｧ繝ｻ・ｯ
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

        // --- 髯ｷ闌ｨ・ｽ・･髯ｷ蟲ｨ繝ｻ---
        let bodyJson: unknown = {}
>>>>>>> deploy-test
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

<<<<<<< HEAD
=======
        // [] 驛｢譎・ｽｧ・ｭ郢晢ｽｻ驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・ｼ髫ｰ螟ｲ・ｽ・ｽ髯ｷ繝ｻ・ｽ・ｺ + 驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｪ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｳ髫ｴ蟷｢・ｽ・ｬ髫ｴ竏壹・陷・ｽｽ髫ｰ蠕後・
>>>>>>> deploy-test
        const extracted = extractBracketHighlights(rawInput)
        const extraHi = normalizeHighlights(parsed.highlights)
        const allHighlights = normalizeHighlights([...extracted.highlights, ...extraHi])
        const { text: limitedText, truncated } = enforceCharLimit(extracted.clean, planTier)

        // quota check
        let useFree = false
        let useMonthly = false
        let useTopup = false

<<<<<<< HEAD
        if (planTier === 'free') {
=======
        // --- 髮趣ｽｸ鬩帙・・ｽ・ｲ繝ｻ・ｻ髫ｴ繝ｻ・ｽ・ｹ鬯ｩ・･隴趣ｽ｢繝ｻ・ｼ陋ｹ・ｻ遶雁鴻・ｹ・ｧ陟暮ｯ会ｽｽ螳壽割繝ｻ・ｿ驍ｵ・ｺ郢晢ｽｻ・ゑｽｰ郢晢ｽｻ郢晢ｽｻ---
        let useFreeDaily = false          // Free 驍ｵ・ｺ繝ｻ・ｮ髫ｴ魃会ｽｽ・･髫ｹ・ｺ繝ｻ・｡髫ｴ・ｫ繝ｻ・ｰ
        let useSubMonthly = false         // Pro/Pro+ 驍ｵ・ｺ繝ｻ・ｮ髫ｴ蟶帶ｲｺ繝ｻ・ｬ繝ｻ・｡髫ｴ・ｫ繝ｻ・ｰ
        let useTopup = false              // Top-up
        let cookiePathFree = false        // 髫ｴ蟷｢・ｽ・ｪ驛｢譎｢・ｽ・ｭ驛｢・ｧ繝ｻ・ｰ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ/Redis髴取ｻゑｽｽ・｡驍ｵ・ｺ陷会ｽｱ郢晢ｽｻ Free cookie 鬯ｩ諷戊ｷ晞｡繝ｻ

        if (!proActive) {
            // Free郢晢ｽｻ陞溘ｄ莨ｯ髫ｴ竏晉ｶ懆ｭｽ・ｧ 驕ｶ鄙ｫ繝ｻ0驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ郢晢ｽｻTop-up郢晢ｽｻ陋ｹ・ｻ・取ｺｽ・ｹ・ｧ繝ｻ・ｰ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ+Redis髫ｴ蠑ｱ・・ｹ晢ｽｻ驍ｵ・ｺ繝ｻ・ｿ郢晢ｽｻ郢晢ｽｻ
>>>>>>> deploy-test
            if (userId && redis) {
                const today = jstDateString()
                const usageKey = `pb:q:${userId}:${today}`
                const bonusKey = `pb:b:${userId}:${today}`
                const used = Number((await redis.get(usageKey)) ?? 0)
                const bonus = Number((await redis.get(bonusKey)) ?? 0)
<<<<<<< HEAD
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
=======
                const freeLeft = Math.max(0, FREE_DAILY_LIMIT + bonus - used)
                if (freeLeft > 0) {
                    useFreeDaily = true // 髫ｰ蠕｡・ｻ蜥擾ｽｲ・･髯溷供・ｾ螽ｯ繝ｻINCR
                } else {
                    if (await hasTopup(sb, userId)) {
                        useTopup = true
                    } else {
>>>>>>> deploy-test
                        return NextResponse.json(
                            { error: 'Daily quota exceeded', remain: 0, resetInSec: secondsUntilJstMidnight(), tier: 'free' },
                            { status: 402 }
                        )
                    }
                }
            } else {
<<<<<<< HEAD
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
=======
                // 髫ｴ蟷｢・ｽ・ｪ驛｢譎｢・ｽ・ｭ驛｢・ｧ繝ｻ・ｰ驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｳ or Redis驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ驕ｶ鄙ｫ繝ｻcookie 驍ｵ・ｺ繝ｻ・ｧ髯溷｢鍋袖隰ｫ繧具ｽｩ諷戊ｷ晞｡莉｣繝ｻ郢晢ｽｻop-up驍ｵ・ｺ繝ｻ・ｯ髫ｴ蟷｢・ｽ・ｪ髯昴・・ｽ・ｾ髯滂ｽ｢隲幢ｽｶ繝ｻ・ｼ郢晢ｽｻ
                const { usage, bonus } = cookieNames(userId)
                const u = readPair(jar.get(usage)?.value)
                const b = readPair(jar.get(bonus)?.value)
                if (u.value >= FREE_DAILY_LIMIT + b.value) {
                    return NextResponse.json(
                        { error: 'Daily quota exceeded', remain: 0, resetInSec: secondsUntilJstMidnight(), tier: 'free', store: 'cookie' },
                        { status: 402 }
                    )
                }
                cookiePathFree = true // 髫ｰ蠕｡・ｻ蜥擾ｽｲ・･髯溷供・ｾ螽ｯ繝ｻ cookie 驛｢・ｧ郢晢ｽｻ1
            }
        } else {
            // Pro/Pro+郢晢ｽｻ陞｢・ｽ隲､・ｦ髫ｹ・ｺ繝ｻ・｡1000 驕ｶ鄙ｫ繝ｻ0驍ｵ・ｺ繝ｻ・ｪ驛｢・ｧ郢晢ｽｻTop-up
            if (userId) {
                const cycleId = (proUntil ?? '').slice(0, 10) || 'cycle'
                const subCap = 1000 // tier髯具ｽｻ繝ｻ・･驍ｵ・ｺ繝ｻ・ｫ髯樊ｺｷ・ｳ・ｨ遶擾ｽｴ驛｢・ｧ闕ｵ譏ｶ繝ｻ驛｢・ｧ陝ｲ・ｨ繝ｻ繝ｻ・ｸ・ｺ髦ｮ蜷ｶﾂ螳壼ｴ慕ｹ晢ｽｻ繝ｻ・ｲ郢晢ｽｻ
                const key = `pb:m:${userId}:${cycleId}`
                const usedRaw = Number((await redis?.get(key)) ?? 0)
                const subLeft = Math.max(0, subCap - usedRaw)
                if (subLeft > 0) {
                    useSubMonthly = true // 髫ｰ蠕｡・ｻ蜥擾ｽｲ・･髯溷供・ｾ螽ｯ繝ｻINCR
                } else {
                    if (await hasTopup(sb, userId)) {
                        useTopup = true
                    } else {
>>>>>>> deploy-test
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

<<<<<<< HEAD
        // llm
        const out = await callLLM(limitedText, allHighlights, parsed.options)
=======
        // --- 髫ｴ竏壹・繝ｻ・ｭ驍・ｽｲ霎溷､雁ｴ輔・・ｶ鬯ｮ・ｯ隰ｦ・ｰ繝ｻ・ｼ郢晢ｽｻI驍ｵ・ｺ繝ｻ・ｯ髯晢ｽｶ繝ｻ・ｸ髫ｴ蠑ｱ・玖濤謌奇ｽｬ・ｾ繝ｻ・ｾ驍ｵ・ｲ遶乗剌・ｮ蟷・ｽｫ・ｯ髣雁ｾ後・驛｢譎√・郢晢ｽ｣驛｢・ｧ繝ｻ・ｯ驍ｵ・ｺ繝ｻ・ｧ鬯ｩ蛹・ｽｽ・ｩ鬨ｾ蛹・ｽｽ・ｨ郢晢ｽｻ郢晢ｽｻ---
        const limited = enforceCharLimit(finalBriefRaw, planTier)
>>>>>>> deploy-test

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

<<<<<<< HEAD
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
=======
        // --- 髫ｰ蠕｡・ｻ蜥擾ｽｲ・･髯溷供・ｾ螽ｯ繝ｻ髮趣ｽｸ鬩帙・・ｽ・ｲ繝ｻ・ｻ驛｢・ｧ陋幢ｽｵ邵ｺ諷包ｽｹ譎・ｽｺ蛟･ﾎ暮Δ譏ｴ繝ｻ---
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

        // Pro/Pro+ 髫ｴ蟶帶ｲｺ繝ｻ・ｬ繝ｻ・｡郢晢ｽｻ郢晢ｽｻedis郢晢ｽｻ郢晢ｽｻ
        if (useSubMonthly && userId && redis) {
            const cycleId = (proUntil ?? '').slice(0, 10) || 'cycle'
            const key = `pb:m:${userId}:${cycleId}`
            const used = await redis.incr(key)
            if (used === 1) await redis.expire(key, secondsUntil(proUntil))
            // Pro鬩堺ｼ夲ｽｽ・ｻ驍ｵ・ｺ繝ｻ・ｯ remain=null 驍ｵ・ｺ繝ｻ・ｧ鬮ｴ隨ｬ魍堤ｬ倥・繝ｻ陋ｹ・ｻ郢晢ｽｵ驛｢譎｢・ｽ・ｭ驛｢譎｢・ｽ・ｳ驛｢譎冗樟郢晢ｽｻ /status 髯ｷﾂ隶朱宦蠕宣辧蜍溷ｹｲ邵ｲ繝ｻsubRemaining 驛｢・ｧ陞ｳ螟ｲ・ｽ・｡繝ｻ・ｨ鬩穂ｼ夲ｽｽ・ｺ郢晢ｽｻ郢晢ｽｻ
            return NextResponse.json({
                text,
                remain: null,
                tier: planTier,
                highlights: allHighlights,
                truncated: limited.truncated || undefined
            })
        }

        // Top-up 髮趣ｽｸ鬩帙・・ｽ・ｲ繝ｻ・ｻ郢晢ｽｻ闔・･郢晢ｽｻ驛｢譎丞ｹｲ・主ｸｷ・ｹ譎｢・ｽ・ｳ髯ｷ闌ｨ・ｽ・ｱ鬯ｨ・ｾ陞｢・ｹ郢晢ｽｻ驛｢譎・ｽｼ譁青ｰ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ驛｢譎√・郢晢ｽ｣驛｢・ｧ繝ｻ・ｯ郢晢ｽｻ郢晢ｽｻ
        if (useTopup && userId) {
            const ok = await consumeOneTopup(sb, userId)
            if (!ok) {
                // 鬩包ｽｶ繝ｻ・ｶ髯ｷ・ｷ陋ｹ・ｻ邵ｲ螳夊・繝ｻ・ｨ髯溯ｶ｣・ｽ・ｫ驍ｵ・ｺ隶吝ｯゆｼｯ驍ｵ・ｺ闕ｳ蟯ｩ繝ｻ驍ｵ・ｺ繝ｻ・｣驍ｵ・ｺ雋・ｽｽ繝ｻ・ｭ郢晢ｽｻ
                return NextResponse.json({ error: 'No top-up balance', tier: planTier }, { status: 402 })
>>>>>>> deploy-test
            }
        }

<<<<<<< HEAD
=======
        // 驍ｵ・ｺ髦ｮ蜻ｻ・ｼ繝ｻ・ｸ・ｺ繝ｻ・ｫ髫ｴ螟ｲ・ｽ・･驛｢・ｧ闕ｵ譏ｴ繝ｻ驍ｵ・ｺ繝ｻ・ｯ Pro 驍ｵ・ｺ繝ｻ・ｰ驍ｵ・ｺ郢晢ｽｻuserId/redis 髴取ｻゑｽｽ・｡驍ｵ・ｺ驕会ｽｼ繝ｻ・ｭ陝ｲ・ｨ郢晢ｽｻ鬩墓･ｪﾂ驛｢・ｧ繝ｻ・ｱ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｹ
>>>>>>> deploy-test
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
