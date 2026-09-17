import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { Badge } from "@/components/Badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { initials, memberSince } from "@/lib/format";
import { colors, font, radius, spacing } from "@/lib/theme";

export default function Profile() {
    const router = useRouter();
    const { user, setUser, logout } = useAuth();
    const toast = useToast();

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");

    useEffect(() => {
        if (user) {
            setFullName(user.full_name);
            setPhone(user.phone ?? "");
            setCity(user.city ?? "");
        }
    }, [user]);

    const saveProfile = useMutation({
        mutationFn: () => api.updateProfile({ full_name: fullName, phone, city, avatar_url: user?.avatar_url ?? "" }),
        onSuccess: (u) => { setUser(u); toast.success("Profile updated"); },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update profile"),
    });

    const changePw = useMutation({
        mutationFn: () => api.changePassword({ current_password: current, new_password: next }),
        onSuccess: () => { toast.success("Password updated"); setCurrent(""); setNext(""); setConfirm(""); },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update password"),
    });

    const submitPw = () => {
        if (next !== confirm) return toast.error("New passwords do not match.");
        changePw.mutate();
    };

    const doLogout = async () => {
        await logout();
        router.replace("/(auth)/login");
    };

    if (!user) return null;
    const canManage = user.role === "organizer" || user.role === "admin";

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Profile &amp; Settings</Text>

                <View style={styles.card}>
                    <View style={styles.profileTop}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initials(user.full_name)}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <View style={styles.nameRow}>
                                <Text style={styles.name}>{user.full_name}</Text>
                                <Badge label={user.role} tone="primary" />
                            </View>
                            <Text style={styles.email}>{user.email}{city ? ` · ${city}` : ""}</Text>
                            {user.created_at ? <Text style={styles.since}>Member since {memberSince(user.created_at)}</Text> : null}
                        </View>
                    </View>
                </View>

                {canManage ? (
                    <Pressable style={styles.manageRow} onPress={() => router.push("/organizer")}>
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        <Text style={styles.manageText}>My Events</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                    </Pressable>
                ) : null}

                <View style={styles.card}>
                    <Text style={styles.section}>Personal Information</Text>
                    <TextField label="Full Name" value={fullName} onChangeText={setFullName} />
                    <TextField label="Email" value={user.email} editable={false} style={{ color: colors.muted }} />
                    <TextField label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+251 …" />
                    <TextField label="City / Location" value={city} onChangeText={setCity} placeholder="Addis Ababa" />
                    <Button label="Save Changes" onPress={() => saveProfile.mutate()} loading={saveProfile.isPending} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.section}>Security &amp; Password</Text>
                    <TextField label="Current Password" secure value={current} onChangeText={setCurrent} />
                    <TextField label="New Password" secure value={next} onChangeText={setNext} />
                    <TextField label="Confirm New Password" secure value={confirm} onChangeText={setConfirm} />
                    <Button label="Update Password" onPress={submitPw} loading={changePw.isPending} />
                </View>

                <Button label="Log Out" variant="danger" onPress={doLogout} style={{ marginTop: spacing.sm }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
    title: { fontSize: font.xxl, fontWeight: "800", color: colors.text },
    card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
    profileTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center" },
    avatarText: { color: colors.primary, fontWeight: "800", fontSize: font.xl },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    name: { fontSize: font.xl, fontWeight: "800", color: colors.text },
    email: { fontSize: font.sm, color: colors.subtext, marginTop: 2 },
    since: { fontSize: font.xs, color: colors.muted, marginTop: 2 },
    manageRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
    manageText: { flex: 1, fontSize: font.md, fontWeight: "700", color: colors.text },
    section: { fontSize: font.lg, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
});
