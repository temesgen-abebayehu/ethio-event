"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { tokenStore } from "./api";
import { api } from "./endpoints";
import type { AuthResponse, User } from "./types";

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    setAuth: (res: AuthResponse) => void;
    setUser: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tokenStore.get()) {
            setLoading(false);
            return;
        }
        api
            .me()
            .then(setUser)
            .catch(() => {
                tokenStore.clear();
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const setAuth = (res: AuthResponse) => {
        tokenStore.set(res.access_token);
        setUser(res.user);
    };

    const logout = () => {
        tokenStore.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, isAuthenticated: !!user, setAuth, setUser, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
