export default function Privacy() {
    return (
        <div className="prose mx-auto max-w-3xl p-6">
            <h1>Privacy Policy</h1>
            <p>Last updated: 2025-08-28</p>
            <h2>Data We Process</h2>
            <ul>
                <li>Account data (email via Supabase Auth)</li>
                <li>Billing status (Stripe) and pro_until</li>
                <li>Boost usage counts (Redis)</li>
            </ul>
            <h2>How We Use Data</h2>
            <p>
                To authenticate you, enforce quotas, and provide subscription features.
                We don�ft sell your personal data.
            </p>
            <h2>3rd Parties</h2>
            <p>Supabase (Auth/DB), Stripe (payments), OpenAI (API), Vercel (hosting).</p>
            <h2>Contact</h2>
            <p>Email: privacy@example.com</p>
        </div>
    );
}
