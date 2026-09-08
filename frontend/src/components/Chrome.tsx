"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// Auth screens render as a standalone centered card without the site header/footer.
const BARE_PREFIXES = ["/auth"];

export function Chrome({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const bare = BARE_PREFIXES.some((p) => pathname?.startsWith(p));

    if (bare) return <main className="flex-1">{children}</main>;

    return (
        <>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
        </>
    );
}
