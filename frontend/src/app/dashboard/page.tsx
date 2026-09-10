"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { eventRevenue, featuredImage, formatDateTime, priceLabel } from "@/lib/format";
import type { Event } from "@/lib/types";

type Filter = "all" | "upcoming" | "ongoing" | "past";

function StatCard({ label, value, tint, icon }: { label: string; value: string; tint: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
            </div>
        </div>
    );
}

const icons = {
    calendar: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    ticket: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z" />
        </svg>
    ),
    cash: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    broadcast: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 010-7.778m7.778 0a5.5 5.5 0 010 7.778M12 12h.01M4.929 19.071a10 10 0 010-14.142m14.142 0a10 10 0 010 14.142" />
        </svg>
    ),
};

export default function MyEventsPage() {
    const { ready } = useRequireAuth({ organizer: true });
    const toast = useToast();
    const qc = useQueryClient();
    const [filter, setFilter] = useState<Filter>("all");
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["my-events"],
        queryFn: api.myEvents,
        enabled: ready,
    });

    const del = useMutation({
        mutationFn: (id: string) => api.deleteEvent(id),
        onSuccess: () => {
            toast.success("Event deleted");
            setConfirmId(null);
            qc.invalidateQueries({ queryKey: ["my-events"] });
        },
        onError: (err) => {
            setConfirmId(null);
            toast.error(err instanceof ApiError ? err.message : "Failed to delete event");
        },
    });

    if (!ready || isLoading) return <LoadingSpinner className="py-24" />;

    if (isError)
        return (
            <div className="py-24 text-center">
                <p className="mb-4 text-gray-600">Couldn&apos;t load your events.</p>
                <button onClick={() => refetch()} className="rounded-lg bg-primary px-4 py-2 font-medium text-white">
                    Retry
                </button>
            </div>
        );

    const events = data?.events ?? [];
    const published = events.filter((e) => e.status === "published");
    const totalSold = events.reduce((s, e) => s + (e.ticket?.quantity_sold ?? 0), 0);
    const totalRevenue = events.reduce((s, e) => s + eventRevenue(e), 0);
    const active = events.filter((e) => e.time_status !== "past").length;

    const shown = filter === "all" ? events : events.filter((e) => e.time_status === filter);

    const tab = (f: Filter, label: string) => (
        <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === f ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-700"
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <Link href="/" className="mb-4 inline-flex items-center gap-1 text-gray-600 hover:text-primary">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </Link>

            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-4xl font-bold">My Events</h1>
                <Link href="/events/create" className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-white hover:bg-primary-dark">
                    + Create Event
                </Link>
            </div>

            {/* Stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total Events Published" value={String(published.length)} tint="bg-indigo-100 text-indigo-600" icon={icons.calendar} />
                <StatCard label="Total Tickets Sold" value={totalSold.toLocaleString()} tint="bg-green-100 text-green-600" icon={icons.ticket} />
                <StatCard label="Total Revenue (ETB)" value={priceLabel(totalRevenue)} tint="bg-blue-100 text-blue-600" icon={icons.cash} />
                <StatCard label="Active Events" value={String(active)} tint="bg-orange-100 text-orange-600" icon={icons.broadcast} />
            </div>

            {/* Filters */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Your Events</h2>
                <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
                    {tab("all", "All")}
                    {tab("upcoming", "Upcoming")}
                    {tab("ongoing", "Ongoing")}
                    {tab("past", "Completed")}
                </div>
            </div>

            {shown.length === 0 ? (
                <div className="py-20 text-center">
                    <svg className="mx-auto mb-4 h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-2xl font-bold text-gray-800">No events yet</p>
                    <p className="mt-1 text-gray-500">Create your first event to get started.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {shown.map((e) => (
                        <OrganizerEventRow key={e.id} event={e} onDelete={() => setConfirmId(e.id)} />
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={!!confirmId}
                title="Delete event?"
                message={`This permanently removes “${events.find((e) => e.id === confirmId)?.title ?? "this event"}” and all its data. This can’t be undone.`}
                loading={del.isPending}
                onConfirm={() => confirmId && del.mutate(confirmId)}
                onCancel={() => setConfirmId(null)}
            />
        </div>
    );
}

function OrganizerEventRow({ event, onDelete }: { event: Event; onDelete: () => void }) {
    const img = featuredImage(event);
    const sold = event.ticket?.quantity_sold ?? 0;
    const total = event.ticket?.quantity_total ?? 0;
    const pct = total > 0 ? Math.round((sold / total) * 100) : 0;

    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-4 sm:flex-row">
                <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : null}
                    {event.time_status === "ongoing" && (
                        <span className="absolute left-1 top-1 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-primary">LIVE</span>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-bold">{event.title}</h3>
                            <p className="text-sm text-gray-500">
                                {formatDateTime(event.event_date)} · {event.venue}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={`/events/edit/${event.id}`} className="text-green-600 transition-colors hover:text-green-700" aria-label="Edit">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </Link>
                            <button onClick={onDelete} className="text-red-600 transition-colors hover:text-red-700" aria-label="Delete">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-3 text-sm sm:grid-cols-3">
                        <div>
                            <p className="text-xs uppercase text-gray-500">Tickets Sold</p>
                            <p className="font-semibold">
                                {sold} / {total} <span className="text-primary">{pct}%</span>
                            </p>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                                <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-gray-500">Revenue</p>
                            <p className="font-semibold">{priceLabel(eventRevenue(event))}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-gray-500">Remaining</p>
                            <p className="font-semibold">{event.tickets_remaining}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <Link href={`/dashboard/events/${event.id}`} className="text-sm font-semibold text-primary hover:underline">
                    View Details →
                </Link>
                <Link
                    href={`/dashboard/events/${event.id}?tab=buyers`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" />
                    </svg>
                    View Ticket Buyers
                </Link>
            </div>
        </div>
    );
}
