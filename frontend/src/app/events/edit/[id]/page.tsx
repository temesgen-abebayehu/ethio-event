"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { EventForm } from "@/components/EventForm";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { EventPayload } from "@/lib/types";

export default function EditEventPage() {
    const { id } = useParams<{ id: string }>();
    const { ready } = useRequireAuth({ organizer: true });
    const router = useRouter();
    const toast = useToast();

    const { data: event, isLoading } = useQuery({
        queryKey: ["event", id],
        queryFn: () => api.getEvent(id),
        enabled: ready,
    });

    const mutation = useMutation({
        mutationFn: (payload: EventPayload) => api.updateEvent(id, payload),
        onSuccess: (updated) => {
            toast.success("Event updated!");
            router.push(`/events/${updated.slug}`);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update event"),
    });

    if (!ready || isLoading || !event) return <LoadingSpinner className="py-24" />;

    return (
        <div className="container mx-auto max-w-3xl px-4 py-8">
            <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-primary">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">Edit Event</h1>
            <p className="mb-6 mt-1 text-gray-500">Update the details for &ldquo;{event.title}&rdquo;.</p>
            <EventForm initial={event} submitting={mutation.isPending} onSubmit={mutation.mutate} />
        </div>
    );
}
