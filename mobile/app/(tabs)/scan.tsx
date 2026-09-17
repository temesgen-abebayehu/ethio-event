import React, { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { formatDateTime } from "@/lib/format";
import { colors, font, radius, spacing } from "@/lib/theme";
import type { ScanResult } from "@/lib/types";

type Outcome = { kind: "success"; result: ScanResult } | { kind: "error"; message: string };

export default function Scan() {
    const toast = useToast();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanning, setScanning] = useState(false);
    const [checking, setChecking] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [manual, setManual] = useState("");
    const lock = useRef(false);

    const start = async () => {
        setOutcome(null);
        lock.current = false;
        if (!permission?.granted) {
            const res = await requestPermission();
            if (!res.granted) {
                toast.error("Camera permission is required to scan tickets.");
                return;
            }
        }
        setScanning(true);
    };

    const verify = async (code: string) => {
        setChecking(true);
        try {
            const result = await api.scanTicket(code);
            setOutcome({ kind: "success", result });
        } catch (e) {
            setOutcome({ kind: "error", message: e instanceof ApiError ? e.message : "Scan failed" });
        } finally {
            setChecking(false);
        }
    };

    // Stop the camera after the first decode, then verify — one scan per session.
    const onScanned = async ({ data }: { data: string }) => {
        if (lock.current) return;
        lock.current = true;
        setScanning(false);
        await verify(data);
    };

    const submitManual = async () => {
        const code = manual.trim();
        if (!code) return;
        setManual("");
        setScanning(false);
        await verify(code);
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Scan Tickets</Text>
                <Text style={styles.subtitle}>Tap Scan, point at a ticket QR, and check in the attendee.</Text>

                <View style={styles.box}>
                    {scanning ? (
                        <>
                            <CameraView
                                style={StyleSheet.absoluteFill}
                                facing="back"
                                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                                onBarcodeScanned={checking ? undefined : onScanned}
                            />
                            <View pointerEvents="none" style={styles.frame}>
                                <View style={[styles.corner, styles.tl]} />
                                <View style={[styles.corner, styles.tr]} />
                                <View style={[styles.corner, styles.bl]} />
                                <View style={[styles.corner, styles.br]} />
                            </View>
                        </>
                    ) : (
                        <View style={styles.placeholder}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="qr-code-outline" size={36} color={colors.primary} />
                            </View>
                            <Text style={styles.placeholderText}>{outcome ? "Camera is off" : "Camera is ready"}</Text>
                            {!outcome ? (
                                <Button label={checking ? "Checking…" : "Scan QR Code"} onPress={start} style={{ marginTop: spacing.md, paddingHorizontal: spacing.xl }} />
                            ) : null}
                        </View>
                    )}
                </View>

                {scanning ? (
                    <Button label="Stop Camera" variant="outline" onPress={() => setScanning(false)} style={{ marginTop: spacing.md }} />
                ) : null}

                {outcome ? (
                    <View style={[styles.result, outcome.kind === "success" ? styles.resultOk : styles.resultBad]}>
                        <View style={[styles.resultIcon, { backgroundColor: outcome.kind === "success" ? colors.green : colors.red }]}>
                            <Ionicons name={outcome.kind === "success" ? "checkmark" : "close"} size={28} color={colors.white} />
                        </View>
                        {outcome.kind === "success" ? (
                            <>
                                <Text style={[styles.resultTitle, { color: colors.green }]}>Checked in</Text>
                                <Text style={styles.resultName}>{outcome.result.buyer_name}</Text>
                                <Text style={styles.resultMeta}>{outcome.result.quantity}x · {outcome.result.event_title}</Text>
                                <Text style={styles.resultTime}>{formatDateTime(outcome.result.scanned_at)}</Text>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.resultTitle, { color: colors.red }]}>Not valid</Text>
                                <Text style={styles.resultMeta}>{outcome.message}</Text>
                            </>
                        )}
                        <Button label="Scan Again" onPress={start} style={{ marginTop: spacing.md, paddingHorizontal: spacing.xl }} />
                    </View>
                ) : null}

                <View style={styles.manualCard}>
                    <Text style={styles.manualLabel}>Verify by code</Text>
                    <View style={styles.manualRow}>
                        <TextInput
                            value={manual}
                            onChangeText={setManual}
                            placeholder="Enter ticket code"
                            placeholderTextColor={colors.muted}
                            autoCapitalize="none"
                            style={styles.manualInput}
                        />
                        <Button label="Check In" onPress={submitManual} loading={checking} style={{ paddingHorizontal: spacing.lg }} />
                    </View>
                    <Text style={styles.manualHint}>Type or paste the ticket code if the camera isn&apos;t available.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    title: { fontSize: font.xxl, fontWeight: "800", color: colors.text },
    subtitle: { fontSize: font.sm, color: colors.subtext, marginTop: 2, marginBottom: spacing.lg },
    box: {
        aspectRatio: 1,
        width: "100%",
        borderRadius: radius.lg,
        overflow: "hidden",
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: colors.border,
    },
    placeholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", gap: 8 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center" },
    placeholderText: { color: colors.subtext, fontSize: font.sm },
    frame: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, margin: 28 },
    corner: { position: "absolute", width: 36, height: 36, borderColor: "rgba(255,255,255,0.9)" },
    tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
    tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
    br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },
    result: { alignItems: "center", borderRadius: radius.lg, borderWidth: 1, padding: spacing.xl, marginTop: spacing.lg },
    resultOk: { backgroundColor: colors.greenBg, borderColor: "#bbf7d0" },
    resultBad: { backgroundColor: colors.redBg, borderColor: "#fecaca" },
    resultIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
    resultTitle: { fontSize: font.lg, fontWeight: "800" },
    resultName: { fontSize: font.md, fontWeight: "700", color: colors.text, marginTop: 4 },
    resultMeta: { fontSize: font.sm, color: colors.subtext, marginTop: 2, textAlign: "center" },
    resultTime: { fontSize: font.xs, color: colors.muted, marginTop: 2 },
    manualCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl },
    manualLabel: { fontSize: font.sm, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
    manualRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    manualInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: font.md,
        color: colors.text,
    },
    manualHint: { fontSize: font.xs, color: colors.muted, marginTop: spacing.sm },
});
