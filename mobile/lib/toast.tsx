import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors, font, radius, spacing } from "./theme";

type ToastType = "success" | "error" | "info";

interface ToastContextValue {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const opacity = useRef(new Animated.Value(0)).current;
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback(
        (message: string, type: ToastType) => {
            setToast({ message, type });
            Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => {
                Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setToast(null));
            }, 2800);
        },
        [opacity],
    );

    const value: ToastContextValue = {
        success: (m) => show(m, "success"),
        error: (m) => show(m, "error"),
        info: (m) => show(m, "info"),
    };

    const bg = toast?.type === "success" ? colors.green : toast?.type === "error" ? colors.red : "#1f2937";

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast && (
                <Animated.View pointerEvents="none" style={[styles.wrap, { opacity }]}>
                    <View style={[styles.toast, { backgroundColor: bg }]}>
                        <Text style={styles.text}>{toast.message}</Text>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

const styles = StyleSheet.create({
    wrap: { position: "absolute", left: 0, right: 0, bottom: 40, alignItems: "center", paddingHorizontal: spacing.xl },
    toast: { borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, maxWidth: 420 },
    text: { color: colors.white, fontSize: font.sm, fontWeight: "600", textAlign: "center" },
});
