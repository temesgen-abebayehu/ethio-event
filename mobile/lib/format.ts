export function priceLabel(price: number): string {
    return price === 0 ? "Free" : `${price.toLocaleString()} ETB`;
}

export function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function memberSince(iso?: string): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function featuredImage(event: { images?: { url: string; is_featured: boolean }[] }): string | undefined {
    const imgs = event.images ?? [];
    return (imgs.find((i) => i.is_featured) ?? imgs[0])?.url;
}

export function initials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}
