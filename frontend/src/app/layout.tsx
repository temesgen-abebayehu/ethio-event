import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Providers } from "./providers";
import { Chrome } from "@/components/Chrome";

export const metadata: Metadata = {
    title: "LocalEvent Ethiopia",
    description: "Discover, create, and buy tickets to events across Ethiopia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen flex flex-col">
                <Providers>
                    <Chrome>{children}</Chrome>
                </Providers>
            </body>
        </html>
    );
}
