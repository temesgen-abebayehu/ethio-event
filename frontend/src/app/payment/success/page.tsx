"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { priceLabel } from "@/lib/format";

function SuccessInner() {
    const params = useSearchParams();
    const txRef = params.get("tx_ref") || params.get("trx_ref") || "";

    const { data: order, isLoading, isError } = useQuery({
        queryKey: ["verify", txRef],
        queryFn: () => api.verifyPayment(txRef),
        enabled: !!txRef,
        retry: 2,
    });

    if (isLoading)
        return (
            <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <LoadingSpinner className="mb-4" />
                <p className="text-gray-600">Verifying your payment...</p>
            </div>
        );

    const completed = order?.status === "completed";

    if (isError || !completed) {
        return (
            <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-500">
                    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="mb-2 text-2xl font-bold">Verification Issue</h1>
                <p className="mb-8 text-gray-600">We couldn&apos;t confirm your payment. Please check your tickets.</p>
                <div className="space-y-3">
                    <Link href="/dashboard/tickets" className="block w-full rounded-lg bg-primary py-3 font-semibold text-white hover:bg-primary-dark">
                        Check My Tickets
                    </Link>
                    <Link href="/" className="block text-gray-600 hover:text-primary">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="mb-8 text-gray-600">Your payment has been processed successfully.</p>

            <div className="mb-8 rounded-xl border border-gray-100 p-5 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-gray-600">Transaction Reference</span>
                    <span className="font-mono font-semibold text-gray-900">{order.chapa_tx_ref}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="text-gray-600">Quantity</span>
                    <span className="font-semibold text-gray-900">{order.quantity}x General Admission</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-gray-600">Total Paid</span>
                    <span className="text-2xl font-extrabold text-primary">{priceLabel(order.total_price)}</span>
                </div>
            </div>

            <Link href="/dashboard/tickets" className="block w-full rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark">
                View My Tickets
            </Link>
            <Link href="/" className="mt-4 block text-sm font-semibold text-primary hover:underline">
                Browse More Events
            </Link>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-gray-50 px-4 py-12">
            <Suspense fallback={<LoadingSpinner className="py-24" />}>
                <SuccessInner />
            </Suspense>
        </div>
    );
}
