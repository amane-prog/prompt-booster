"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OutOfBoostsDialog({
    open,
    onClose,
    watchAd,
}: {
    open: boolean;
    onClose: () => void;
    watchAd: () => Promise<void>;
}) {
    const router = useRouter();
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold">Out of boosts today 🚫</h2>
                <p className="mt-2 text-sm text-gray-600">
                    You’ve used all free boosts for today.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                        onClick={async () => {
                            await watchAd();
                            onClose();
                        }}
                        className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
                    >
                        Watch Ad (+1)
                    </button>
                    <button
                        onClick={() => router.push("/billing/checkout")}
                        className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                    >
                        Go Pro
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="mt-4 block w-full text-center text-xs text-gray-500 hover:underline"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
