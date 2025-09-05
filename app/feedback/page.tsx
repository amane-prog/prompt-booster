export default function FeedbackPage() {
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
                    name="entry.123456" // ・ｽ・ｽ ・ｽt・ｽH・ｽ[・ｽ・ｽ・ｽﾉ搾ｿｽ・ｽ墲ｹ・ｽﾄ修・ｽ・ｽ
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
