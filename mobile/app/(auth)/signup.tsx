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
import { colors, font, radius, spacing } from "@/lib/theme";

export default function Signup() {
    const router = useRouter();
    const { setAuth } = useAuth();
    const toast = useToast();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"user" | "organizer">("user");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (password !== confirm) return toast.error("Passwords do not match.");
        setLoading(true);
        try {
            const res = await api.signup({ full_name: fullName.trim(), email: email.trim(), password, role });
            await setAuth(res);
            router.replace("/(tabs)");
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Signup failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen scroll>
            <View style={styles.header}>
                <Text style={styles.brand}>LocalEvent</Text>
                <Text style={styles.sub}>Join the community.</Text>
            </View>

            <TextField label="Full Name" icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="Abebe Bikila" />
            <TextField label="Email" icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="name@example.com" />

            <Text style={styles.label}>Role</Text>
            <View style={styles.segment}>
                {(["user", "organizer"] as const).map((r) => (
                    <Pressable key={r} onPress={() => setRole(r)} style={[styles.segItem, role === r && styles.segActive]}>
                        <Text style={[styles.segText, role === r && styles.segTextActive]}>{r === "user" ? "User" : "Organizer"}</Text>
                    </Pressable>
                ))}
            </View>

            <TextField label="Password" icon="lock-closed-outline" secure value={password} onChangeText={setPassword} placeholder="••••••••" />
            <Text style={styles.hint}>Minimum 8 characters, with a letter and a number.</Text>
            <TextField label="Confirm Password" icon="lock-closed-outline" secure value={confirm} onChangeText={setConfirm} placeholder="••••••••" />

            <Button label="Sign Up" onPress={submit} loading={loading} />

            <View style={styles.footer}>
                <Text style={styles.muted}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                    <Pressable>
                        <Text style={styles.link}>Login</Text>
                    </Pressable>
                </Link>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: { alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.lg },
    brand: { fontSize: font.xxl + 4, fontWeight: "800", color: colors.primary },
    sub: { fontSize: font.md, color: colors.subtext, marginTop: 4 },
    label: { fontSize: font.sm, fontWeight: "600", color: colors.text, marginBottom: 6 },
    segment: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: radius.md, padding: 4, marginBottom: spacing.md },
    segItem: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, borderRadius: radius.sm },
    segActive: { backgroundColor: colors.white },
    segText: { fontWeight: "600", color: colors.subtext },
    segTextActive: { color: colors.primary },
    hint: { fontSize: font.xs, color: colors.muted, marginTop: -6, marginBottom: spacing.md },
    link: { color: colors.primary, fontWeight: "700", fontSize: font.sm },
    footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
    muted: { color: colors.subtext, fontSize: font.sm },
});
