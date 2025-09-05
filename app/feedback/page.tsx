// app/feedback/page.tsx

// .next/types の checkFields が Promise<any> を期待しているので Promise 互換に調整
type PageProps = {
    params?: Promise<Record<string, string | string[]>>;
    searchParams?: Promise<Record<string, string | string[]>>;
};

export default function FeedbackPage(_props: PageProps) {
    return (
        <div className="mx-auto max-w-2xl p-6">
            <h1 className="text-xl font-semibold">Feedback</h1>
            <p className="mt-2 text-sm text-gray-600">
                Tell us what to improve. We read every message.
            </p>
            <form
                className="mt-4 grid gap-3"
                action="https://docs.google.com/forms/d/e/xxxxxxxxxxxxxxxxxx/formResponse"
                method="POST"
                target="_blank"
            >
                <textarea
                    name="entry.123456" // ← Google Forms の input name を差し替え
                    required
                    className="min-h-40 w-full rounded-lg border p-3"
                    placeholder="Your message..."
                />
                <button
                    type="submit"
                    className="rounded-lg bg-black px-4 py-2 text-white"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
