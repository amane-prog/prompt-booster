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
            <h3 className="mb-3 text-sm font-medium">プラン一覧（重要事項表示）</h3>

            <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                    <caption className="sr-only">料金プランの比較表</caption>
                    <thead>
                        <tr className="[&>th]:border [&>th]:px-2 [&>th]:py-1 bg-neutral-50 text-left">
                            <th>プラン</th>
                            <th>月額</th>
                            <th>リクエスト上限</th>
                            <th>1回の最大文字数</th>
                            <th>広告</th>
                            <th>追加課金</th>
                        </tr>
                    </thead>
                    <tbody className="[&>tr>td]:border [&>tr>td]:px-2 [&>tr>td]:py-2">
                        <tr>
                            <td>Free</td>
                            <td>無料</td>
                            <td>1日3回</td>
                            <td>500文字</td>
                            <td>
                                バナー常時表示 /
                                <br />
                                動画視聴で+1回
                            </td>
                            <td>なし</td>
                        </tr>
                        <tr>
                            <td>Pro</td>
                            <td>$3/月</td>
                            <td>月1,000回</td>
                            <td>500文字</td>
                            <td>なし</td>
                            <td>+$5で+1,000回</td>
                        </tr>
                        <tr>
                            <td>Pro+</td>
                            <td>$5/月</td>
                            <td>月1,000回</td>
                            <td>2,000文字</td>
                            <td>なし</td>
                            <td>+$5で+1,000回</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 任意：CTA（Pro+は未実装なら隠す/無効化でもOK） */}
            <div className="mt-3 flex gap-2">
                {onGoPro && (
                    <button
                        onClick={onGoPro}
                        className="rounded bg-blue-600 px-3 py-1 text-xs text-white"
                        aria-label="Proにアップグレード"
                    >
                        Proにアップグレード
                    </button>
                )}
                {onGoProPlus && (
                    <button
                        onClick={onGoProPlus}
                        className="rounded border px-3 py-1 text-xs"
                        aria-label="Pro+にアップグレード"
                    >
                        Pro+（$5/月）
                    </button>
                )}
            </div>

            {/* 法令/運用向け脚注 */}
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-neutral-500">
                <li>表示価格はUSDです。為替換算・決済はStripeにより処理されます。</li>
                <li>サブスクリプションは月次で自動更新／いつでも解約可能（次回請求分から停止）。</li>
                <li>上限はFreeはJST区切り（日次）、有料プランは月次でリセットされます。</li>
                <li>追加パック（+$5, +1,000回）は当月内のみ有効・未使用分の繰越はありません。</li>
                <li>利用規約・プライバシーポリシーをご確認ください。</li>
            </ol>

            <div className="mt-2 text-right text-[11px] text-neutral-400">
                最終更新: 2025-08-29
            </div>
        </section>
    )
}
