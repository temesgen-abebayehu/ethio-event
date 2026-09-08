"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

function initials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");
}

export function Navbar() {
    const { isAuthenticated, user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    // Only organizers and admins can create and manage events.
    const canManageEvents = user?.role === "organizer" || user?.role === "admin";

    const isActive = (path: string) =>
        path === "/" ? pathname === "/" : pathname.startsWith(path);

    const linkClass = (path: string) =>
        `hidden md:inline-block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive(path)
            ? "text-primary bg-primary/10"
            : "text-gray-600 hover:text-primary hover:bg-gray-100"
        }`;

    const handleLogout = () => {
        setMenuOpen(false);
        logout();
        router.push("/");
    };

    const menuItem = "flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50";

    return (
        <header className="sticky top-0 z-40 bg-white shadow-sm">
            <div className="container mx-auto flex items-center justify-between px-4 py-4">
                <Link href="/" className="text-2xl font-bold text-primary">
                    LocalEvent
                </Link>

                <nav className="flex items-center gap-1 md:gap-2">
                    <Link href="/" className={linkClass("/")}>
                        Browse
                    </Link>

                    {isAuthenticated ? (
                        <>
                            {canManageEvents && (
                                <Link href="/dashboard" className={linkClass("/dashboard")}>
                                    My Events
                                </Link>
                            )}
                            <Link href="/dashboard/bookmarks" className={linkClass("/dashboard/bookmarks")}>
                                Bookmarks
                            </Link>
                            <Link href="/dashboard/tickets" className={linkClass("/dashboard/tickets")}>
                                Tickets
                            </Link>

                            {/* Avatar dropdown */}
                            <div className="relative ml-2">
                                <button
                                    onClick={() => setMenuOpen((o) => !o)}
                                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-transparent transition hover:ring-primary/30"
                                    aria-label="Account menu"
                                >
                                    {user?.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        initials(user?.full_name ?? "U")
                                    )}
                                </button>

                                {menuOpen && (
                                    <>
                                        <button className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} aria-hidden tabIndex={-1} />
                                        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                                            <div className="border-b border-gray-100 px-4 py-3">
                                                <p className="truncate text-sm font-semibold text-gray-900">{user?.full_name}</p>
                                                <p className="truncate text-xs text-gray-500">{user?.email}</p>
                                            </div>
                                            <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)} className={menuItem}>
                                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                Profile &amp; Settings
                                            </Link>
                                            {user?.role === "admin" && (
                                                <Link href="/admin/analytics" onClick={() => setMenuOpen(false)} className={menuItem}>
                                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                                    Admin
                                                </Link>
                                            )}
                                            <button onClick={handleLogout} className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                                Log Out
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/auth/login"
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-primary"
                            >
                                Login
                            </Link>
                            <Link
                                href="/auth/signup"
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
