"use client";

import Link from "next/link";
import { useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatDateTime, priceLabel } from "@/lib/format";
import type { Order } from "@/lib/types";

const badge: Record<string, string> = {
    completed: "bg-primary/10 text-primary",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
};

export default function MyTicketsPage() {
    const { ready } = useRequireAuth();
    const { data, isLoading } = useQuery({
        queryKey: ["my-tickets"],
        queryFn: api.myTickets,
        enabled: ready,
    });

    if (!ready || isLoading) return <LoadingSpinner className="py-24" />;

    const orders = data ?? [];

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <h1 className="mb-6 text-4xl font-bold text-gray-900">My Tickets</h1>

            {orders.length === 0 ? (
                <div className="py-20 text-center">
                    <svg className="mx-auto mb-4 h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <p className="text-2xl font-bold text-gray-800">No tickets yet</p>
                    <p className="mt-1 text-gray-500">Purchase tickets to events you want to attend.</p>
                    <Link href="/" className="mt-4 inline-block font-medium text-primary hover:underline">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="space-y-5">
                    {orders.map((o) => (
                        <TicketCard key={o.id} order={o} />
                    ))}
                </div>
            )}
        </div>
    );
}

function TicketCard({ order: o }: { order: Order }) {
    const past = o.event?.time_status === "past";
    const orderRef = `#LE-${o.id.slice(0, 8).toUpperCase()}`;
    const qrRef = useRef<HTMLDivElement>(null);

    const downloadPdf = () => {
        const canvas = qrRef.current?.querySelector("canvas");
        const qr = canvas?.toDataURL("image/png");
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const w = doc.internal.pageSize.getWidth();

        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, w, 70, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text("LocalEvent Ticket", 40, 44);

        doc.setTextColor(17, 24, 39);
        doc.setFontSize(18);
        doc.text(o.event?.title ?? "Event", 40, 120);

        doc.setFontSize(11);
        doc.setTextColor(75, 85, 99);
        const lines = [
            `Date: ${o.event ? formatDateTime(o.event.event_date) : "-"}`,
            `Venue: ${o.event?.venue ?? "-"}`,
            `Order: ${orderRef}`,
            `Tickets: ${o.quantity}x General Admission`,
            `Total Paid: ${priceLabel(o.total_price)}`,
        ];
        lines.forEach((line, i) => doc.text(line, 40, 155 + i * 22));

        if (qr) doc.addImage(qr, "PNG", w - 190, 110, 150, 150);

        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text("Present this QR code at the entrance for check-in.", 40, 300);
        doc.save(`ticket-${o.id.slice(0, 8)}.pdf`);
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row">
                {/* Details */}
                <div className="flex-1 p-6">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${o.scanned_at ? "bg-green-100 text-green-700" : past ? "bg-gray-100 text-gray-600" : badge[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {o.scanned_at ? "Checked In" : past ? "Past Event" : o.status === "completed" ? "Completed" : o.status}
                    </span>

                    <h2 className={`mt-2 text-2xl font-bold ${past ? "text-gray-500" : "text-gray-900"}`}>
                        {o.event?.title ?? "Event"}
                    </h2>

                    <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-gray-600 sm:grid-cols-2">
                        {o.event && (
                            <p className="flex items-center gap-2">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDateTime(o.event.event_date)}
                            </p>
                        )}
                        {o.event && (
                            <p className="flex items-center gap-2">
                                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {o.event.venue}
                            </p>
                        )}
                        <p className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Order {orderRef}
                        </p>
                        <p className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {o.quantity}x General Admission
                        </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                        <span className="text-sm text-gray-500">Purchased: {formatDateTime(o.created_at)}</span>
                        <span className="text-2xl font-extrabold text-primary">{priceLabel(o.total_price)}</span>
                    </div>
                </div>

                {/* QR / status */}
                <div className="flex flex-col items-center justify-center gap-2 border-t border-gray-100 p-6 sm:border-l sm:border-t-0">
                    {o.scanned_at ? (
                        <>
                            <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-green-50 text-green-500">
                                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-xs font-medium text-green-600">Checked In</p>
                        </>
                    ) : past ? (
                        <>
                            <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-xs font-medium text-gray-500">Ended</p>
                        </>
                    ) : o.status === "completed" ? (
                        <>
                            <div className="rounded-lg bg-white p-2">
                                <QRCodeSVG value={`LE-TICKET:${o.id}`} size={124} level="M" />
                            </div>
                            <div ref={qrRef} className="hidden">
                                <QRCodeCanvas value={`LE-TICKET:${o.id}`} size={256} level="M" />
                            </div>
                            <button
                                onClick={downloadPdf}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download PDF
                            </button>
                            <button
                                onClick={() => navigator.clipboard?.writeText(`LE-TICKET:${o.id}`)}
                                className="text-xs text-gray-400 hover:text-primary"
                            >
                                Copy code
                            </button>
                        </>
                    ) : (
                        <div className="flex h-32 w-32 flex-col items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
                            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-1 text-xs font-medium capitalize">{o.status}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
