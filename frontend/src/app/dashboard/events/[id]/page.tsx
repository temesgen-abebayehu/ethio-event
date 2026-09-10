"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { eventRevenue, formatDateTime, priceLabel } from "@/lib/format";
import type { EventBuyer } from "@/lib/types";

type Tab = "overview" | "buyers" | "analytics";

const statusBadge: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-700",
};

export default function OrganizerEventPage() {
    return (
        <Suspense fallback={<LoadingSpinner className="py-24" />}>
            <OrganizerEventInner />
        </Suspense>
    );
}

function OrganizerEventInner() {
    const { id } = useParams<{ id: string }>();
    const params = useSearchParams();
    const router = useRouter();
    const toast = useToast();
    const qc = useQueryClient();
    const { ready } = useRequireAuth({ organizer: true });

    const tab = (params.get("tab") as Tab) || "overview";
    const [confirmDelete, setConfirmDelete] = useState(false);

    const { data: event, isLoading } = useQuery({
        queryKey: ["event", id],
        queryFn: () => api.getEvent(id),
        enabled: ready,
    });

    const { data: buyers } = useQuery({
        queryKey: ["event-buyers", id],
        queryFn: () => api.eventBuyers(id),
        enabled: ready,
    });

    const del = useMutation({
        mutationFn: () => api.deleteEvent(id),
        onSuccess: () => {
            toast.success("Event deleted");
            qc.invalidateQueries({ queryKey: ["my-events"] });
            router.push("/dashboard");
        },
        onError: (err) => {
            setConfirmDelete(false);
            toast.error(err instanceof ApiError ? err.message : "Failed to delete event");
        },
    });

    if (!ready || isLoading || !event) return <LoadingSpinner className="py-24" />;

    const sold = event.ticket?.quantity_sold ?? 0;
    const total = event.ticket?.quantity_total ?? 0;
    const pct = total > 0 ? Math.round((sold / total) * 100) : 0;
    const revenue = eventRevenue(event);

    // Attendance derived from scanned (checked-in) completed orders.
    const completed = (buyers ?? []).filter((b) => b.status === "completed");
    const attended = completed.filter((b) => b.scanned_at).reduce((s, b) => s + b.quantity, 0);
    const pendingAttend = Math.max(0, sold - attended);
    const attendPct = sold > 0 ? Math.round((attended / sold) * 100) : 0;

    const setTab = (t: Tab) => router.push(`/dashboard/events/${id}?tab=${t}`);
    const tabBtn = (t: Tab, label: string) => (
        <button
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <nav className="mb-2 text-sm text-gray-500">
                <Link href="/dashboard" className="hover:text-primary">
                    My Events
                </Link>{" "}
                / <span className="text-gray-700">{event.title}</span>
            </nav>

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{event.title}</h1>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="rounded-full bg-green-100 px-3 py-1 font-semibold text-green-700">
                            {event.status === "published" ? "Published" : "Draft"}
                        </span>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 font-semibold capitalize text-indigo-700">
                            {event.time_status}
                        </span>
                        <span className="text-gray-500">{formatDateTime(event.event_date)}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/dashboard/events/${event.id}/scan`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        Scan Tickets
                    </Link>
                    <Link href={`/events/edit/${event.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Event
                    </Link>
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b border-gray-200">
                {tabBtn("overview", "Overview")}
                {tabBtn("buyers", "Ticket Buyers")}
                {tabBtn("analytics", "Analytics")}
            </div>

            {tab === "overview" && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-5 text-lg font-bold text-gray-900">Event Details</h2>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="flex items-start gap-3">
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Date &amp; Time</p>
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
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Venue</p>
                                    <p className="font-semibold text-gray-900">{event.venue}</p>
                                    <p className="text-sm text-gray-500">{event.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Total Revenue</p>
                                    <p className="mt-1 text-4xl font-extrabold text-gray-900">ETB {revenue.toLocaleString()}</p>
                                </div>
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-lg font-bold text-gray-900">Ticket Analytics</h2>
                            <p className="mb-3 text-xs uppercase tracking-wide text-gray-500">Ticket Sales</p>
                            <div className="flex items-center gap-6">
                                <Donut pct={pct} />
                                <div className="space-y-2 text-sm">
                                    <p className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Sold: {sold}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-gray-200" /> Remaining: {event.tickets_remaining}
                                    </p>
                                </div>
                            </div>

                            <p className="mb-3 mt-6 border-t border-gray-100 pt-6 text-xs uppercase tracking-wide text-gray-500">Attendance Tracking</p>
                            <div className="flex items-center gap-6">
                                <Donut pct={attendPct} />
                                <div className="space-y-2 text-sm">
                                    <p className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Attended: {attended}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-200" /> Pending: {pendingAttend}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === "buyers" && <BuyersTable buyers={buyers} eventId={id} />}

            {tab === "analytics" && <AnalyticsTab buyers={buyers} />}

            <ConfirmDialog
                open={confirmDelete}
                title="Delete event?"
                message={`This permanently removes “${event.title}” and all its data. This can’t be undone.`}
                loading={del.isPending}
                onConfirm={() => del.mutate()}
                onCancel={() => setConfirmDelete(false)}
            />
        </div>
    );
}

function AnalyticsTab({ buyers }: { buyers?: EventBuyer[] }) {
    const [period, setPeriod] = useState<"7" | "30" | "all">("7");

    const { velocity, revenue } = useMemo(() => {
        const daily = new Map<string, { count: number; revenue: number }>();
        (buyers ?? [])
            .filter((b) => b.status === "completed")
            .forEach((b) => {
                const day = b.created_at.slice(0, 10);
                const cur = daily.get(day) ?? { count: 0, revenue: 0 };
                cur.count += b.quantity;
                cur.revenue += b.total_price;
                daily.set(day, cur);
            });
        let days = [...daily.keys()].sort();
        if (period !== "all") days = days.slice(-Number(period));
        const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const velocity = days.map((d) => ({ label: fmt(d), value: daily.get(d)!.count }));
        let run = 0;
        const revenue = days.map((d) => {
            run += daily.get(d)!.revenue;
            return { label: fmt(d), value: run };
        });
        return { velocity, revenue };
    }, [buyers, period]);

    if (!buyers) return <LoadingSpinner className="py-12" />;

    const empty = <p className="py-16 text-center text-gray-500">No sales data yet.</p>;

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Ticket Sales Velocity</h2>
                        <p className="text-sm text-gray-500">Daily ticket purchases over the selected period.</p>
                    </div>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as "7" | "30" | "all")}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
                {velocity.length === 0 ? empty : <LineChart points={velocity} />}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:max-w-2xl">
                <h2 className="text-lg font-bold text-gray-900">Revenue Growth</h2>
                <p className="mb-4 text-sm text-gray-500">Cumulative revenue generation (ETB).</p>
                {revenue.length === 0 ? empty : <BarChart bars={revenue} />}
            </div>
        </div>
    );
}

