import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, font, radius, spacing } from "@/lib/theme";

interface Props {
    label: string;
    onPress?: () => void;
    variant?: "primary" | "outline" | "danger";
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
}

export function Button({ label, onPress, variant = "primary", loading, disabled, style }: Props) {
    const isPrimary = variant === "primary";
    const isDanger = variant === "danger";
    const bg = isPrimary ? colors.primary : "transparent";
    const borderColor = isDanger ? colors.red : colors.border;
    const textColor = isPrimary ? colors.white : isDanger ? colors.red : colors.text;

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.base,
                { backgroundColor: bg, borderColor, opacity: disabled || loading ? 0.6 : pressed ? 0.85 : 1 },
                variant !== "primary" && styles.bordered,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <Text style={[styles.label, { color: textColor }]}>{label}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: radius.md,
        paddingVertical: spacing.md + 2,
        paddingHorizontal: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    bordered: { borderWidth: 1 },
    label: { fontSize: font.md, fontWeight: "700" },
});
