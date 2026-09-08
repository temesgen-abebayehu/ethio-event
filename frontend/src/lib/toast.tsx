"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";
interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const push = useCallback((message: string, type: ToastType) => {
        const id = Date.now() + Math.random();
        setToasts((t) => [...t, { id, message, type }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    }, []);

    const value: ToastContextValue = {
        success: (m) => push(m, "success"),
        error: (m) => push(m, "error"),
        info: (m) => push(m, "info"),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`animate-slide-up rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${t.type === "success"
                                ? "bg-green-600"
                                : t.type === "error"
                                    ? "bg-red-600"
                                    : "bg-gray-800"
                            }`}
                    >
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
