"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/endpoints";
import { useToast } from "@/lib/toast";
import { ApiError } from "@/lib/api";

function ResetForm() {
    const router = useRouter();
    const params = useSearchParams();
    const toast = useToast();
    const token = params.get("token") || "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const rules = [
        { label: "At least 8 characters", ok: password.length >= 8 },
        { label: "At least one uppercase letter", ok: /[A-Z]/.test(password) },
        { label: "At least one number or symbol", ok: /[0-9\W]/.test(password) },
    ];
    const allOk = rules.every((r) => r.ok);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!allOk) return setError("Please meet all password requirements.");
        if (password !== confirm) return setError("Passwords do not match.");
        setLoading(true);
        try {
            await api.resetPassword(token, password);
            toast.success("Password updated. Please log in.");
            router.push("/auth/login");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    const input =
        "w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-10 text-gray-900 placeholder-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30";
    const eye = "absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600";

    const EyeIcon = ({ open }: { open: boolean }) =>
        open ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
        ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        );

    return (
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <Link href="/auth/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Login
            </Link>

            <h1 className="text-center text-3xl font-bold text-gray-900">Reset Password</h1>
            <p className="mt-2 text-center text-gray-500">Please create a new password for your LocalEvent account.</p>

            {!token ? (
                <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">This reset link is invalid. Please request a new one.</p>
            ) : (
                <form onSubmit={onSubmit} className="mt-6 space-y-5 border-t border-gray-100 pt-6">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">New Password</label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={input} />
                            <button type="button" onClick={() => setShowPassword((v) => !v)} className={eye} aria-label={showPassword ? "Hide password" : "Show password"}>
                                <EyeIcon open={showPassword} />
                            </button>
                        </div>

                        <p className="mt-3 text-sm font-medium text-gray-600">Password must contain:</p>
                        <ul className="mt-2 space-y-1.5">
                            {rules.map((r) => (
                                <li key={r.label} className="flex items-center gap-2 text-sm">
                                    {r.ok ? (
                                        <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <span className="h-4 w-4 rounded-full border border-gray-300" />
                                    )}
                                    <span className={r.ok ? "text-gray-700" : "text-gray-400"}>{r.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <div className="relative">
                            <input type={showConfirm ? "text" : "password"} required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className={input} />
                            <button type="button" onClick={() => setShowConfirm((v) => !v)} className={eye} aria-label={showConfirm ? "Hide password" : "Show password"}>
                                <EyeIcon open={showConfirm} />
                            </button>
                        </div>
                    </div>

                    {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f7f7fd] px-4 py-12">
            <Suspense fallback={null}>
                <ResetForm />
            </Suspense>
        </div>
    );
}
