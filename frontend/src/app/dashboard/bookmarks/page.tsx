"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EventCard } from "@/components/EventCard";

export default function BookmarksPage() {
    const { ready } = useRequireAuth();
    const { data, isLoading } = useQuery({
        queryKey: ["bookmarks"],
        queryFn: api.myBookmarks,
        enabled: ready,
    });

    if (!ready || isLoading) return <LoadingSpinner className="py-24" />;

    const events = data?.events ?? [];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="mb-6 text-3xl font-bold">Bookmarked Events</h1>
            {events.length === 0 ? (
                <p className="py-16 text-center text-gray-500">No bookmarks yet.</p>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {events.map((e) => (
                        <EventCard key={e.id} event={e} />
                    ))}
                </div>
            )}
        </div>
    );
}
