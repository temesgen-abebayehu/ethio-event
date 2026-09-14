import React, { createContext, useContext, useEffect, useState } from "react";
import { tokenStore } from "./api";
import { api } from "./endpoints";
import type { AuthResponse, User } from "./types";

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    setAuth: (res: AuthResponse) => Promise<void>;
    setUser: (user: User) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const token = await tokenStore.load();
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                setUser(await api.me());
            } catch {
                await tokenStore.clear();
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const setAuth = async (res: AuthResponse) => {
        await tokenStore.set(res.access_token);
        setUser(res.user);
    };

    const logout = async () => {
        await tokenStore.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, setAuth, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
