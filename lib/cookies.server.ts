import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function getCookieHeader(): Promise<string | undefined> {
  const h = await headers();
  return h.get('cookie') ?? undefined;
}

export function parseCookieHeader(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.split('=');
    if (!k) continue;
    const key = k.trim();
    const value = rest.join('=').trim();
    if (key) out[key] = decodeURIComponent(value || '');
  }
  return out;
}

export async function getCookieValue(name: string, req?: NextRequest | Request): Promise<string | undefined> {
  const cookieStr = req ? req.headers.get('cookie') ?? undefined : await getCookieHeader();
  if (!cookieStr) return undefined;
  const parsed = parseCookieHeader(cookieStr);
  return parsed[name];
}
