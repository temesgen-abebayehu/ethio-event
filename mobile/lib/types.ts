// Types mirroring the backend REST DTOs (subset used by the mobile app).
export type Role = "user" | "organizer" | "admin";

export interface User {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    city?: string;
    role: Role;
    created_at?: string;
}

export interface AuthResponse {
    access_token: string;
    user: User;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
}

export interface Tag {
    id: string;
    name: string;
}

export interface EventImage {
    url: string;
    public_id: string;
    is_featured: boolean;
}

export interface Ticket {
    id: string;
    price: number;
    quantity_total: number;
    quantity_sold: number;
}

export interface Event {
    id: string;
    slug: string;
    title: string;
    description: string;
    category?: Category;
    venue: string;
    address: string;
    latitude: number;
    longitude: number;
    price: number;
    event_date: string;
    status: string;
    time_status: "upcoming" | "ongoing" | "past";
    images: EventImage[];
    tags: Tag[];
    ticket?: Ticket;
    tickets_remaining: number;
    is_sold_out: boolean;
    organizer_name: string;
}

export interface EventList {
    events: Event[];
    total: number;
}

export interface Order {
    id: string;
    quantity: number;
    total_price: number;
    status: "pending" | "completed" | "failed" | "refunded";
    chapa_tx_ref: string;
    scanned_at?: string | null;
    created_at: string;
    event?: Event;
}

export interface EventBuyer {
    order_id: string;
    buyer_name: string;
    buyer_email: string;
    quantity: number;
    total_price: number;
    status: "pending" | "completed" | "failed" | "refunded";
    scanned_at?: string | null;
    created_at: string;
}

export interface ScanResult {
    order_id: string;
    buyer_name: string;
    event_title: string;
    quantity: number;
    scanned_at: string;
}

export interface InteractionStatus {
    bookmarked: boolean;
    following: boolean;
}

export interface InitiatePaymentResponse {
    checkout_url?: string;
    tx_ref: string;
    total_price: number;
    order_id: string;
    status: string;
}

export interface EventFilters {
    q?: string;
    category_id?: string;
    free?: boolean;
    min_price?: number;
    max_price?: number;
    sort?: string;
    order?: string;
    limit?: number;
    offset?: number;
}
