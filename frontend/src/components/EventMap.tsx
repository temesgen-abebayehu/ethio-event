"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";

// Fix default marker icons for bundlers.
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function EventMap({ lat, lng }: { lat: number; lng: number }) {
    return (
        <div className="h-64 w-full overflow-hidden rounded-xl">
            <MapContainer center={[lat, lng]} zoom={14} scrollWheelZoom={false}>
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]} icon={icon} />
            </MapContainer>
        </div>
    );
}
