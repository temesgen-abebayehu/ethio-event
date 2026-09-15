import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useToast } from "@/lib/toast";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { colors, font, spacing } from "@/lib/theme";

export default function ForgotPassword() {
    const router = useRouter();
    const toast = useToast();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        try {
            await api.forgotPassword(email.trim());
            setSent(true);
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Something went wrong.");
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

            <Text style={styles.title}>Forgot Password</Text>

            {sent ? (
                <View style={styles.notice}>
                    <Text style={styles.noticeText}>
                        If an account exists for {email}, a reset link has been sent. Open it, then reset your password.
                    </Text>
                    <Button label="Enter reset code" variant="outline" onPress={() => router.push("/(auth)/reset-password")} style={{ marginTop: spacing.md }} />
                </View>
            ) : (
                <>
                    <Text style={styles.sub}>Enter your email and we&apos;ll send a link to reset your password.</Text>
                    <TextField label="Email Address" icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="name@example.com" />
                    <Button label="Send Reset Link" onPress={submit} loading={loading} />
                </>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: spacing.lg },
    link: { color: colors.primary, fontWeight: "700", fontSize: font.sm },
    title: { fontSize: font.xxl, fontWeight: "800", color: colors.text, marginBottom: 6 },
    sub: { fontSize: font.md, color: colors.subtext, marginBottom: spacing.lg },
    notice: { backgroundColor: colors.greenBg, borderRadius: 12, padding: spacing.lg },
    noticeText: { color: colors.green, fontSize: font.sm },
});
