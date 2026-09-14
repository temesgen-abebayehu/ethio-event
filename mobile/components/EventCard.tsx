import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, font, radius, spacing } from "@/lib/theme";
import { featuredImage, formatDateTime, priceLabel } from "@/lib/format";
import { Badge } from "./Badge";
import type { Event } from "@/lib/types";

export function EventCard({ event }: { event: Event }) {
    const router = useRouter();
    const img = featuredImage(event);

    return (
        <Pressable
            onPress={() => router.push(`/events/${event.slug || event.id}`)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
        >
            <View style={styles.imageWrap}>
                {img ? (
                    <Image source={{ uri: img }} style={styles.image} />
                ) : (
                    <View style={[styles.image, styles.placeholder]}>
                        <Ionicons name="image-outline" size={40} color={colors.border} />
                    </View>
                )}
                <View style={styles.priceTag}>
                    <Text style={styles.priceText}>{priceLabel(event.price)}</Text>
                </View>
            </View>

            <View style={styles.body}>
                {event.category ? <Badge label={event.category.name} tone="primary" /> : null}
                <Text style={styles.title} numberOfLines={2}>
                    {event.title}
                </Text>
                <View style={styles.row}>
                    <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                    <Text style={styles.meta} numberOfLines={1}>
                        {formatDateTime(event.event_date)}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Ionicons name="location-outline" size={14} color={colors.muted} />
                    <Text style={styles.meta} numberOfLines={1}>
                        {event.venue}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        marginBottom: spacing.lg,
    },
    imageWrap: { position: "relative" },
    image: { width: "100%", height: 160, backgroundColor: "#f3f4f6" },
    placeholder: { alignItems: "center", justifyContent: "center" },
    priceTag: {
        position: "absolute",
        right: spacing.md,
        top: spacing.md,
        backgroundColor: "rgba(17,24,39,0.85)",
        borderRadius: radius.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    priceText: { color: colors.white, fontWeight: "700", fontSize: font.xs },
    body: { padding: spacing.lg, gap: 6 },
    title: { fontSize: font.lg, fontWeight: "800", color: colors.text },
    row: { flexDirection: "row", alignItems: "center", gap: 6 },
    meta: { fontSize: font.sm, color: colors.subtext, flex: 1 },
});
