"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { featuredImage, formatDateTime, priceLabel } from "@/lib/format";

export default function CheckoutPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const { ready } = useRequireAuth();
    const router = useRouter();
    const toast = useToast();
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);

    const { data: event, isLoading } = useQuery({
        queryKey: ["event", eventId],
        queryFn: () => api.getEvent(eventId),
        enabled: ready,
    });

    if (!ready || isLoading || !event) return <LoadingSpinner className="py-24" />;

    const total = event.price * quantity;
    const img = featuredImage(event);

    const pay = async () => {
        setError("");
        setProcessing(true);
        try {
            const res = await api.initiatePayment(event.id, quantity);
            if (res.checkout_url) {
                window.location.href = res.checkout_url;
            } else {
                toast.success("Tickets confirmed!");
                router.push(`/payment/success?tx_ref=${res.tx_ref}`);
            }
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Payment failed");
            setProcessing(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-10">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-gray-600 transition-colors hover:text-primary">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>

                <h1 className="mb-6 text-4xl font-bold text-gray-900">Checkout</h1>

                {/* Event summary */}
                <div className="mb-8 flex gap-4 rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="h-24 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : null}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDateTime(event.event_date)}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {event.venue}
                        </p>
                    </div>
                </div>

                {/* Select tickets */}
                <h3 className="mb-4 border-b border-gray-200 pb-3 text-lg font-bold text-gray-900">Select Tickets</h3>
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-gray-900">General Admission</p>
                        <p className="text-sm text-gray-500">{priceLabel(event.price)}</p>
                    </div>
                    <div className="flex items-center rounded-lg border border-gray-300">
                        <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3.5 py-2 text-lg text-gray-600 hover:text-primary" aria-label="Decrease">
                            −
                        </button>
                        <span className="w-12 border-x border-gray-300 py-2 text-center font-semibold">{quantity}</span>
                        <button onClick={() => setQuantity((q) => Math.min(event.tickets_remaining, q + 1))} className="px-3.5 py-2 text-lg text-gray-600 hover:text-primary" aria-label="Increase">
                            +
                        </button>
                    </div>
                </div>

                {/* Order summary */}
                <div className="rounded-xl bg-primary/5 p-6">
                    <h3 className="mb-4 font-bold text-gray-900">Order Summary</h3>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>General Admission (x{quantity})</span>
                        <span>{priceLabel(total)}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-gray-600">
                        <span>Service Fee</span>
                        <span>{event.price === 0 ? "Free" : priceLabel(0)}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-primary/20 pt-4">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="text-3xl font-extrabold text-primary">{priceLabel(total)}</span>
                    </div>
                    <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Secure Encrypted Transaction
                    </p>
                </div>

                {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => router.back()} className="rounded-lg border border-gray-300 px-6 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        onClick={pay}
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                    >
                        {processing ? "Processing..." : event.price === 0 ? "Get Tickets" : "Pay with Chapa"}
                        {!processing && (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
