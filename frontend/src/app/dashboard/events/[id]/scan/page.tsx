"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { formatDateTime } from "@/lib/format";
import type { ScanResult } from "@/lib/types";

type Outcome =
    | { kind: "success"; result: ScanResult }
    | { kind: "error"; message: string };

export default function ScanTicketsPage() {
    const { id } = useParams<{ id: string }>();
    const { ready } = useRequireAuth({ organizer: true });
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lockRef = useRef(false);
    const [scanning, setScanning] = useState(false);
    const [starting, setStarting] = useState(false);
    const [checking, setChecking] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [cameraError, setCameraError] = useState("");
    const [manual, setManual] = useState("");

    useEffect(() => {
        return () => {
            const s = scannerRef.current;
            if (s) s.stop().then(() => s.clear()).catch(() => { });
        };
    }, []);

    const stopCamera = async () => {
        const s = scannerRef.current;
        if (s) {
            try { await s.stop(); } catch { /* already stopped */ }
            try { await s.clear(); } catch { /* ignore */ }
        }
        setScanning(false);
    };

    const verify = async (code: string) => {
        setChecking(true);
        try {
            const result = await api.scanTicket(code);
            setOutcome({ kind: "success", result });
        } catch (err) {
            setOutcome({ kind: "error", message: err instanceof ApiError ? err.message : "Scan failed" });
        } finally {
            setChecking(false);
        }
    };

    // Stop the camera after the first decode, then verify — one scan per session.
    const handleDecode = async (decoded: string) => {
        if (lockRef.current) return;
        lockRef.current = true;
        await stopCamera();
        await verify(decoded);
    };

    const startCamera = async () => {
        setOutcome(null);
        setCameraError("");
        lockRef.current = false;
        setStarting(true);
        const scanner = scannerRef.current ?? new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        try {
            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                (decoded) => void handleDecode(decoded),
                () => { },
            );
            setScanning(true);
        } catch {
            setCameraError("Unable to access the camera. Allow camera permission and open this page over HTTPS or on localhost.");
        } finally {
            setStarting(false);
        }
    };

    const submitManual = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = manual.trim();
        if (!code) return;
        setManual("");
        if (scanning) await stopCamera();
        await verify(code);
    };

    if (!ready) return <LoadingSpinner className="py-24" />;

    return (
        <div className="mx-auto max-w-lg px-4 py-8">
            <Link href={`/dashboard/events/${id}?tab=buyers`} className="mb-4 inline-flex items-center gap-1 text-gray-600 transition-colors hover:text-primary">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </Link>

            <h1 className="mb-1 text-3xl font-bold text-gray-900">Scan Tickets</h1>
            <p className="mb-6 text-gray-500">Tap “Scan QR Code”, point the camera at a ticket, and check in the attendee.</p>

            {/* Camera / scan box */}
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-gray-900">
                <div id="qr-reader" className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />

                {scanning && (
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute left-6 top-6 h-10 w-10 rounded-tl-lg border-l-4 border-t-4 border-white/80" />
                        <div className="absolute right-6 top-6 h-10 w-10 rounded-tr-lg border-r-4 border-t-4 border-white/80" />
                        <div className="absolute bottom-6 left-6 h-10 w-10 rounded-bl-lg border-b-4 border-l-4 border-white/80" />
                        <div className="absolute bottom-6 right-6 h-10 w-10 rounded-br-lg border-b-4 border-r-4 border-white/80" />
                    </div>
                )}

                {!scanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-500">{outcome ? "Camera is off" : "Camera is ready"}</p>
                        {!outcome && (
                            <button
                                onClick={startCamera}
                                disabled={starting}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {starting ? "Starting…" : "Scan QR Code"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {scanning && (
                <button onClick={stopCamera} className="mx-auto mt-3 block w-full max-w-sm rounded-lg border border-gray-300 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50">
                    Stop Camera
                </button>
            )}

            {cameraError && <div className="mx-auto mt-4 max-w-sm rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{cameraError}</div>}

            {/* Result */}
            {outcome && (
                <div className={`mx-auto mt-6 max-w-sm rounded-2xl border p-6 text-center shadow-sm ${outcome.kind === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                    {outcome.kind === "success" ? (
                        <>
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
                                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-lg font-bold text-green-800">Checked in</p>
                            <p className="mt-1 font-semibold text-gray-900">{outcome.result.buyer_name}</p>
                            <p className="text-sm text-gray-600">{outcome.result.quantity}x · {outcome.result.event_title}</p>
                            <p className="mt-1 text-xs text-gray-500">{formatDateTime(outcome.result.scanned_at)}</p>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white">
                                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <p className="text-lg font-bold text-red-800">Not valid</p>
                            <p className="mt-1 text-sm text-red-700">{outcome.message}</p>
                        </>
                    )}
                    <button onClick={startCamera} className="mt-5 rounded-lg bg-primary px-6 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark">
                        Scan Again
                    </button>
                </div>
            )}

            {/* Manual entry */}
            <div className="mx-auto mt-6 max-w-sm rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-medium text-gray-700">Verify by code</p>
                <form onSubmit={submitManual} className="flex gap-2">
                    <input
                        value={manual}
                        onChange={(e) => setManual(e.target.value)}
                        placeholder="Enter ticket code"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button type="submit" disabled={checking} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50">
                        {checking ? "…" : "Check In"}
                    </button>
                </form>
                <p className="mt-2 text-xs text-gray-400">Type or paste the ticket code if the camera isn’t available.</p>
            </div>
        </div>
    );
}
