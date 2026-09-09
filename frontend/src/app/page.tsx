"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import type { EventFilters } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { EventCardSkeleton } from "@/components/EventCardSkeleton";

const EventsMap = dynamic(() => import("@/components/EventsMap"), { ssr: false });

const PAGE_SIZE = 12;

function isoDate(d: Date) {
    return d.toISOString().slice(0, 10);
}

export default function HomePage() {
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [freeOnly, setFreeOnly] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [view, setView] = useState<"grid" | "map">("grid");
    const [page, setPage] = useState(0);

    const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: api.categories });

    const filters: EventFilters = {
        q: search || undefined,
        category_id: categoryId || undefined,
        free: freeOnly || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit: view === "map" ? 100 : PAGE_SIZE,
        offset: view === "map" ? 0 : page * PAGE_SIZE,
    };

    const { data, isLoading, isError } = useQuery({
        queryKey: ["events", filters],
        queryFn: () => api.listEvents(filters),
        placeholderData: keepPreviousData,
    });

    const events = data?.events ?? [];
    const total = data?.total_count ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const reset =
        <T,>(setter: (v: T) => void) =>
            (v: T) => {
                setter(v);
                setPage(0);
            };

    const setToday = () => {
        const t = isoDate(new Date());
        reset(setDateFrom)(t);
        reset(setDateTo)(t);
    };
    const setThisWeek = () => {
        const now = new Date();
        const end = new Date();
        end.setDate(now.getDate() + 7);
        reset(setDateFrom)(isoDate(now));
        reset(setDateTo)(isoDate(end));
    };
    const clearAll = () => {
        setSearch("");
        setCategoryId("");
        setFreeOnly(false);
        setMinPrice("");
        setMaxPrice("");
        setDateFrom("");
        setDateTo("");
        setPage(0);
    };

    const pill = (active: boolean) =>
        `rounded-full px-5 py-2.5 text-sm font-medium transition-all ${active ? "bg-primary text-white shadow" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        }`;

    return (
        <div>
            {/* Hero */}
            <section className="relative flex h-[560px] items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/consert2.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/70 to-pink-900/70" />
                <div className="relative z-10 w-full max-w-3xl px-6 text-center text-white">
                    <h1 className="text-5xl font-bold leading-tight md:text-6xl">
                        Find your next{" "}
                        <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                            experience
                        </span>
                    </h1>
                    <p className="mt-4 text-xl font-light text-white/90">
                        Discover amazing events happening in Ethiopia
                    </p>

                    <div className="mt-8 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl">
                        <svg className="ml-3 h-6 w-6 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            value={search}
                            onChange={(e) => reset(setSearch)(e.target.value)}
                            placeholder="Search events, venues, or tags..."
                            className="flex-1 bg-transparent px-2 py-3 text-gray-900 outline-none"
                        />
                        <button className="rounded-xl bg-gradient-to-r from-primary to-pink-500 px-6 py-3 font-semibold text-white">
                            Search
                        </button>
                    </div>
                </div>

                <svg className="absolute bottom-0 left-0 w-full text-gray-50" viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ height: 60 }}>
                    <path fill="currentColor" d="M0,64 C240,100 480,20 720,48 C960,76 1200,100 1440,56 L1440,100 L0,100 Z" />
                </svg>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-8">
                {/* Category pills */}
                <div className="mb-6 flex flex-wrap gap-2">
                    <button onClick={() => reset(setCategoryId)("")} className={pill(categoryId === "")}>
                        All Events
                    </button>
                    {categories?.map((c) => (
                        <button key={c.id} onClick={() => reset(setCategoryId)(c.id)} className={pill(categoryId === c.id)}>
                            {c.name}
                        </button>
                    ))}
                </div>

                {/* Filters + view controls */}
                <div className="mb-8 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowFilters((s) => !s)}
                                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                                </svg>
                                Filters
                            </button>
                            <span className="text-sm text-gray-500">{total} events found</span>
                        </div>
                        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1">
                            <button
                                onClick={() => setView("grid")}
                                className={`rounded-md p-2 ${view === "grid" ? "bg-primary text-white" : "text-gray-500"}`}
                                aria-label="Grid view"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setView("map")}
                                className={`rounded-md p-2 ${view === "map" ? "bg-primary text-white" : "text-gray-500"}`}
                                aria-label="Map view"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Quick filter pills */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => reset(setFreeOnly)(!freeOnly)} className={`${pill(freeOnly)} !px-4 !py-1.5`}>
                            Free Events
                        </button>
                        <button onClick={setToday} className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Today
                        </button>
                        <button onClick={setThisWeek} className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            This Week
                        </button>
                        <button onClick={clearAll} className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Clear All
                        </button>
                    </div>

                    {/* Advanced filters */}
                    {showFilters && (
                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 md:grid-cols-5">
                            <select value={categoryId} onChange={(e) => reset(setCategoryId)(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                                <option value="">All categories</option>
                                {categories?.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <input type="date" value={dateFrom} onChange={(e) => reset(setDateFrom)(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            <input type="date" value={dateTo} onChange={(e) => reset(setDateTo)(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            <input type="number" value={minPrice} onChange={(e) => reset(setMinPrice)(e.target.value)} placeholder="Min price" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            <input type="number" value={maxPrice} onChange={(e) => reset(setMaxPrice)(e.target.value)} placeholder="Max price" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                    )}
                </div>

                {/* Results */}
                {isError ? (
                    <div className="py-16 text-center text-gray-500">Something went wrong loading events.</div>
                ) : view === "map" ? (
                    <EventsMap events={events} />
                ) : isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <EventCardSkeleton key={i} />
                        ))}
                    </div>
                ) : events.length === 0 ? (
                    <div className="py-20 text-center">
                        <svg className="mx-auto mb-4 h-24 w-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-2xl font-bold text-gray-800">No events found</p>
                        <p className="mt-1 text-gray-500">Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {events.map((e) => (
                                <EventCard key={e.id} event={e} />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-10 flex flex-col items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50">
                                        Previous
                                    </button>
                                    <span className="px-4 text-sm font-medium text-gray-700">
                                        {page + 1} / {totalPages}
                                    </span>
                                    <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50">
                                        Next
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, total)} of {total} events
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
