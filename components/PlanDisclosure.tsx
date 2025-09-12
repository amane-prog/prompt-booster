'use client'

import type { MouseEventHandler } from 'react'

export default function PlanDisclosure({
    onGoPro,
    onGoProPlus,
}: {
    onGoPro?: MouseEventHandler<HTMLButtonElement>
    onGoProPlus?: MouseEventHandler<HTMLButtonElement>
}) {
    return (
        <section className="rounded-2xl border bg-white p-4">
            <h3 className="mb-3 text-sm font-medium">プラン比較</h3>

            <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                    <caption className="sr-only">プラン比較表</caption>
                    <thead>
                        <tr className="[&>th]:border [&>th]:px-2 [&>th]:py-1 bg-neutral-50 text-left">
                            <th>プラン</th>
                            <th>料金</th>
                            <th>月リクエスト上限</th>
                            <th>追加パック</th>
                            <th>備考</th>
                            <th>特典</th>
                        </tr>
                    </thead>
                    <tbody className="[&>tr>td]:border [&>tr>td]:px-2 [&>tr>td]:py-2">
                        <tr>
                            <td>Free</td>
                            <td>無料</td>
                            <td>1日3回</td>
                            <td>500リクエストまで</td>
                            <td>メール認証のみ / +1日Pro体験付き</td>
                            <td>広告表示あり</td>
                        </tr>
                        <tr>
                            <td>Pro</td>
                            <td>$3/月</td>
                            <td>月 1,000回</td>
                            <td>500リクエストごと追加購入可</td>
                            <td>広告なし</td>
                            <td>+$5で+1,000リクエスト</td>
                        </tr>
                        <tr>
                            <td>Pro+</td>
                            <td>$5/月</td>
                            <td>月 1,000回（優先実行）</td>
                            <td>2,000リクエストまで追加可</td>
                            <td>広告なし</td>
                            <td>+$5で+1,000リクエスト</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-3 flex gap-2">
                {onGoPro && (
                    <button
                        onClick={onGoPro}
                        className="rounded bg-blue-600 px-3 py-1 text-xs text-white"
                    >
                        Proにアップグレード
                    </button>
                )}
                {onGoProPlus && (
                    <button
                        onClick={onGoProPlus}
                        className="rounded border px-3 py-1 text-xs"
                    >
                        Pro+にアップグレード ($5/月)
                    </button>
                )}
            </div>

            <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-neutral-500">
                <li>料金はUSD換算（Stripeで処理）</li>
                <li>FreeはJST基準で毎日リセット</li>
                <li>Pro/Pro+は月額サブスクリプション</li>
                <li>追加パックは+1,000リクエストごとに+$5</li>
                <li>仕様は予告なく変更される可能性あり</li>
            </ol>

            <div className="mt-2 text-right text-[11px] text-neutral-400">
                Last Update: 2025-08-29
            </div>
        </section>
    )
}
