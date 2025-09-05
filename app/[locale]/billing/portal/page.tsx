'use client'; // ← このページが hooks を使うなら必ず最上段に

import { useEffect, useState } from 'react';
import type { Metadata } from 'next'; // 使っていれば

type PageParams = { locale: string };
type PageSearchParams = Record<string, string | string[]>;

// .next/types の期待に合わせて Promise を許容（anyは使わない）
type PageProps = {
    params?: Promise<PageParams>;
    searchParams?: Promise<PageSearchParams>;
};

// 汎用ガード（any 不使用）
function isPromise<T>(v: unknown): v is Promise<T> {
    return !!v && typeof v === 'object' && 'then' in (v as Record<string, unknown>);
}

export default function LocaleTopPage(_props: PageProps) {
    const [locale, setLocale] = useState<string>('en');
    const [sp, setSp] = useState<PageSearchParams>({});

    useEffect(() => {
        const p = _props.params as unknown;
        if (isPromise<PageParams>(p)) {
            p.then(v => { if (v?.locale) setLocale(v.locale); }).catch(() => { });
        }

        const s = _props.searchParams as unknown;
        if (isPromise<PageSearchParams>(s)) {
            s.then(obj => { if (obj && typeof obj === 'object') setSp(obj); }).catch(() => { });
        }
    }, [_props.params, _props.searchParams]);

    // ここで locale / sp を使ってUIを描画
    return <main>home ({locale})</main>;
}
