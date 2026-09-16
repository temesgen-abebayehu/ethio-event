import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { EventCard } from "@/components/EventCard";
import { EmptyState, Loading } from "@/components/Loading";
import { colors, font, radius, spacing } from "@/lib/theme";

type Tab = "bookmarks" | "following";

export default function Saved() {
    const [tab, setTab] = useState<Tab>("bookmarks");

    const bookmarks = useQuery({ queryKey: ["my-bookmarks"], queryFn: api.myBookmarks });
    const follows = useQuery({ queryKey: ["my-follows"], queryFn: api.myFollows });

    const active = tab === "bookmarks" ? bookmarks : follows;
    const events = active.data ?? [];

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.header}>
                <Text style={styles.title}>Saved</Text>
                <View style={styles.segment}>
                    {(["bookmarks", "following"] as const).map((t) => (
                        <Pressable key={t} onPress={() => setTab(t)} style={[styles.segItem, tab === t && styles.segActive]}>
                            <Text style={[styles.segText, tab === t && styles.segTextActive]}>{t === "bookmarks" ? "Bookmarks" : "Following"}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {active.isLoading ? (
                <Loading />
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(e) => e.id}
                    renderItem={({ item }) => <EventCard event={item} />}
                    contentContainerStyle={styles.list}
                    onRefresh={active.refetch}
                    refreshing={active.isRefetching}
                    ListEmptyComponent={
                        <EmptyState
                            icon={tab === "bookmarks" ? "bookmark-outline" : "heart-outline"}
                            title={tab === "bookmarks" ? "No bookmarks yet" : "Not following any events"}
                            subtitle="Save events to find them here later."
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    title: { fontSize: font.xxl, fontWeight: "800", color: colors.text, marginBottom: spacing.md },
    segment: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: radius.md, padding: 4 },
    segItem: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, borderRadius: radius.sm },
    segActive: { backgroundColor: colors.white },
    segText: { fontWeight: "600", color: colors.subtext },
    segTextActive: { color: colors.primary },
    list: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
});
