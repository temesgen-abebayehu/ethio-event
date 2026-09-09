"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { formatDateTime, priceLabel } from "@/lib/format";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const EventMap = dynamic(() => import("@/components/EventMap"), { ssr: false });

export default function EventDetailsPage() {
    const { idOrSlug } = useParams<{ idOrSlug: string }>();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const toast = useToast();
    const qc = useQueryClient();
    const [imgIndex, setImgIndex] = useState(0);

    const { data: event, isLoading, isError } = useQuery({
        queryKey: ["event", idOrSlug],
        queryFn: () => api.getEvent(idOrSlug),
    });

    const { data: status } = useQuery({
        queryKey: ["interactions", event?.id],
        queryFn: () => api.interactionStatus(event!.id),
        enabled: isAuthenticated && !!event?.id,
    });

    const toggle = useMutation({
        mutationFn: async (kind: "bookmark" | "follow") => {
            if (!event) return;
            if (kind === "bookmark") {
                status?.bookmarked ? await api.unbookmark(event.id) : await api.bookmark(event.id);
            } else {
                status?.following ? await api.unfollow(event.id) : await api.follow(event.id);
            }
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["interactions", event?.id] }),
        onError: () => toast.error("Action failed. Please try again."),
    });

    const requireAuth = (fn: () => void) => () => {
        if (!isAuthenticated) return router.push("/auth/login");
        fn();
    };

    if (isLoading) return <LoadingSpinner className="py-24" />;
    if (isError || !event)
        return (
            <div className="py-24 text-center">
                <p className="text-lg font-medium text-gray-700">Event not found or no longer available.</p>
                <Link href="/" className="mt-4 inline-block text-primary hover:underline">
                    Back to events
                </Link>
            </div>
        );

    const images = event.images ?? [];
    const current = images[imgIndex]?.url;
    const soldOut = event.is_sold_out;
    const past = event.time_status === "past";

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-gray-600 transition-colors hover:text-primary">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            {/* Hero image */}
            <div className="relative mb-6 h-72 overflow-hidden rounded-2xl bg-gray-100 sm:h-96">
                {current ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={current} alt={event.title} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
                        <svg className="h-24 w-24 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16v12H4V6z" />
                        </svg>
                    </div>
                )}
                {images.length > 1 && (
                    <>
                        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                            {imgIndex + 1} / {images.length}
                        </span>
                        <button onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow">
                            ‹
                        </button>
                        <button onClick={() => setImgIndex((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow">
                            ›
                        </button>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main column */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Title card */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                        {event.category && (
                            <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                                {event.category.name}
                            </span>
                        )}
                        <h1 className="text-4xl font-extrabold text-gray-900">{event.title}</h1>
                        <p className="mt-2 text-gray-600">
                            Organized by <span className="font-medium text-primary">{event.organizer_name}</span>
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </span>
                                <div>
                                    <p className="font-semibold text-gray-900">{formatDateTime(event.event_date)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </span>
                                <div>
                                    <p className="font-semibold text-gray-900">{event.venue}</p>
                                    <p className="text-sm text-gray-500">{event.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* About */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                        <h2 className="mb-4 text-2xl font-bold text-gray-900">About this event</h2>
                        <p className="whitespace-pre-line leading-relaxed text-gray-700">{event.description}</p>

                        {event.tags.length > 0 && (
                            <div className="mt-6">
                                <h3 className="mb-3 text-xl font-bold text-gray-900">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {event.tags.map((t) => (
                                        <span key={t.id} className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                            #{t.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                        <h2 className="mb-4 text-2xl font-bold text-gray-900">Location</h2>
                        <EventMap lat={event.latitude} lng={event.longitude} />
                    </div>
                </div>

                {/* Sidebar: price card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-3xl font-extrabold text-primary">{priceLabel(event.price)}</span>
                                <span className="text-gray-500"> / person</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={requireAuth(() => toggle.mutate("bookmark"))}
                                    aria-label="Bookmark"
                                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${status?.bookmarked ? "bg-yellow-50 text-yellow-500" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                >
                                    <svg className="h-5 w-5" fill={status?.bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={requireAuth(() => toggle.mutate("follow"))}
                                    aria-label="Follow"
                                    className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${status?.following ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                >
                                    <svg className="h-5 w-5" fill={status?.following ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="mt-4">
                            {soldOut ? (
                                <span className="inline-block rounded-md bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-700">SOLD OUT</span>
                            ) : (
                                <span className="inline-block rounded-md bg-green-100 px-2.5 py-1 text-sm font-semibold text-green-700">
                                    {event.tickets_remaining} tickets available
                                </span>
                            )}
                        </div>

                        <button
                            disabled={soldOut || past}
                            onClick={requireAuth(() => router.push(`/payment/checkout/${event.id}`))}
                            className="mt-5 w-full rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-600"
                        >
                            {past ? "Event ended" : soldOut ? "Sold Out" : "Get Tickets"}
                        </button>
                        <p className="mt-3 text-center text-xs font-medium text-gray-500">Secure checkout powered by Chapa</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
