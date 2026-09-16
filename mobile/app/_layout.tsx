import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ToastProvider } from "@/lib/toast";
import { Loading } from "@/components/Loading";
import { colors } from "@/lib/theme";

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function RootNav() {
    const { loading } = useAuth();
    if (loading) return <Loading />;
    return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
                <AuthProvider>
                    <ToastProvider>
                        <StatusBar style="dark" />
                        <RootNav />
                    </ToastProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </QueryClientProvider>
    );
}
