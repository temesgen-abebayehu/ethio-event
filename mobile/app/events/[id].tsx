import React from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState, Loading } from "@/components/Loading";
import { api } from "@/lib/endpoints";
import { useToast } from "@/lib/toast";
import { featuredImage, formatDateTime, priceLabel } from "@/lib/format";
import { colors, font, radius, spacing } from "@/lib/theme";

export default function EventDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const toast = useToast();
    const qc = useQueryClient();

    const { data: event, isLoading, isError } = useQuery({ queryKey: ["event", id], queryFn: () => api.event(id) });
    const { data: status } = useQuery({
        queryKey: ["interactions", event?.id],
        queryFn: () => api.interactionStatus(event!.id),
        enabled: !!event?.id,
    });

    const toggle = useMutation({
        mutationFn: async (kind: "bookmark" | "follow") => {
            if (!event) return;
            if (kind === "bookmark") status?.bookmarked ? await api.unbookmark(event.id) : await api.bookmark(event.id);
            else status?.following ? await api.unfollow(event.id) : await api.follow(event.id);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["interactions", event?.id] }),
        onError: () => toast.error("Action failed. Please try again."),
    });

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safe}>
                <Loading />
            </SafeAreaView>
        );
    }
    if (isError || !event) {
        return (
            <SafeAreaView style={styles.safe}>
                <EmptyState icon="alert-circle-outline" title="Event not found" subtitle="It may no longer be available." />
            </SafeAreaView>
        );
    }

    const img = featuredImage(event);
    const past = event.time_status === "past";
    const soldOut = event.is_sold_out;

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                <View style={styles.hero}>
                    {img ? <Image source={{ uri: img }} style={styles.heroImg} /> : <View style={[styles.heroImg, styles.heroPlaceholder]} />}
                    <Pressable style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={22} color={colors.white} />
                    </Pressable>
                </View>

                <View style={styles.body}>
                    {event.category ? <Badge label={event.category.name} tone="primary" /> : null}
                    <Text style={styles.title}>{event.title}</Text>
                    <Text style={styles.organizer}>Organized by {event.organizer_name}</Text>

                    <InfoRow icon="calendar-outline" title={formatDateTime(event.event_date)} />
                    <InfoRow icon="location-outline" title={event.venue} subtitle={event.address} />

                    <Pressable style={styles.mapsBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`)}>
                        <Ionicons name="navigate-outline" size={16} color={colors.primary} />
                        <Text style={styles.mapsText}>Open in Maps</Text>
                    </Pressable>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>About this event</Text>
                    <Text style={styles.description}>{event.description}</Text>

                    {event.tags.length > 0 ? (
                        <View style={styles.tags}>
                            {event.tags.map((t) => (
                                <View key={t.id} style={styles.tag}>
                                    <Text style={styles.tagText}>#{t.name}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>
            </ScrollView>

            {/* Sticky action bar */}
            <View style={styles.actionBar}>
                <IconToggle
                    active={!!status?.bookmarked}
                    activeColor="#eab308"
                    icon="bookmark"
                    onPress={() => toggle.mutate("bookmark")}
                />
                <IconToggle
                    active={!!status?.following}
                    activeColor={colors.red}
                    icon="heart"
                    onPress={() => toggle.mutate("follow")}
                />
                <View style={{ flex: 1 }}>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>{priceLabel(event.price)}</Text>
                        {!soldOut && !past ? <Text style={styles.remaining}>{event.tickets_remaining} left</Text> : null}
                    </View>
                    <Button
                        label={past ? "Event ended" : soldOut ? "Sold Out" : "Get Tickets"}
                        disabled={past || soldOut}
                        onPress={() => router.push(`/checkout/${event.id}`)}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

function InfoRow({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
                <Ionicons name={icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>{title}</Text>
                {subtitle ? <Text style={styles.infoSub}>{subtitle}</Text> : null}
            </View>
        </View>
    );
}

function IconToggle({ active, activeColor, icon, onPress }: { active: boolean; activeColor: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
    return (
        <Pressable style={[styles.toggle, active && { borderColor: activeColor }]} onPress={onPress}>
            <Ionicons name={active ? icon : (`${icon}-outline` as keyof typeof Ionicons.glyphMap)} size={22} color={active ? activeColor : colors.muted} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    hero: { position: "relative" },
    heroImg: { width: "100%", height: 240, backgroundColor: "#e5e7eb" },
    heroPlaceholder: { backgroundColor: "#ede9fe" },
    backBtn: { position: "absolute", top: spacing.md, left: spacing.md, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: radius.full, padding: 8 },
    body: { padding: spacing.lg, gap: 8 },
    title: { fontSize: font.xxl, fontWeight: "800", color: colors.text, marginTop: 6 },
    organizer: { fontSize: font.sm, color: colors.subtext },
    infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
    infoIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center" },
    infoTitle: { fontSize: font.md, fontWeight: "700", color: colors.text },
    infoSub: { fontSize: font.sm, color: colors.subtext },
    mapsBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm, alignSelf: "flex-start" },
    mapsText: { color: colors.primary, fontWeight: "700", fontSize: font.sm },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
    sectionTitle: { fontSize: font.lg, fontWeight: "800", color: colors.text, marginBottom: 6 },
    description: { fontSize: font.md, color: "#374151", lineHeight: 22 },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: spacing.md },
    tag: { backgroundColor: colors.primaryTint, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
    tagText: { color: colors.primary, fontWeight: "600", fontSize: font.sm },
    actionBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    toggle: { width: 48, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 4 },
    price: { fontSize: font.lg, fontWeight: "800", color: colors.primary },
    remaining: { fontSize: font.xs, color: colors.green, fontWeight: "700" },
});
