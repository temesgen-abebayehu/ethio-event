import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, spacing } from "@/lib/theme";

export function Loading() {
    return (
        <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
        </View>
    );
}

export function EmptyState({ icon = "sad-outline", title, subtitle }: { icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
    return (
        <View style={styles.center}>
            <Ionicons name={icon} size={56} color={colors.border} />
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: 6 },
    title: { fontSize: font.lg, fontWeight: "700", color: colors.text, marginTop: spacing.sm },
    subtitle: { fontSize: font.sm, color: colors.subtext, textAlign: "center" },
});
