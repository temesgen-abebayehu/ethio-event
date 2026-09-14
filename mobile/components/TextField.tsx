import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius, spacing } from "@/lib/theme";

interface Props extends TextInputProps {
    label?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    secure?: boolean;
}

export function TextField({ label, icon, secure, style, ...rest }: Props) {
    const [hidden, setHidden] = useState(!!secure);

    return (
        <View style={styles.wrap}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <View style={styles.field}>
                {icon ? <Ionicons name={icon} size={18} color={colors.muted} style={styles.leftIcon} /> : null}
                <TextInput
                    placeholderTextColor={colors.muted}
                    secureTextEntry={hidden}
                    style={[styles.input, icon ? { paddingLeft: 38 } : null, secure ? { paddingRight: 40 } : null, style]}
                    {...rest}
                />
                {secure ? (
                    <Pressable onPress={() => setHidden((h) => !h)} style={styles.rightIcon} hitSlop={8}>
                        <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={colors.muted} />
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginBottom: spacing.md },
    label: { fontSize: font.sm, fontWeight: "600", color: colors.text, marginBottom: 6 },
    field: { justifyContent: "center" },
    input: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: font.md,
        color: colors.text,
    },
    leftIcon: { position: "absolute", left: 12, zIndex: 1 },
    rightIcon: { position: "absolute", right: 12 },
});
