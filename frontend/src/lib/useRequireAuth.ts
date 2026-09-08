"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

// useRequireAuth redirects to login when unauthenticated, and optionally
// enforces an admin or organizer role. Returns loading/ready state to gate on.
export function useRequireAuth(options?: { admin?: boolean; organizer?: boolean }) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    const roleOk =
        (!options?.admin || user?.role === "admin") &&
        (!options?.organizer || user?.role === "organizer" || user?.role === "admin");

    useEffect(() => {
        if (loading) return;
        if (!isAuthenticated) {
            router.replace("/auth/login");
        } else if (!roleOk) {
            router.replace("/");
        }
    }, [loading, isAuthenticated, roleOk, router]);

    const ready = !loading && isAuthenticated && roleOk;
    return { ready, loading, user };
}
