"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function AnalyticsPage() {
    const { ready } = useRequireAuth({ admin: true });
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["analytics"],
        queryFn: api.analytics,
        enabled: ready,
    });

    if (!ready || isLoading) return <LoadingSpinner className="py-24" />;

    if (isError)
        return (
            <div className="py-24 text-center">
                <p className="mb-4 text-gray-600">Couldn&apos;t load analytics.</p>
                <button onClick={() => refetch()} className="rounded-lg bg-primary px-4 py-2 font-medium text-white">
                    Retry
                </button>
            </div>
        );

    const a = data!;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="mb-6 text-3xl font-bold">Analytics</h1>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat label="Total Users" value={a.total_users} />
                <Stat label="Tickets Sold" value={a.total_tickets_sold} />
                <Stat label="Top Category" value={a.top_category?.category_name ?? "—"} />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold">Tickets Sold by Category</h2>
                <div className="space-y-3">
                    {a.sales_by_category.map((s) => (
                        <div key={s.category_id} className="flex items-center justify-between">
                            <span className="text-gray-700">{s.category_name}</span>
                            <span className="font-semibold">{s.tickets_sold}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-primary">{value}</p>
        </div>
    );
}
