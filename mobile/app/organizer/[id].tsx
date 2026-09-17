import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/Badge";
import { EmptyState, Loading } from "@/components/Loading";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { formatDateTime, priceLabel } from "@/lib/format";
import { colors, font, radius, spacing } from "@/lib/theme";
import type { EventBuyer } from "@/lib/types";

export default function ManageEvent() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const toast = useToast();
    const qc = useQueryClient();

    const { data: event } = useQuery({ queryKey: ["event", id], queryFn: () => api.event(id) });
    const { data: buyers, isLoading } = useQuery({ queryKey: ["event-buyers", id], queryFn: () => api.eventBuyers(id) });

    const markAttended = useMutation({
        mutationFn: (orderId: string) => api.scanTicket(orderId),
        onSuccess: () => {
            toast.success("Attendee checked in");
            qc.invalidateQueries({ queryKey: ["event-buyers", id] });
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to check in"),
    });

    const completed = (buyers ?? []).filter((b) => b.status === "completed");
    const attended = completed.filter((b) => b.scanned_at).reduce((s, b) => s + b.quantity, 0);
    const sold = event?.ticket?.quantity_sold ?? 0;
    const revenue = (event?.price ?? 0) * sold;

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={{ padding: 2 }}>
                    <Ionicons name="chevron-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.title} numberOfLines={1}>{event?.title ?? "Event"}</Text>
                <View style={{ width: 22 }} />
            </View>

            <FlatList
                data={buyers ?? []}
                keyExtractor={(b) => b.order_id}
                ListHeaderComponent={
                    <View>
                        <Pressable style={styles.scanBtn} onPress={() => router.push("/(tabs)/scan")}>
                            <Ionicons name="qr-code-outline" size={18} color={colors.white} />
                            <Text style={styles.scanText}>Scan Tickets</Text>
                        </Pressable>

                        <View style={styles.stats}>
                            <Stat label="Sold" value={String(sold)} />
                            <Stat label="Attended" value={String(attended)} />
                            <Stat label="Revenue" value={priceLabel(revenue)} />
                        </View>

                        <Text style={styles.section}>Ticket Buyers</Text>
                    </View>
                }
                renderItem={({ item }) => <BuyerRow buyer={item} onMark={() => markAttended.mutate(item.order_id)} marking={markAttended.isPending} />}
                contentContainerStyle={styles.list}
                ListEmptyComponent={isLoading ? <Loading /> : <EmptyState icon="people-outline" title="No buyers yet" />}
            />
        </SafeAreaView>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.stat}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function BuyerRow({ buyer, onMark, marking }: { buyer: EventBuyer; onMark: () => void; marking: boolean }) {
    const canAttend = buyer.status === "completed" && !buyer.scanned_at;
    return (
        <View style={styles.buyer}>
            <View style={{ flex: 1 }}>
                <Text style={styles.buyerName}>{buyer.buyer_name}</Text>
                <Text style={styles.buyerMeta}>{buyer.buyer_email}</Text>
                <Text style={styles.buyerMeta}>{buyer.quantity}x · {priceLabel(buyer.total_price)} · {formatDateTime(buyer.created_at)}</Text>
            </View>
            <View style={styles.buyerRight}>
                {buyer.status === "completed" ? (
                    buyer.scanned_at ? (
                        <Badge label="Attended" tone="green" />
                    ) : (
                        <Pressable onPress={onMark} disabled={marking} style={styles.markBtn}>
                            <Text style={styles.markText}>Mark Attended</Text>
                        </Pressable>
                    )
                ) : (
                    <Badge label={buyer.status} tone={buyer.status === "pending" ? "yellow" : "red"} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    title: { flex: 1, textAlign: "center", fontSize: font.lg, fontWeight: "800", color: colors.text, marginHorizontal: spacing.sm },
    list: { padding: spacing.lg, paddingTop: 0, flexGrow: 1 },
    scanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, marginBottom: spacing.lg },
    scanText: { color: colors.white, fontWeight: "800", fontSize: font.md },
    stats: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
    stat: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: "center" },
    statValue: { fontSize: font.lg, fontWeight: "800", color: colors.text },
    statLabel: { fontSize: font.xs, color: colors.subtext, marginTop: 2 },
    section: { fontSize: font.lg, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
    buyer: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
    buyerName: { fontSize: font.md, fontWeight: "700", color: colors.text },
    buyerMeta: { fontSize: font.xs, color: colors.subtext, marginTop: 2 },
    buyerRight: { alignItems: "flex-end" },
    markBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
    markText: { fontSize: font.xs, fontWeight: "700", color: colors.text },
});
