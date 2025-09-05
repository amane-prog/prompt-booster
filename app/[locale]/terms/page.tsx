// app/[locale]/terms/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | Prompt Booster'
};

export default function TermsPage({
    params: { locale }
}: { params: { locale: string } }) {
    const isJA = locale === 'ja';

    return (
        <main className="prose mx-auto max-w-3xl px-4 py-10">
            {isJA ? (
                <>
                    <h1>利用規約</h1>
                    <p>
                        本規約は、Prompt Booster（以下「本サービス」）の利用条件を定めるものです。
                        お客様は本サービスにアクセスまたは利用することにより、本規約に同意したものとみなされます。
                    </p>

                    <h2>1. 適用範囲・同意</h2>
                    <p>
                        お客様は、本規約を締結する法的能力を有しているものとします。組織を代表して利用する場合、当該組織を本規約に拘束する権限を有していることを表明します。
                    </p>

                    <h2>2. アカウント</h2>
                    <ul>
                        <li>サインインはマジックリンク方式です。サインイン用メールの管理はお客様の責任で行ってください。</li>
                        <li><strong>識別子:</strong> アカウント識別には UUID を用います。メールアドレスは当社の自社DBに保存しません（認証は Supabase を利用）。</li>
                        <li>不正利用、未払い、本規約違反などがある場合、アカウントを停止・終了することがあります。</li>
                    </ul>

                    <h2>3. プラン・追加パック・料金</h2>
                    <ul>
                        <li>提供プラン: <strong>Free / Pro / Pro+</strong>（各種上限・機能付き）。</li>
                        <li><strong>追加パック（Top-up）:</strong> <code>+300（$3）</code> および <code>+1000（$5）</code>。いずれのプランでも購入可能で、プラン上限に加算されます。</li>
                        <li>サブスクリプションは解約まで毎月自動更新。請求管理は Stripe カスタマーポータルから行えます。</li>
                        <li>税金・手数料が発生する場合があります。法令で義務づけられる場合を除き、原則として返金は行いません。</li>
                    </ul>

                    <h2>4. 利用上限・フェアユース</h2>
                    <ul>
                        <li>日次・月次の利用上限およびレート制限を適用します。自動化、複数アカウント、スクレイピング等による回避は禁止です。</li>
                        <li>本サービスの再販、競合データセットの構築、事前承諾のない負荷試験は禁止です。</li>
                    </ul>

                    <h2>5. 適切な利用</h2>
                    <ul>
                        <li>違法行為、知的財産権侵害、その他権利侵害は禁止です。</li>
                        <li>マルウェアやエクスプロイトの配布、リバースエンジニアリングや探査行為は禁止です。</li>
                        <li>適用法およびモデル提供者のポリシーに反する有害・不適切コンテンツの利用は禁止です。</li>
                    </ul>

                    <h2>6. お客様のコンテンツと出力</h2>
                    <ul>
                        <li>入力および出力の権利はお客様に帰属します。当社は本サービス運営に必要な範囲で処理する限定的ライセンスを許諾されたものとします。</li>
                        <li>出力は不正確または不完全な場合があります。最終的な確認・利用はお客様の責任で行ってください。</li>
                    </ul>

                    <h2>7. プライバシー</h2>
                    <p>
                        当社は個人データの最小化に努めます。詳細は
                        <a href="/privacy">プライバシーポリシー</a>
                        をご参照ください（Supabase による認証、Stripe による決済、Upstash Redis によるクォータ、OpenAI による推論、ホスティング等の利用を含みます）。
                    </p>

                    <h2>8. 免責事項</h2>
                    <p>
                        本サービスは「現状有姿」「提供可能な範囲」で提供されます。法の許す最大限の範囲で、明示黙示を問わず一切の保証を行いません。
                    </p>

                    <h2>9. 責任制限</h2>
                    <p>
                        法の許す最大限の範囲で、当社の総責任額は、（a）請求原因発生前3か月間にお客様が本サービスに支払った金額、または（b）20米ドルのいずれか高い方を上限とします。
                    </p>

                    <h2>10. 終了</h2>
                    <p>
                        お客様はいつでも利用を中止できます。当社は、本規約違反または運用・セキュリティ上の理由により、本サービスまたはお客様のアクセスを停止・終了することがあります。
                    </p>

                    <h2>11. 変更</h2>
                    <p>
                        当社は本規約を更新することがあります。重要な変更は本ページでの掲示その他の方法で通知します。
                    </p>

                    <h2>12. 準拠法</h2>
                    <p>
                        本規約は日本法を準拠法とします。専属的合意管轄は当社主たる事業所を管轄する裁判所とします（消費者保護法上の権利は影響を受けません）。
                    </p>

                    <p className="text-sm text-neutral-500">最終更新日: 2025-09-03</p>
                    <hr />
                    <p className="text-xs text-neutral-500">※本記載は利便性のための要約を含むことがあり、法的助言ではありません。</p>
                </>
            ) : (
                <>
                    <h1>Terms of Service</h1>
                    <p>
                        These Terms govern your use of Prompt Booster (the “Service”). By accessing or using the Service, you agree to these Terms.
                    </p>

                    <h2>1. Scope & Agreement</h2>
                    <p>
                        You must have the legal capacity to enter into this agreement. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization.
                    </p>

                    <h2>2. Accounts</h2>
                    <ul>
                        <li>Accounts are issued via Magic Link sign-in. Keep your sign-in email secure and do not share access.</li>
                        <li><strong>Identifier:</strong> We identify accounts by UUID. We do not store email addresses in our own database; authentication is provided by Supabase.</li>
                        <li>We may suspend or terminate accounts for misuse, non-payment, or violation of these Terms.</li>
                    </ul>

                    <h2>3. Plans, Add-ons & Fees</h2>
                    <ul>
                        <li>Available plans: <strong>Free / Pro / Pro+</strong> with corresponding usage limits and features.</li>
                        <li><strong>Add-ons (Top-up):</strong> one-time packs of <code>+300 ($3)</code> and <code>+1000 ($5)</code> requests. Add-ons are available on any plan and are applied on top of plan limits.</li>
                        <li>Subscriptions auto-renew monthly until canceled. Manage billing in the Stripe Customer Portal.</li>
                        <li>Taxes and fees may apply. Except where required by law, payments are non-refundable.</li>
                    </ul>

                    <h2>4. Usage Limits & Fair Use</h2>
                    <ul>
                        <li>We enforce daily/monthly limits and rate limits. Attempts to bypass limits (e.g., automation, multi-accounting, scraping) are prohibited.</li>
                        <li>Do not resell the Service, build a competing dataset, or run load tests without prior written consent.</li>
                    </ul>

                    <h2>5. Acceptable Use</h2>
                    <ul>
                        <li>No illegal activity, intellectual property infringement, or rights violations.</li>
                        <li>No malware, exploits, or attempts to reverse engineer or probe the Service.</li>
                        <li>No abusive, harmful, or prohibited content per applicable law and model providers’ policies.</li>
                    </ul>

                    <h2>6. Your Content & Outputs</h2>
                    <ul>
                        <li>You retain rights to your inputs and outputs. You grant us a limited license to process them to operate the Service.</li>
                        <li>Outputs may be inaccurate or incomplete. You are responsible for reviewing and using them appropriately.</li>
                    </ul>

                    <h2>7. Privacy</h2>
                    <p>
                        We minimize personal data. See our <a href="/privacy">Privacy Policy</a> for details (including the use of Supabase for auth, Stripe for payments, Upstash Redis for quotas, OpenAI for model inference, and our hosting provider).
                    </p>

                    <h2>8. Disclaimers</h2>
                    <p>
                        The Service is provided “as is” and “as available.” We disclaim all warranties to the maximum extent permitted by law.
                    </p>

                    <h2>9. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, our aggregate liability for all claims relating to the Service is limited to the greater of (a) the amounts you paid to us for the Service in the three (3) months before the claim arose, or (b) USD 20.
                    </p>

                    <h2>10. Termination</h2>
                    <p>
                        You may stop using the Service at any time. We may suspend or terminate the Service or your access if you breach these Terms or for operational/security reasons.
                    </p>

                    <h2>11. Changes</h2>
                    <p>
                        We may update these Terms. Material changes will be posted on this page or otherwise notified.
                    </p>

                    <h2>12. Governing Law</h2>
                    <p>
                        These Terms are governed by the laws of Japan. Venue is the court with jurisdiction over our principal place of business. Consumer protection rights under applicable laws remain unaffected.
                    </p>

                    <p className="text-sm text-neutral-500">Last updated: 2025-09-03</p>
                    <hr />
                    <p className="text-xs text-neutral-500">This summary is provided for convenience and is not legal advice.</p>
                </>
            )}
        </main>
    );
}
