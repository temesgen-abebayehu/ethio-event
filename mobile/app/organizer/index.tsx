import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/endpoints";
import { EmptyState, Loading } from "@/components/Loading";
import { formatDateTime, priceLabel } from "@/lib/format";
import { colors, font, radius, spacing } from "@/lib/theme";
import type { Event } from "@/lib/types";

export default function MyEvents() {
    const router = useRouter();
    const { user } = useAuth();
    const canManage = user?.role === "organizer" || user?.role === "admin";

    const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ["my-events"], queryFn: api.myEvents, enabled: canManage });

    if (!canManage) return <Redirect href="/(tabs)" />;

    const events = data?.events ?? [];
    const totalSold = events.reduce((s, e) => s + (e.ticket?.quantity_sold ?? 0), 0);
    const totalRevenue = events.reduce((s, e) => s + e.price * (e.ticket?.quantity_sold ?? 0), 0);

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.back}>
                    <Ionicons name="chevron-back" size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.title}>My Events</Text>
                <View style={{ width: 22 }} />
            </View>

            {isLoading ? (
                <Loading />
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(e) => e.id}
                    ListHeaderComponent={
                        <View style={styles.stats}>
                            <Stat label="Events" value={String(events.length)} />
                            <Stat label="Tickets Sold" value={String(totalSold)} />
                            <Stat label="Revenue" value={priceLabel(totalRevenue)} />
                        </View>
                    }
                    renderItem={({ item }) => <EventRow event={item} onPress={() => router.push(`/organizer/${item.id}`)} />}
                    contentContainerStyle={styles.list}
                    onRefresh={refetch}
                    refreshing={isRefetching}
                    ListEmptyComponent={<EmptyState icon="calendar-outline" title="No events yet" subtitle="Create events on the web to manage them here." />}
                />
            )}
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

function EventRow({ event, onPress }: { event: Event; onPress: () => void }) {
    const sold = event.ticket?.quantity_sold ?? 0;
    const total = event.ticket?.quantity_total ?? 0;
    const pct = total > 0 ? Math.round((sold / total) * 100) : 0;

    return (
        <Pressable style={styles.row} onPress={onPress}>
            <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{event.title}</Text>
                <Text style={styles.rowMeta}>{formatDateTime(event.event_date)} · {event.venue}</Text>
                <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.rowMeta}>{sold}/{total} sold · {priceLabel(event.price * sold)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    back: { padding: 2 },
    title: { fontSize: font.xl, fontWeight: "800", color: colors.text },
    list: { padding: spacing.lg, paddingTop: 0, flexGrow: 1 },
    stats: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
    stat: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: "center" },
    statValue: { fontSize: font.lg, fontWeight: "800", color: colors.text },
    statLabel: { fontSize: font.xs, color: colors.subtext, marginTop: 2 },
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
    rowTitle: { fontSize: font.md, fontWeight: "800", color: colors.text },
    rowMeta: { fontSize: font.sm, color: colors.subtext, marginTop: 2 },
    barBg: { height: 6, borderRadius: 3, backgroundColor: "#f3f4f6", marginTop: 8, marginBottom: 4, overflow: "hidden" },
    barFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
});
