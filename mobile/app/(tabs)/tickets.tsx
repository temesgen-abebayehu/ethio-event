import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { EmptyState, Loading } from "@/components/Loading";
import { Badge } from "@/components/Badge";
import { formatDateTime, priceLabel } from "@/lib/format";
import { colors, font, radius, spacing } from "@/lib/theme";
import type { Order } from "@/lib/types";

export default function Tickets() {
    const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ["my-tickets"], queryFn: api.myTickets });
    const orders = data ?? [];

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <Loading />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <FlatList
                data={orders}
                keyExtractor={(o) => o.id}
                ListHeaderComponent={<Text style={styles.title}>My Tickets</Text>}
                renderItem={({ item }) => <TicketCard order={item} />}
                contentContainerStyle={styles.list}
                onRefresh={refetch}
                refreshing={isRefetching}
                ListEmptyComponent={<EmptyState icon="ticket-outline" title="No tickets yet" subtitle="Buy tickets to see them here." />}
            />
        </SafeAreaView>
    );
}

function TicketCard({ order }: { order: Order }) {
    const past = order.event?.time_status === "past";
    const orderRef = `#LE-${order.id.slice(0, 8).toUpperCase()}`;

    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    <Badge
                        label={order.scanned_at ? "Checked In" : past ? "Past Event" : order.status === "completed" ? "Completed" : order.status}
                        tone={order.scanned_at ? "green" : past ? "gray" : order.status === "completed" ? "primary" : order.status === "pending" ? "yellow" : "red"}
                    />
                    <Text style={styles.eventTitle}>{order.event?.title ?? "Event"}</Text>
                    {order.event ? (
                        <>
                            <Row icon="calendar-outline" text={formatDateTime(order.event.event_date)} />
                            <Row icon="location-outline" text={order.event.venue} />
                        </>
                    ) : null}
                    <Row icon="pricetag-outline" text={`${orderRef} · ${order.quantity}x`} />
                </View>

                <View style={styles.qrWrap}>
                    {order.scanned_at ? (
                        <View style={[styles.qrBox, { backgroundColor: colors.greenBg }]}>
                            <Ionicons name="checkmark-circle" size={40} color={colors.green} />
                            <Text style={[styles.qrLabel, { color: colors.green }]}>Checked In</Text>
                        </View>
                    ) : past ? (
                        <View style={[styles.qrBox, { backgroundColor: "#f3f4f6" }]}>
                            <Ionicons name="time-outline" size={40} color={colors.muted} />
                            <Text style={styles.qrLabel}>Ended</Text>
                        </View>
                    ) : order.status === "completed" ? (
                        <View style={styles.qrCode}>
                            <QRCode value={`LE-TICKET:${order.id}`} size={104} />
                        </View>
                    ) : (
                        <View style={[styles.qrBox, { backgroundColor: colors.yellowBg }]}>
                            <Ionicons name="hourglass-outline" size={40} color={colors.yellow} />
                            <Text style={[styles.qrLabel, { color: colors.yellow }]}>{order.status}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.footerMuted}>Purchased {formatDateTime(order.created_at)}</Text>
                <Text style={styles.price}>{priceLabel(order.total_price)}</Text>
            </View>
        </View>
    );
}

function Row({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
    return (
        <View style={styles.row}>
            <Ionicons name={icon} size={14} color={colors.muted} />
            <Text style={styles.rowText} numberOfLines={1}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
    title: { fontSize: font.xxl, fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
    card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, overflow: "hidden" },
    cardTop: { flexDirection: "row", padding: spacing.lg, gap: spacing.md },
    eventTitle: { fontSize: font.lg, fontWeight: "800", color: colors.text, marginTop: 6, marginBottom: 4 },
    row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
    rowText: { fontSize: font.sm, color: colors.subtext, flexShrink: 1 },
    qrWrap: { alignItems: "center", justifyContent: "center" },
    qrCode: { padding: 8, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    qrBox: { width: 120, height: 120, borderRadius: radius.md, alignItems: "center", justifyContent: "center", gap: 4 },
    qrLabel: { fontSize: font.xs, fontWeight: "700", color: colors.muted },
    cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    footerMuted: { fontSize: font.xs, color: colors.muted },
    price: { fontSize: font.lg, fontWeight: "800", color: colors.primary },
});
