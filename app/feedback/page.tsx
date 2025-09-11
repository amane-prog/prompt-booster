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
                    name="entry.123456" // 郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ 郢晢ｽｻ繝ｻ・ｽt郢晢ｽｻ繝ｻ・ｽH郢晢ｽｻ繝ｻ・ｽ[郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ繝ｻ逕ｻ隱薙・・ｿ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ陟・ｽｲ繝ｻ・ｹ郢晢ｽｻ繝ｻ・ｽ繝ｻ繝ｻ・ｿ・ｮ郢晢ｽｻ繝ｻ・ｽ郢晢ｽｻ繝ｻ・ｽ
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
