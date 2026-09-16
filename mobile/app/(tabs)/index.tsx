import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { EventCard } from "@/components/EventCard";
import { EmptyState, Loading } from "@/components/Loading";
import { colors, font, radius, spacing } from "@/lib/theme";
import type { EventFilters } from "@/lib/types";

export default function Discover() {
    const [search, setSearch] = useState("");
    const [q, setQ] = useState("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [free, setFree] = useState(false);

    const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: api.categories });

    const filters: EventFilters = useMemo(
        () => ({ q: q || undefined, category_id: categoryId || undefined, free: free || undefined, sort: "event_date", order: "asc", limit: 50 }),
        [q, categoryId, free],
    );

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ["events", filters],
        queryFn: () => api.events(filters),
    });

    const events = data?.events ?? [];

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
                <Text style={styles.title}>Discover</Text>
                <Text style={styles.subtitle}>Find events happening around you.</Text>

                <View style={styles.searchRow}>
                    <Ionicons name="search" size={18} color={colors.muted} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={() => setQ(search.trim())}
                        returnKeyType="search"
                        placeholder="Search events, tags…"
                        placeholderTextColor={colors.muted}
                        style={styles.searchInput}
                    />
                    {search ? (
                        <Pressable onPress={() => { setSearch(""); setQ(""); }} hitSlop={8}>
                            <Ionicons name="close-circle" size={18} color={colors.muted} />
                        </Pressable>
                    ) : null}
                </View>

                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[{ id: "", name: "All" }, { id: "__free", name: "Free" }, ...(categories ?? [])]}
                    keyExtractor={(c) => c.id}
                    contentContainerStyle={{ gap: 8, paddingVertical: spacing.md }}
                    renderItem={({ item }) => {
                        const active = item.id === "__free" ? free : item.id === "" && !categoryId && !free ? true : categoryId === item.id;
                        return (
                            <Pressable
                                onPress={() => {
                                    if (item.id === "__free") { setFree((f) => !f); }
                                    else { setFree(false); setCategoryId(item.id); }
                                }}
                                style={[styles.chip, active && styles.chipActive]}
                            >
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
                            </Pressable>
                        );
                    }}
                />
            </View>

            {isLoading ? (
                <Loading />
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(e) => e.id}
                    renderItem={({ item }) => <EventCard event={item} />}
                    contentContainerStyle={styles.list}
                    onRefresh={refetch}
                    refreshing={isRefetching}
                    ListEmptyComponent={<EmptyState icon="calendar-outline" title="No events found" subtitle="Try a different search or filter." />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    title: { fontSize: font.xxl, fontWeight: "800", color: colors.text },
    subtitle: { fontSize: font.sm, color: colors.subtext, marginTop: 2 },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    searchInput: { flex: 1, paddingVertical: spacing.md, fontSize: font.md, color: colors.text },
    chip: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 7 },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: font.sm, fontWeight: "600", color: colors.subtext },
    chipTextActive: { color: colors.white },
    list: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
