"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { uploadFiles, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const inputCls =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30";

function initials(name: string) {
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export default function ProfilePage() {
    const { ready } = useRequireAuth();
    const { user, setUser, logout } = useAuth();
    const router = useRouter();
    const toast = useToast();
    const fileRef = useRef<HTMLInputElement>(null);

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [avatar, setAvatar] = useState<string | undefined>(undefined);
    const [uploading, setUploading] = useState(false);

    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [pwError, setPwError] = useState("");

    useEffect(() => {
        if (user) {
            setFullName(user.full_name);
            setPhone(user.phone ?? "");
            setCity(user.city ?? "");
            setAvatar(user.avatar_url);
        }
    }, [user]);

    const saveProfile = useMutation({
        mutationFn: () => api.updateProfile({ full_name: fullName, phone, city, avatar_url: avatar ?? "" }),
        onSuccess: (u) => {
            setUser(u);
            toast.success("Profile updated");
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update profile"),
    });

    const changePw = useMutation({
        mutationFn: () => api.changePassword({ current_password: current, new_password: next }),
        onSuccess: () => {
            toast.success("Password updated");
            setCurrent("");
            setNext("");
            setConfirm("");
            setPwError("");
        },
        onError: (e) => setPwError(e instanceof ApiError ? e.message : "Failed to update password"),
    });

    const onPhoto = async (files: FileList | null) => {
        if (!files?.[0]) return;
        setUploading(true);
        try {
            const res = await uploadFiles([files[0]]);
            const url = res.files[0]?.url;
            if (url) {
                setAvatar(url);
                const u = await api.updateProfile({ full_name: fullName, phone, city, avatar_url: url });
                setUser(u);
                toast.success("Photo updated");
            }
        } catch {
            toast.error("Photo upload failed");
        } finally {
            setUploading(false);
        }
    };

    const submitPw = (e: React.FormEvent) => {
        e.preventDefault();
        setPwError("");
        if (next !== confirm) return setPwError("New passwords do not match.");
        changePw.mutate();
    };

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    if (!ready || !user) return <LoadingSpinner className="py-24" />;

    const memberSince = user.created_at
        ? new Date(user.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
        : "";

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile &amp; Settings</h1>
            <p className="mb-6 text-gray-500">Manage your account details and preferences.</p>

            {/* Profile header */}
            <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                    <div className="relative">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-bold text-primary">
                            {avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                                initials(user.full_name)
                            )}
                        </div>
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow ring-2 ring-white transition hover:bg-primary-dark disabled:opacity-50"
                            aria-label="Change photo"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files)} />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                            <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">{user.role}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            {user.email}
                            {city ? ` • ${city}` : ""}
                        </p>
                        {memberSince && <p className="mt-1 text-xs text-gray-400">Member since {memberSince}</p>}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                        >
                            {uploading ? "Uploading..." : "Change Photo"}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Personal information */}
            <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-lg font-bold text-gray-900">Personal Information</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
                        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
                        <input value={user.email} disabled className={`${inputCls} cursor-not-allowed opacity-70`} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone Number</label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 ..." className={inputCls} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">City / Location</label>
                        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Addis Ababa" className={inputCls} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={() => {
                            setFullName(user.full_name);
                            setPhone(user.phone ?? "");
                            setCity(user.city ?? "");
                        }}
                        className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => saveProfile.mutate()}
                        disabled={saveProfile.isPending}
                        className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                    >
                        {saveProfile.isPending ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* Security */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-lg font-bold text-gray-900">Security &amp; Password</h3>
                <form onSubmit={submitPw} className="space-y-5">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Current Password</label>
                        <div className="relative">
                            <input type={showCurrent ? "text" : "password"} required value={current} onChange={(e) => setCurrent(e.target.value)} className={`${inputCls} pr-10`} />
                            <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600" aria-label="Toggle password">
                                <EyeIcon open={showCurrent} />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">New Password</label>
                            <div className="relative">
                                <input type={showNext ? "text" : "password"} required value={next} onChange={(e) => setNext(e.target.value)} className={`${inputCls} pr-10`} />
                                <button type="button" onClick={() => setShowNext((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600" aria-label="Toggle password">
                                    <EyeIcon open={showNext} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm New Password</label>
                            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
                        </div>
                    </div>

                    {pwError && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{pwError}</div>}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={changePw.isPending}
                            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-dark disabled:opacity-50"
                        >
                            {changePw.isPending ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
    ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}
