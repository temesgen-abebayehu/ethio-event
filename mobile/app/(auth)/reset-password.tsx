import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useToast } from "@/lib/toast";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { colors, font, spacing } from "@/lib/theme";

export default function ResetPassword() {
    const router = useRouter();
    const toast = useToast();
    const params = useLocalSearchParams<{ token?: string }>();
    const [token, setToken] = useState(params.token ?? "");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (password !== confirm) return toast.error("Passwords do not match.");
        setLoading(true);
        try {
            await api.resetPassword(token.trim(), password);
            toast.success("Password updated. Please log in.");
            router.replace("/(auth)/login");
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen scroll>
            <Link href="/(auth)/login" asChild>
                <Pressable style={styles.back}>
                    <Ionicons name="chevron-back" size={18} color={colors.primary} />
                    <Text style={styles.link}>Back to login</Text>
                </Pressable>
            </Link>

            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.sub}>Paste the reset code from your email and set a new password.</Text>

            <TextField label="Reset Code" icon="key-outline" autoCapitalize="none" value={token} onChangeText={setToken} placeholder="Paste code" />
            <TextField label="New Password" icon="lock-closed-outline" secure value={password} onChangeText={setPassword} placeholder="••••••••" />
            <TextField label="Confirm New Password" icon="lock-closed-outline" secure value={confirm} onChangeText={setConfirm} placeholder="••••••••" />

            <Button label="Update Password" onPress={submit} loading={loading} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: spacing.lg },
    link: { color: colors.primary, fontWeight: "700", fontSize: font.sm },
    title: { fontSize: font.xxl, fontWeight: "800", color: colors.text, marginBottom: 6 },
    sub: { fontSize: font.md, color: colors.subtext, marginBottom: spacing.lg },
});
