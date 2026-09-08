import type { Event } from "./types";

export function formatPrice(price: number): string {
    return new Intl.NumberFormat("en-US").format(price);
}

export function priceLabel(price: number): string {
    return price === 0 ? "FREE" : `${formatPrice(price)} ETB`;
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function eventDay(date: string): string {
    return String(new Date(date).getDate());
}

export function eventMonth(date: string): string {
    return MONTHS[new Date(date).getMonth()];
}

export function formatDateTime(date: string): string {
    return new Date(date).toLocaleString(undefined, {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function featuredImage(event: Event): string | undefined {
    const featured = event.images?.find((i) => i.is_featured);
    return featured?.url || event.images?.[0]?.url;
}
export function eventRevenue(event: Event): number {
    if (!event.ticket) return 0;
    return event.ticket.quantity_sold * event.ticket.price;
}