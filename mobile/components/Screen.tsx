import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/lib/theme";

interface Props {
    children: React.ReactNode;
    scroll?: boolean;
    loading?: boolean;
    edges?: ("top" | "bottom" | "left" | "right")[];
    padded?: boolean;
}

// Screen wraps content in a safe area with the app background.
export function Screen({ children, scroll, loading, edges = ["top"], padded = true }: Props) {
    if (loading) {
        return (
            <SafeAreaView style={styles.safe} edges={edges}>
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    const inner = <View style={padded ? styles.padded : undefined}>{children}</View>;

    return (
        <SafeAreaView style={styles.safe} edges={edges}>
            {scroll ? (
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {inner}
                </ScrollView>
            ) : (
                inner
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { flexGrow: 1 },
    padded: { padding: spacing.lg },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
