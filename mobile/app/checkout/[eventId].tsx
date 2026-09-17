import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { formatDateTime, priceLabel } from "@/lib/format";
import { colors, font, radius, spacing } from "@/lib/theme";

type Phase = "form" | "paying" | "verifying" | "done";

export default function Checkout() {
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const router = useRouter();
    const toast = useToast();

    const { data: event, isLoading } = useQuery({ queryKey: ["event", eventId], queryFn: () => api.event(eventId) });

    const [quantity, setQuantity] = useState(1);
    const [phase, setPhase] = useState<Phase>("form");
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const [txRef, setTxRef] = useState("");
    const [processing, setProcessing] = useState(false);

    if (isLoading || !event) {
        return (
            <SafeAreaView style={styles.safe}>
                <Loading />
            </SafeAreaView>
        );
    }

    const total = event.price * quantity;

    const pay = async () => {
        setProcessing(true);
        try {
            const res = await api.initiatePayment(event.id, quantity);
            if (res.checkout_url) {
                setTxRef(res.tx_ref);
                setCheckoutUrl(res.checkout_url);
                setPhase("paying");
            } else {
                // Free event — confirmed instantly.
                setPhase("done");
            }
        } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Payment failed");
        } finally {
            setProcessing(false);
        }
    };

    const onReturnFromChapa = async () => {
        setCheckoutUrl(null);
        setPhase("verifying");
        try {
            const order = await api.verifyPayment(txRef);
            if (order.status === "completed") setPhase("done");
            else {
                toast.error("Payment was not completed.");
                setPhase("form");
            }
        } catch {
            toast.error("Could not verify payment. Check My Tickets.");
            setPhase("form");
        }
    };

    // ---- Chapa payment WebView ----
    if (phase === "paying" && checkoutUrl) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.webHeader}>
                    <Pressable onPress={() => setPhase("form")} hitSlop={8}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </Pressable>
                    <Text style={styles.webTitle}>Pay with Chapa</Text>
                    <View style={{ width: 24 }} />
                </View>
                <WebView
                    source={{ uri: checkoutUrl }}
                    onShouldStartLoadWithRequest={(req) => {
                        if (req.url.includes("/payment/success")) {
                            onReturnFromChapa();
                            return false;
                        }
                        return true;
                    }}
                    startInLoadingState
                    renderLoading={() => <Loading />}
                />
            </SafeAreaView>
        );
    }

    if (phase === "verifying") {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <Loading />
                    <Text style={styles.verifying}>Verifying your payment…</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (phase === "done") {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <View style={styles.successRing}>
                        <View style={styles.successCircle}>
                            <Ionicons name="checkmark" size={34} color={colors.white} />
                        </View>
                    </View>
                    <Text style={styles.successTitle}>Payment Successful!</Text>
                    <Text style={styles.successSub}>Your tickets are confirmed.</Text>
                    <Button label="View My Tickets" onPress={() => router.replace("/(tabs)/tickets")} style={{ marginTop: spacing.xl, alignSelf: "stretch" }} />
                    <Pressable onPress={() => router.replace("/(tabs)")} style={{ marginTop: spacing.md }}>
                        <Text style={styles.link}>Browse more events</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    // ---- Checkout form ----
    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
                <Pressable onPress={() => router.back()} style={styles.back}>
                    <Ionicons name="chevron-back" size={20} color={colors.text} />
                    <Text style={styles.backText}>Back</Text>
                </Pressable>

                <Text style={styles.title}>Checkout</Text>

                <View style={styles.card}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventMeta}>{formatDateTime(event.event_date)}</Text>
                    <Text style={styles.eventMeta}>{event.venue}</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.qtyRow}>
                        <View>
                            <Text style={styles.qtyLabel}>General Admission</Text>
                            <Text style={styles.eventMeta}>{priceLabel(event.price)}</Text>
                        </View>
                        <View style={styles.stepper}>
                            <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))} style={styles.stepBtn}>
                                <Ionicons name="remove" size={18} color={colors.text} />
                            </Pressable>
                            <Text style={styles.qty}>{quantity}</Text>
                            <Pressable onPress={() => setQuantity((q) => Math.min(event.tickets_remaining, q + 1))} style={styles.stepBtn}>
                                <Ionicons name="add" size={18} color={colors.text} />
                            </Pressable>
                        </View>
                    </View>
                </View>

                <View style={[styles.card, { backgroundColor: colors.primaryTint }]}>
                    <Text style={styles.summaryTitle}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.eventMeta}>General Admission (x{quantity})</Text>
                        <Text style={styles.eventMeta}>{priceLabel(total)}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{priceLabel(total)}</Text>
                    </View>
                    <Text style={styles.secure}>🔒 Secure checkout powered by Chapa</Text>
                </View>

                <Button label={event.price === 0 ? "Get Tickets" : "Pay with Chapa"} onPress={pay} loading={processing} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
    back: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
    backText: { fontSize: font.md, color: colors.text },
    title: { fontSize: font.xxl, fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
    card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.lg },
    eventTitle: { fontSize: font.lg, fontWeight: "800", color: colors.text, marginBottom: 4 },
    eventMeta: { fontSize: font.sm, color: colors.subtext },
    qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    qtyLabel: { fontSize: font.md, fontWeight: "700", color: colors.text },
    stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
    stepBtn: { paddingHorizontal: 12, paddingVertical: 8 },
    qty: { minWidth: 32, textAlign: "center", fontWeight: "800", fontSize: font.md, color: colors.text },
    summaryTitle: { fontSize: font.md, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
    summaryDivider: { height: 1, backgroundColor: "rgba(99,102,241,0.2)", marginVertical: spacing.md },
    totalLabel: { fontSize: font.md, fontWeight: "800", color: colors.text },
    totalValue: { fontSize: font.xl, fontWeight: "800", color: colors.primary },
    secure: { fontSize: font.xs, color: colors.subtext, textAlign: "center", marginTop: spacing.md },
    webHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
    webTitle: { fontSize: font.md, fontWeight: "700", color: colors.text },
    verifying: { marginTop: spacing.md, color: colors.subtext },
    successRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center" },
    successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    successTitle: { fontSize: font.xl, fontWeight: "800", color: colors.text, marginTop: spacing.lg },
    successSub: { fontSize: font.md, color: colors.subtext, marginTop: 4 },
    link: { color: colors.primary, fontWeight: "700" },
});
