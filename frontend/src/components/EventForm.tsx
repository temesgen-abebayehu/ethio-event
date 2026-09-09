"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/endpoints";
import { uploadFiles } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { Event, EventPayload } from "@/lib/types";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

interface ImageItem {
    url: string;
    public_id: string;
    is_featured: boolean;
}

interface Props {
    initial?: Event;
    submitting: boolean;
    onSubmit: (payload: EventPayload) => void;
}

export function EventForm({ initial, submitting, onSubmit }: Props) {
    const router = useRouter();
    const toast = useToast();
    const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: api.categories });

    const [title, setTitle] = useState(initial?.title ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [categoryId, setCategoryId] = useState(initial?.category?.id ?? "");
    const [venue, setVenue] = useState(initial?.venue ?? "");
    const [address, setAddress] = useState(initial?.address ?? "");
    const [lat, setLat] = useState(initial?.latitude ?? 9.005401);
    const [lng, setLng] = useState(initial?.longitude ?? 38.763611);
    const [price, setPrice] = useState(initial?.price ?? 0);
    const [quantity, setQuantity] = useState(initial?.ticket?.quantity_total ?? 100);
    const [eventDate, setEventDate] = useState(
        initial ? initial.event_date.slice(0, 16) : ""
    );
    const [tagsText, setTagsText] = useState(initial?.tags.map((t) => t.name).join(", ") ?? "");
    const [images, setImages] = useState<ImageItem[]>(
        initial?.images.map((i) => ({ url: i.url, public_id: i.public_id, is_featured: i.is_featured })) ?? []
    );
    const [uploading, setUploading] = useState(false);

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            const res = await uploadFiles(Array.from(files).slice(0, 10));
            setImages((prev) => {
                const next = [...prev, ...res.files.map((f) => ({ ...f, is_featured: false }))];
                if (!next.some((i) => i.is_featured) && next.length > 0) next[0].is_featured = true;
                return next;
            });
        } catch {
            toast.error("Image upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const setFeatured = (idx: number) =>
        setImages((prev) => prev.map((img, i) => ({ ...img, is_featured: i === idx })));
    const removeImage = (idx: number) =>
        setImages((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            if (!next.some((i) => i.is_featured) && next.length > 0) next[0].is_featured = true;
            return next;
        });

    const addFiles = (files: FileList | null) => handleFiles(files);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (images.length === 0) return toast.error("Please add at least one image.");
        if (!images.some((i) => i.is_featured)) return toast.error("Please select a featured image.");
        const tags = tagsText.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10);
        onSubmit({
            title,
            description,
            category_id: categoryId,
            venue,
            address,
            latitude: lat,
            longitude: lng,
            price: Number(price),
            event_date: new Date(eventDate).toISOString(),
            ticket_quantity: Number(quantity),
            tags,
            images,
            status: "published",
        });
    };

    const label = "mb-1.5 block text-sm font-medium text-gray-700";
    const input =
        "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

    return (
        <form onSubmit={submit} className="space-y-10 rounded-2xl bg-white p-6 shadow-sm md:p-8">
            {/* Basic Details */}
            <section>
                <h2 className="mb-5 border-b border-gray-200 pb-3 text-xl font-bold text-gray-900">Basic Details</h2>
                <div className="space-y-5">
                    <div>
                        <label className={label}>Event Title <span className="text-red-500">*</span></label>
                        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Addis Ababa Tech Meetup" className={input} />
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className={label}>Category</label>
                            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={input}>
                                <option value="">Select category</option>
                                {categories?.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={label}>Tags (Comma separated)</label>
                            <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g., startup, networking, ai" className={input} />
                        </div>
                    </div>

                    <div>
                        <label className={label}>Description</label>
                        <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what your event is about..." className={input} />
                    </div>
                </div>
            </section>

            {/* Event Media */}
            <section>
                <h2 className="mb-5 border-b border-gray-200 pb-3 text-xl font-bold text-gray-900">Event Media</h2>
                <label className={label}>Event Images</label>
                <label
                    htmlFor="event-images"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        addFiles(e.dataTransfer.files);
                    }}
                    className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 text-center transition-colors hover:border-primary"
                >
                    <svg className="mb-2 h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6.1 3.5 3.5 0 0118 13h-1m-6 4V9m0 0l-3 3m3-3l3 3" />
                    </svg>
                    <p className="text-sm text-gray-600">
                        <span className="font-medium text-primary">Upload a file</span> or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    <input id="event-images" type="file" accept="image/*" multiple onChange={(e) => addFiles(e.target.files)} className="sr-only" />
                </label>
                {uploading && <p className="mt-2 text-sm text-gray-500">Uploading...</p>}
                {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                        {images.map((img, idx) => (
                            <div key={img.public_id} className="group relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={img.url}
                                    alt=""
                                    className={`h-24 w-full rounded-lg border-2 object-cover ${img.is_featured ? "border-primary" : "border-transparent"}`}
                                />
                                {img.is_featured && (
                                    <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                        Featured
                                    </span>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                    {!img.is_featured && (
                                        <button type="button" onClick={() => setFeatured(idx)} className="rounded bg-white px-2 py-1 text-[10px] font-semibold">
                                            Set featured
                                        </button>
                                    )}
                                    <button type="button" onClick={() => removeImage(idx)} className="rounded bg-red-500 px-2 py-1 text-[10px] font-semibold text-white">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Date & Location */}
            <section>
                <h2 className="mb-5 border-b border-gray-200 pb-3 text-xl font-bold text-gray-900">Date &amp; Location</h2>
                <div className="space-y-5">
                    <div>
                        <label className={label}>Event Date &amp; Time <span className="text-red-500">*</span></label>
                        <input required type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={input} />
                    </div>
                    <div>
                        <label className={label}>Venue Name</label>
                        <input required value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g., Skylight Hotel" className={input} />
                    </div>
                    <div>
                        <label className={label}>Address</label>
                        <input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address, neighborhood" className={input} />
                    </div>
                    <div>
                        <label className={label}>Pin Location</label>
                        <LocationPicker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
                    </div>
                </div>
            </section>

            {/* Ticketing */}
            <section>
                <h2 className="mb-5 border-b border-gray-200 pb-3 text-xl font-bold text-gray-900">Ticketing</h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label className={label}>Ticket Price (ETB)</label>
                        <input required type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="0 for Free" className={input} />
                    </div>
                    <div>
                        <label className={label}>Total Tickets Available</label>
                        <input required type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} placeholder="e.g., 500" className={input} />
                    </div>
                </div>
            </section>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-lg border border-gray-300 px-6 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                >
                    {submitting ? "Saving..." : initial ? "Update Event" : "Create Event"}
                </button>
            </div>
        </form>
    );
}
