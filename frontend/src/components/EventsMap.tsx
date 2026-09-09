"use client";

import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { Event } from "@/lib/types";
import { priceLabel } from "@/lib/format";

const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Addis Ababa default center.
const CENTER: [number, number] = [9.0054, 38.7636];

export default function EventsMap({ events }: { events: Event[] }) {
    const withCoords = events.filter((e) => e.latitude && e.longitude);
    const center = withCoords[0]
        ? ([withCoords[0].latitude, withCoords[0].longitude] as [number, number])
        : CENTER;

    return (
        <div className="h-[600px] w-full overflow-hidden rounded-xl border border-gray-200">
            <MapContainer center={center} zoom={12}>
                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {withCoords.map((e) => (
                    <Marker key={e.id} position={[e.latitude, e.longitude]} icon={icon}>
                        <Popup>
                            <div className="space-y-1">
                                <p className="font-semibold">{e.title}</p>
                                <p className="text-xs text-gray-500">{e.venue}</p>
                                <p className="text-xs font-medium text-primary">{priceLabel(e.price)}</p>
                                <Link href={`/events/${e.slug}`} className="text-xs font-semibold text-primary underline">
                                    View details
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
