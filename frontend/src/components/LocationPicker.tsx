"use client";

import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";

const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

interface Props {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ lat, lng, onChange }: Props) {
    return (
        <div>
            <p className="mb-2 text-sm text-gray-500">Click on the map to set the event location.</p>
            <div className="h-64 w-full overflow-hidden rounded-xl">
                <MapContainer center={[lat, lng]} zoom={13}>
                    <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[lat, lng]} icon={icon} />
                    <ClickHandler onPick={onChange} />
                </MapContainer>
            </div>
            <p className="mt-2 text-xs text-gray-500">
                Selected: {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
        </div>
    );
}
