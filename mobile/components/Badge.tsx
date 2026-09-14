import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, font, radius } from "@/lib/theme";

type Tone = "primary" | "green" | "red" | "yellow" | "gray";

const tones: Record<Tone, { bg: string; fg: string }> = {
    primary: { bg: colors.primaryTint, fg: colors.primary },
    green: { bg: colors.greenBg, fg: colors.green },
    red: { bg: colors.redBg, fg: colors.red },
    yellow: { bg: colors.yellowBg, fg: colors.yellow },
    gray: { bg: "#f3f4f6", fg: colors.subtext },
};

export function Badge({ label, tone = "gray" }: { label: string; tone?: Tone }) {
    const t = tones[tone];
    return (
        <View style={[styles.badge, { backgroundColor: t.bg }]}>
            <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
    text: { fontSize: font.xs, fontWeight: "700" },
});
