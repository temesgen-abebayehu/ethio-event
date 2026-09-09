"use client";

import Link from "next/link";
import type { Event } from "@/lib/types";
import { eventDay, eventMonth, featuredImage, formatTime, priceLabel } from "@/lib/format";

export function EventCard({ event }: { event: Event }) {
    const image = featuredImage(event);

    return (
        <Link
            href={`/events/${event.slug}`}
            className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
        >
            <div className="relative h-56 overflow-hidden bg-gray-100">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={image}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
                        <svg className="h-20 w-20 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                <div className="absolute right-4 top-4 rounded-full bg-white/95 px-4 py-2 shadow-lg backdrop-blur-sm">
                    <span className="font-bold text-primary">{priceLabel(event.price)}</span>
                </div>

                <div className="absolute left-4 top-4 min-w-[60px] rounded-xl bg-white p-2 text-center shadow-lg">
                    <div className="text-xs font-semibold uppercase text-gray-500">{eventMonth(event.event_date)}</div>
                    <div className="text-2xl font-bold text-gray-900">{eventDay(event.event_date)}</div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>

            <div className="p-5">
                {event.category && (
                    <span className="mb-3 inline-flex items-center rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-primary">
                        {event.category.name}
                    </span>
                )}

                <h3 className="mb-2 line-clamp-2 text-xl font-bold leading-tight text-gray-900 transition-colors group-hover:text-primary">
                    {event.title}
                </h3>

                <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">{event.description}</p>

                {event.tags?.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                        {event.tags.slice(0, 3).map((t) => (
                            <span key={t.id} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                {t.name}
                            </span>
                        ))}
                        {event.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs font-medium text-primary">+{event.tags.length - 3}</span>
                        )}
                    </div>
                )}

                <div className="space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-1 font-medium">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{formatTime(event.event_date)}</span>
                    </div>
                </div>

                {/* CTA on hover */}
                <div className="mt-4 max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-10 group-hover:opacity-100">
                    <div className="flex items-center justify-between font-semibold text-primary">
                        <span>View Details</span>
                        <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
}