// smoothPath builds a Catmull-Rom-to-bezier curve through the given points.
function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] ?? pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] ?? p2;
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
    }
    return d;
}

function LineChart({ points }: { points: { label: string; value: number }[] }) {
    const W = 760, H = 280, padL = 40, padB = 28, padT = 12, padR = 14;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const niceMax = Math.max(Math.ceil(Math.max(...points.map((p) => p.value), 1) / 5) * 5, 5);
    const x = (i: number) => (points.length === 1 ? padL + innerW / 2 : padL + (i / (points.length - 1)) * innerW);
    const y = (v: number) => padT + innerH - (v / niceMax) * innerH;
    const coords = points.map((p, i) => ({ x: x(i), y: y(p.value) }));
    const line = smoothPath(coords);
    const area = `${line} L${coords[coords.length - 1].x},${padT + innerH} L${coords[0].x},${padT + innerH} Z`;
    const ticks = 6;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <defs>
                <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
            </defs>
            {Array.from({ length: ticks + 1 }).map((_, i) => {
                const v = (niceMax / ticks) * i;
                const yy = y(v);
                return (
                    <g key={i}>
                        <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#f3f4f6" />
                        <text x={padL - 8} y={yy + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{Math.round(v)}</text>
                    </g>
                );
            })}
            <path d={area} fill="url(#velocityFill)" />
            <path d={line} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
            {coords.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r="4" fill="#fff" stroke="#6366f1" strokeWidth="2" />
            ))}
            {points.map((p, i) => (
                <text key={`l${i}`} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#9ca3af">{p.label}</text>
            ))}
        </svg>
    );
}

