// Types mirroring the backend REST DTOs.

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

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    is_active: boolean;
    event_count: number;
}

export interface Tag {
    id: string;
    name: string;
}

export interface EventImage {
    id: string;
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
    user_id: string;
    title: string;
    description: string;
    venue: string;
    address: string;
    latitude: number;
    longitude: number;
    price: number;
    event_date: string;
    status: "draft" | "published";
    created_at: string;
    organizer_name: string;
    category?: Category;
    images: EventImage[];
    tags: Tag[];
    ticket?: Ticket;
    tickets_remaining: number;
    is_sold_out: boolean;
    time_status: "past" | "upcoming" | "ongoing";
}

export interface EventList {
    events: Event[];
    total_count: number;
}

export interface AuthResponse {
    access_token: string;
    user: User;
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

export interface InteractionStatus {
    bookmarked: boolean;
    following: boolean;
}

export interface UploadedFile {
    url: string;
    public_id: string;
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

export interface CategorySales {
    category_id: string;
    category_name: string;
    tickets_sold: number;
}

export interface Analytics {
    total_users: number;
    total_tickets_sold: number;
    sales_by_category: CategorySales[];
    top_category: CategorySales | null;
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
    min_price?: number;
    max_price?: number;
    free?: boolean;
    date_from?: string;
    date_to?: string;
    sort?: "event_date" | "price" | "created_at";
    order?: "asc" | "desc";
    limit?: number;
    offset?: number;
}

export interface EventPayload {
    title: string;
    description: string;
    category_id: string;
    venue: string;
    address: string;
    latitude: number;
    longitude: number;
    price: number;
    event_date: string;
    ticket_quantity: number;
    tags: string[];
    images: { url: string; public_id: string; is_featured: boolean }[];
    status?: string;
}
