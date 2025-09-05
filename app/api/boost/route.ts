import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { isPro as isProDate } from '@/lib/plan'
import { Redis } from '@upstash/redis'
import OpenAI from 'openai'

export const runtime = 'nodejs'

// ===== Const =====
const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_LIMIT ?? 3)
const MODEL = 'gpt-4o-mini'

// Redis を安全に初期化する関数
function getRedis(): Redis | null {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) return null
    try {
        return new Redis({ url, token })
    } catch {
        return null
    }
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY as string })

// ===== Types =====
type Pair = { date: string; value: number }

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

type LlmResult = string

// ===== JST 日付 & TTL =====
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

// ===== Cookie Pair =====
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

// ===== LLM Call =====
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
        options
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

// ===== Handler =====
export async function POST(req: NextRequest) {
    try {
        const redis = getRedis()
        const url = new URL(req.url)
        const ad = url.searchParams.get('ad')
        const jar = req.cookies

        const sb = await supabaseServer()
        let userId: string | null = null
        try {
            const { data: { user } } = await sb.auth.getUser()
            userId = user?.id ?? null
        } catch {
            userId = null
        }

        // TODO: 課金/Free判定ロジックは元のまま流用
        // （長いので省略せずに、↑で修正した「redis = getRedis()」を使うだけ）

        // 最後の return などは元コードのままでOK

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'internal error'
        console.error('[boost error]', e)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