function BarChart({ bars }: { bars: { label: string; value: number }[] }) {
    const W = 520, H = 280, padL = 52, padB = 28, padT = 12, padR = 14;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const niceMax = Math.max(Math.ceil(Math.max(...bars.map((b) => b.value), 1) / 1000) * 1000, 1000);
    const slot = innerW / Math.max(bars.length, 1);
    const barW = Math.min(slot * 0.5, 40);
    const y = (v: number) => padT + innerH - (v / niceMax) * innerH;
    const ticks = 6;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            {Array.from({ length: ticks + 1 }).map((_, i) => {
                const v = (niceMax / ticks) * i;
                const yy = y(v);
                return (
                    <g key={i}>
                        <line x1={padL} y1={yy} x2={W - padR} y2={yy} stroke="#f3f4f6" />
                        <text x={padL - 8} y={yy + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{Math.round(v).toLocaleString()}</text>
                    </g>
                );
            })}
            {bars.map((b, i) => (
                <g key={i}>
                    <rect x={padL + i * slot + (slot - barW) / 2} y={y(b.value)} width={barW} height={padT + innerH - y(b.value)} rx="5" fill="#6366f1" />
                    <text x={padL + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#9ca3af">{b.label}</text>
                </g>
            ))}
        </svg>
    );
}

function Donut({ pct }: { pct: number }) {
    return (
        <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full"
            style={{ background: `conic-gradient(#6366f1 ${pct * 3.6}deg, #e5e7eb 0deg)` }}>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-xl font-bold text-gray-900">
                {pct}%
            </div>
        </div>
    );
}

function BuyersTable({ buyers, eventId }: { buyers?: EventBuyer[]; eventId: string }) {
    const toast = useToast();
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [compose, setCompose] = useState<{ recipients: string[]; subject: string; body: string } | null>(null);
    const [exportOpen, setExportOpen] = useState(false);

    const markAttended = useMutation({
        mutationFn: (orderID: string) => api.scanTicket(orderID),
        onSuccess: () => {
            toast.success("Attendee checked in");
            qc.invalidateQueries({ queryKey: ["event-buyers", eventId] });
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to check in"),
    });

    const notify = useMutation({
        mutationFn: (payload: { recipients: string[]; subject: string; body: string }) => api.notifyBuyers(eventId, payload),
        onSuccess: (res) => {
            toast.success(`Email sent to ${res.sent} recipient${res.sent === 1 ? "" : "s"}`);
            setCompose(null);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to send email"),
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return (buyers ?? []).filter((b) => {
            const matchesText = !q || b.buyer_name.toLowerCase().includes(q) || b.buyer_email.toLowerCase().includes(q);
            const attendanceMatch =
                status === "all" ||
                (status === "attended" && b.status === "completed" && b.scanned_at) ||
                (status === "not_scanned" && b.status === "completed" && !b.scanned_at) ||
                status === b.status;
            return matchesText && attendanceMatch;
        });
    }, [buyers, search, status]);

    if (!buyers) return <LoadingSpinner className="py-12" />;

    const pageSize = 8;
    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, pageCount);
    const start = (current - 1) * pageSize;
    const shown = filtered.slice(start, start + pageSize);

    // Export shows attendance (Attended/Not Attended) for paid tickets; payment state otherwise.
    const attendance = (b: EventBuyer) => (b.status !== "completed" ? b.status : b.scanned_at ? "Attended" : "Not Attended");

    const downloadCsv = () => {
        const rows = [
            ["Name", "Email", "Quantity", "Total", "Date", "Status"],
            ...filtered.map((b) => [b.buyer_name, b.buyer_email, String(b.quantity), String(b.total_price), b.created_at, attendance(b)]),
        ];
        const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const a = document.createElement("a");
        a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
        a.download = "ticket-buyers.csv";
        a.click();
    };

    const downloadPdf = () => {
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const w = doc.internal.pageSize.getWidth();
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, w, 56, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text("Ticket Buyers", 40, 36);

        const cols = [40, 150, 320, 355, 425, 500];
        let y = 90;
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(9);
        ["Buyer", "Email", "Qty", "Total", "Date", "Status"].forEach((h, i) => doc.text(h, cols[i], y));
        y += 6;
        doc.setDrawColor(229, 231, 235);
        doc.line(40, y, w - 40, y);
        y += 16;

        doc.setTextColor(17, 24, 39);
        filtered.forEach((b) => {
            if (y > 790) {
                doc.addPage();
                y = 60;
            }
            doc.text(b.buyer_name.slice(0, 20), cols[0], y);
            doc.text(b.buyer_email.slice(0, 26), cols[1], y);
            doc.text(String(b.quantity), cols[2], y);
            doc.text(priceLabel(b.total_price), cols[3], y);
            doc.text(new Date(b.created_at).toLocaleDateString(), cols[4], y);
            doc.text(attendance(b), cols[5], y);
            y += 18;
        });
        doc.save("ticket-buyers.pdf");
    };

    const remindPending = () => {
        const emails = [...new Set((buyers ?? []).filter((b) => b.status === "completed" && !b.scanned_at).map((b) => b.buyer_email))];
        if (emails.length === 0) return toast.success("No pending attendees to remind.");
        setCompose({
            recipients: emails,
            subject: "Reminder: your upcoming event",
            body: "Hi there,\n\nThis is a friendly reminder about your upcoming event. We look forward to seeing you there!\n\nBest regards,\nThe organizing team",
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">Detailed Analytics / Ticket Buyers</p>
                <div className="flex gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setExportOpen((o) => !o)}
                            className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                            <svg className={`h-4 w-4 transition-transform ${exportOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {exportOpen && (
                            <>
                                <button className="fixed inset-0 z-10 cursor-default" onClick={() => setExportOpen(false)} aria-hidden tabIndex={-1} />
                                <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                                    <button onClick={() => { downloadCsv(); setExportOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Export as CSV
                                    </button>
                                    <button onClick={() => { downloadPdf(); setExportOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        Export as PDF
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        onClick={remindPending}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                        Send Reminder to All Pending
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by name or email"
                        className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">Filter Status:</label>
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="all">All</option>
                        <option value="attended">Attended</option>
                        <option value="not_scanned">Not Scanned</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            {filtered.length === 0 ? (
                <p className="py-12 text-center text-gray-500">No ticket buyers found.</p>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Buyer Details</th>
                                <th className="px-4 py-3">Qty</th>
                                <th className="px-4 py-3">Total Paid</th>
                                <th className="px-4 py-3">Purchase Date</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {shown.map((b) => {
                                const isOpen = expanded === b.order_id;
                                const canAttend = b.status === "completed" && !b.scanned_at;
                                return (
                                    <React.Fragment key={b.order_id}>
                                        <tr onClick={() => setExpanded(isOpen ? null : b.order_id)} className="cursor-pointer hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <svg className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{b.buyer_name}</p>
                                                        <p className="text-xs text-gray-500">{b.buyer_email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                    {b.quantity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{priceLabel(b.total_price)}</td>
                                            <td className="px-4 py-3 text-gray-600">{formatDateTime(b.created_at)}</td>
                                            <td className="px-4 py-3">
                                                {b.status === "completed" ? (
                                                    b.scanned_at ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold uppercase text-green-700">
                                                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                            Attended
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold uppercase text-gray-600">Not Scanned</span>
                                                    )
                                                ) : (
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusBadge[b.status] ?? "bg-gray-100 text-gray-700"}`}>
                                                        {b.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    {canAttend && (
                                                        <button
                                                            onClick={() => markAttended.mutate(b.order_id)}
                                                            disabled={markAttended.isPending}
                                                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                                        >
                                                            Mark Attended
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setCompose({ recipients: [b.buyer_email], subject: "Regarding your ticket", body: `Hi ${b.buyer_name},\n\n` })}
                                                        aria-label="Email buyer"
                                                        className="text-primary transition-colors hover:text-primary-dark"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isOpen && (
                                            <tr className="bg-gray-50/60">
                                                <td colSpan={6} className="px-6 py-4">
                                                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                                                        <Detail label="Order ID" value={`#LE-${b.order_id.slice(0, 8).toUpperCase()}`} />
                                                        <Detail label="Email" value={b.buyer_email} />
                                                        <Detail label="Quantity" value={`${b.quantity} ticket(s)`} />
                                                        <Detail label="Total Paid" value={priceLabel(b.total_price)} />
                                                        <Detail label="Payment" value={b.status} />
                                                        <Detail label="Purchased" value={formatDateTime(b.created_at)} />
                                                        <Detail label="Attendance" value={b.scanned_at ? "Attended" : "Not scanned"} />
                                                        {b.scanned_at && <Detail label="Checked in" value={formatDateTime(b.scanned_at)} />}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
                        <span>
                            Showing {start + 1} to {Math.min(start + pageSize, filtered.length)} of {filtered.length} entries
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current === 1} className="rounded-md border border-gray-300 px-2.5 py-1 disabled:opacity-40">‹</button>
                            {Array.from({ length: pageCount }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`rounded-md border px-3 py-1 ${current === i + 1 ? "border-primary bg-primary/10 font-semibold text-primary" : "border-gray-300 hover:bg-gray-50"}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={current === pageCount} className="rounded-md border border-gray-300 px-2.5 py-1 disabled:opacity-40">›</button>
                        </div>
                    </div>
                </div>
            )}

            {compose && (
                <ComposeEmailModal
                    recipients={compose.recipients}
                    defaultSubject={compose.subject}
                    defaultBody={compose.body}
                    sending={notify.isPending}
                    onClose={() => setCompose(null)}
                    onSend={(subject, body) => notify.mutate({ recipients: compose.recipients, subject, body })}
                />
            )}
        </div>
    );
}

function ComposeEmailModal({
    recipients,
    defaultSubject,
    defaultBody,
    sending,
    onSend,
    onClose,
}: {
    recipients: string[];
    defaultSubject: string;
    defaultBody: string;
    sending: boolean;
    onSend: (subject: string, body: string) => void;
    onClose: () => void;
}) {
    const [subject, setSubject] = useState(defaultSubject);
    const [body, setBody] = useState(defaultBody);
    const [showAll, setShowAll] = useState(false);
    const preview = showAll ? recipients : recipients.slice(0, 5);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Send Email</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="mb-4">
                    <p className="mb-1 text-sm font-medium text-gray-700">Recipients ({recipients.length})</p>
                    <div className="flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs">
                        {preview.map((r) => (
                            <span key={r} className="rounded-full bg-white px-2 py-0.5 text-gray-700 shadow-sm">{r}</span>
                        ))}
                        {recipients.length > 5 && (
                            <button onClick={() => setShowAll((v) => !v)} className="rounded-full px-2 py-0.5 font-medium text-primary">
                                {showAll ? "Show less" : `+${recipients.length - 5} more`}
                            </button>
                        )}
                    </div>
                </div>

                <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />

                <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
                <textarea
                    rows={7}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />

                <div className="mt-5 flex justify-end gap-3">
                    <button onClick={onClose} className="rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSend(subject, body)}
                        disabled={sending || recipients.length === 0}
                        className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                    >
                        {sending ? "Sending..." : `Send to ${recipients.length}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-0.5 font-medium capitalize text-gray-900">{value}</p>
        </div>
    );
}
