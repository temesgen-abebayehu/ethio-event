"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await api.forgotPassword(email);
            setSent(true);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const input =
        "w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30";

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f7f7fd] px-4 py-12">
            <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <Link href="/auth/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to login
                </Link>

                <h1 className="text-3xl font-bold text-gray-900">Forgot Password</h1>

                {sent ? (
                    <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                        If an account exists for <span className="font-medium">{email}</span>, a reset link has been sent.
                    </p>
                ) : (
                    <>
                        <p className="mt-2 text-gray-500">Enter your email address and we will send you a link to reset your password.</p>
                        <form onSubmit={onSubmit} className="mt-6 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </span>
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={input} />
                                </div>
                            </div>

                            {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
