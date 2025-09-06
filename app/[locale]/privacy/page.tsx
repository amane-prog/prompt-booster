// app/[locale]/privacy/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

type Props = { params: { locale: string } }

// ロケールごとに <title> を切り替え
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const t = await getTranslations({ locale: params.locale, namespace: 'legal.privacy' })
    const title =
        (t.has?.('title') && t('title')) ||
        (params.locale === 'ja' ? 'プライバシーポリシー' : 'Privacy Policy')
    return { title: `${title} | Prompt Booster` }
}

// サーバーコンポーネントは同期でOK（await不要）
export default function PrivacyPage({ params }: Props) {
    const isJA = params.locale === 'ja'

    return (
        <main className="prose mx-auto max-w-3xl px-4 py-10">
            {isJA ? (
                <>
                    <h1>プライバシーポリシー</h1>
                    <p>
                        本ポリシーは、Prompt Booster（以下「当社」）による情報の取扱いを説明するものです。
                        当社は、UUID によるアカウント識別など、個人データの最小化に努めます。認証は Supabase、決済は Stripe を利用します。
                    </p>

                    <h2>1. 取扱う情報</h2>
                    <ul>
                        <li>アカウント識別子: UUID、セッションメタデータ。メールアドレスは当社DBに保存しません。</li>
                        <li>認証: Supabase がマジックリンクメールを送付・保管。当社は Supabase から UUID を参照します。</li>
                        <li>請求: Stripe が決済情報を処理し、領収のためにメールを保持する場合があります。当社は Stripe のID（例: customer/subscription）を保持しますがカード番号は保持しません。</li>
                        <li>利用メトリクス・ログ: リクエスト数、タイムスタンプ、プラン、アドオン消費。セキュリティ目的の限定的な技術ログ（IP, UA等）。</li>
                        <li>プロンプトと出力: サービス提供のために処理します。当社は学習には利用しません（モデル提供者は返答生成のために処理）。</li>
                        <li>クォータ保存: 日次カウンタは Redis に TTL 付きで保存。未認証時は Cookie に保持する場合あり。</li>
                        <li>Cookie/ローカルストレージ: セッション状態、クォータ、基本設定。広告表示時に広告事業者が独自 Cookie を利用する場合があります。</li>
                    </ul>

                    <h2>2. 利用目的</h2>
                    <ul>
                        <li>サービスの提供・運用（認証、処理、クォータ管理）。</li>
                        <li>請求・アカウント管理。</li>
                        <li>セキュリティ、不正防止、デバッグ。</li>
                        <li>法令遵守。</li>
                    </ul>

                    <h2>3. 法的根拠（GDPR等）</h2>
                    <ul>
                        <li>契約履行</li>
                        <li>正当な利益（セキュリティ、不正防止、可用性維持）</li>
                        <li>法的義務の履行</li>
                        <li>同意（例: 一部 Cookie/広告）</li>
                    </ul>

                    <h2>4. 委託先・サブプロセッサ</h2>
                    <ul>
                        <li>Supabase（認証/DB）</li>
                        <li>Stripe（決済/請求）</li>
                        <li>Upstash Redis（日次クォータ）</li>
                        <li>OpenAI（推論）</li>
                        <li>ホスティング/CDN（例: Vercel/Cloudflare）</li>
                    </ul>

                    <h2>5. 保持期間</h2>
                    <ul>
                        <li>日次クォータは JST 深夜でリセット。</li>
                        <li>請求記録は法令に基づき保持。</li>
                        <li>運用ログは最小限の期間保持後に削除または匿名化。</li>
                    </ul>

                    <h2>6. セキュリティ</h2>
                    <p>通信の暗号化、アクセス制御、RLS等を使用します。完全な安全を保証するものではありませんが保護に努めます。</p>

                    <h2>7. 国際移転</h2>
                    <p>委託先が国外で処理する場合があります。必要に応じ適切な保護措置を講じます。</p>

                    <h2>8. お客様の権利</h2>
                    <p>
                        法令に基づき、データのアクセス・訂正・削除・処理制限を求めることができます。アカウントは UUID で識別されるため、Supabase セッションによる本人確認が必要になる場合があります。
                    </p>

                    <h2>9. 児童の利用</h2>
                    <p>
                        本サービスは、地域の年齢要件（例: 13歳/16歳）未満の児童を対象としていません。該当する場合は利用しないでください。
                    </p>

                    <h2>10. 変更</h2>
                    <p>本ポリシーは更新されることがあります。重要な変更は本ページで通知します。</p>

                    <h2>11. 連絡先</h2>
                    <p>amaneprizm@gmail.com</p>

                    <p className="text-sm text-neutral-500">最終更新日: 2025-09-03</p>
                </>
            ) : (
                <>
                    <h1>Privacy Policy</h1>
                    <p>
                        This Policy explains how Prompt Booster (“we”, “us”) processes information. We minimize personal data by identifying accounts with a UUID and not storing email addresses on our own servers. Authentication is provided by Supabase; payments by Stripe.
                    </p>

                    <h2>1. What We Process</h2>
                    <ul>
                        <li>Account identifiers: UUID, session metadata. We do not store email addresses in our database.</li>
                        <li>Authentication: Supabase handles Magic Link email delivery and related storage. We read your UUID from Supabase.</li>
                        <li>Billing: Stripe processes payment information and may store your email for receipts. We store Stripe IDs but not card numbers.</li>
                        <li>Usage metrics & logs: request counts, timestamps, plan/tier, add-on consumption; limited technical logs (IP, UA).</li>
                        <li>Prompts & outputs: processed to provide the Service. We do not use them for training (model providers may process for inference).</li>
                        <li>Quota storage: daily counters in Redis (TTL, reset at JST midnight); cookie fallback for unauthenticated users.</li>
                        <li>Cookies/local storage: session state, quota counters, preferences. Ads may use provider cookies.</li>
                    </ul>

                    <h2>2. Purposes</h2>
                    <ul>
                        <li>Provide and operate the Service.</li>
                        <li>Billing and account management.</li>
                        <li>Security, fraud prevention, debugging.</li>
                        <li>Legal compliance.</li>
                    </ul>

                    <h2>3. Legal Bases</h2>
                    <ul>
                        <li>Performance of a contract.</li>
                        <li>Legitimate interests (security, preventing abuse, availability).</li>
                        <li>Compliance with legal obligations.</li>
                        <li>Consent (e.g., cookies/ads).</li>
                    </ul>

                    <h2>4. Service Providers / Sub-processors</h2>
                    <ul>
                        <li>Supabase (auth, DB)</li>
                        <li>Stripe (payments)</li>
                        <li>Upstash Redis (quota)</li>
                        <li>OpenAI (inference)</li>
                        <li>Hosting/CDN (Vercel/Cloudflare)</li>
                    </ul>

                    <h2>5. Retention</h2>
                    <ul>
                        <li>Daily quotas reset at JST midnight.</li>
                        <li>Billing records retained per law.</li>
                        <li>Operational logs kept minimal, then deleted or anonymized.</li>
                    </ul>

                    <h2>6. Security</h2>
                    <p>We use encryption, access controls, RLS. No method is 100% secure but we strive to protect your data.</p>

                    <h2>7. International Transfers</h2>
                    <p>Providers may process data abroad with safeguards where required.</p>

                    <h2>8. Your Rights</h2>
                    <p>
                        You may request access, correction, deletion, or restriction of your data. Accounts are UUID-based, so verification may require an active Supabase session.
                    </p>

                    <h2>9. Children</h2>
                    <p>The Service is not directed to children under local minimum age (e.g., 13/16). Do not use if you do not meet the requirement.</p>

                    <h2>10. Updates</h2>
                    <p>We may update this Policy. Material changes will be posted here or otherwise notified.</p>

                    <h2>11. Contact</h2>
                    <p>amaneprizm@gmail.com</p>

                    <p className="text-sm text-neutral-500">Last updated: 2025-09-03</p>
                </>
            )}
        </main>
    )
}
