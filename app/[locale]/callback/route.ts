// app/[locale]/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { locale: string } }) {
    const url = new URL(req.url)
    return NextResponse.redirect(new URL(`/auth/callback${url.search}`, url.origin))
}
