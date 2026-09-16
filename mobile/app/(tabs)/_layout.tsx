import React from "react";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

    const canManage = user?.role === "organizer" || user?.role === "admin";

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.muted,
                tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 },
                tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
            }}
        >
            <Tabs.Screen name="index" options={{ title: "Discover", tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} /> }} />
            <Tabs.Screen name="saved" options={{ title: "Saved", tabBarIcon: ({ color, size }) => <Ionicons name="bookmark-outline" color={color} size={size} /> }} />
            <Tabs.Screen
                name="scan"
                options={{
                    title: "Scan",
                    href: canManage ? undefined : null,
                    tabBarIcon: ({ color, size }) => <Ionicons name="qr-code-outline" color={color} size={size} />,
                }}
            />
            <Tabs.Screen name="tickets" options={{ title: "Tickets", tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" color={color} size={size} /> }} />
            <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
        </Tabs>
    );
}
