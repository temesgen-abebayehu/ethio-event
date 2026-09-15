import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { colors, font, spacing } from "@/lib/theme";

export default function Login() {
    const router = useRouter();
    const { setAuth } = useAuth();
    const toast = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        try {
            const res = await api.login({ email: email.trim(), password });
            await setAuth(res);
            router.replace("/(tabs)");
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.brand}>LocalEvent</Text>
                <Text style={styles.sub}>Welcome back — sign in to continue.</Text>
            </View>

            <TextField label="Email" icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" />
            <TextField label="Password" icon="lock-closed-outline" secure value={password} onChangeText={setPassword} placeholder="••••••••" />

            <Link href="/(auth)/forgot-password" asChild>
                <Pressable style={styles.forgot}>
                    <Text style={styles.link}>Forgot password?</Text>
                </Pressable>
            </Link>

            <Button label="Login" onPress={submit} loading={loading} />

            <View style={styles.footer}>
                <Text style={styles.muted}>Don&apos;t have an account? </Text>
                <Link href="/(auth)/signup" asChild>
                    <Pressable>
                        <Text style={styles.link}>Sign up</Text>
                    </Pressable>
                </Link>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: { alignItems: "center", marginTop: spacing.xxl, marginBottom: spacing.xl },
    brand: { fontSize: font.xxl + 8, fontWeight: "800", color: colors.primary },
    sub: { fontSize: font.md, color: colors.subtext, marginTop: 6 },
    forgot: { alignSelf: "flex-end", marginBottom: spacing.md },
    link: { color: colors.primary, fontWeight: "700", fontSize: font.sm },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
    muted: { color: colors.subtext, fontSize: font.sm },
});
