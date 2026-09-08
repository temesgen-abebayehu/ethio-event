"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/endpoints";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuth();
    const toast = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await api.login({ email, password });
            setAuth(res);
            toast.success("Welcome back!");
            router.push("/");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const input =
        "w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30";
    const inputPw = input.replace("pr-3", "pr-10");

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f7fd] px-4 py-12">
            <div className="w-full max-w-md">

                <h1 className="mb-6 text-center text-5xl font-extrabold text-primary">LocalEvent</h1>

                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                    <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-primary">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Home
                    </Link>
                    <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
                    <p className="mt-1 text-gray-500">Please enter your details to sign in.</p>

                    <form onSubmit={onSubmit} className="mt-6 space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </span>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className={input} />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputPw} />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <div className="mt-2 text-right">
                                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
