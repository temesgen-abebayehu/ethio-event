import { request } from "./api";
import type {
    Analytics,
    AuthResponse,
    Category,
    Event,
    EventBuyer,
    EventFilters,
    EventList,
    EventPayload,
    InitiatePaymentResponse,
    InteractionStatus,
    Order,
    ScanResult,
    Tag,
    User,
} from "./types";

export const api = {
    // ---- Auth ----
    signup: (body: { full_name: string; email: string; password: string; role: string }) =>
        request<AuthResponse>("/auth/signup", { method: "POST", body }),
    login: (body: { email: string; password: string }) =>
        request<AuthResponse>("/auth/login", { method: "POST", body }),
    me: () => request<User>("/auth/me", { auth: true }),
    updateProfile: (body: { full_name: string; phone: string; city: string; avatar_url: string }) =>
        request<User>("/auth/me", { method: "PUT", body, auth: true }),
    changePassword: (body: { current_password: string; new_password: string }) =>
        request<{ message: string }>("/auth/change-password", { method: "POST", body, auth: true }),
    forgotPassword: (email: string) =>
        request<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email } }),
    resetPassword: (token: string, new_password: string) =>
        request<{ message: string }>("/auth/reset-password", { method: "POST", body: { token, new_password } }),

    // ---- Events ----
    listEvents: (filters?: EventFilters) =>
        request<EventList>("/events", { query: filters as Record<string, unknown> }),
    getEvent: (idOrSlug: string) => request<Event>(`/events/${idOrSlug}`, { auth: true }),
    myEvents: () => request<EventList>("/events/mine", { auth: true }),
    nearby: (lat: number, lng: number, radius = 10) =>
        request<{ event_id: string; distance_km: number }[]>("/events/nearby", {
            query: { lat, lng, radius },
        }),
    createEvent: (body: EventPayload) => request<Event>("/events", { method: "POST", body, auth: true }),
    updateEvent: (id: string, body: EventPayload) =>
        request<Event>(`/events/${id}`, { method: "PUT", body, auth: true }),
    deleteEvent: (id: string) =>
        request<{ message: string }>(`/events/${id}`, { method: "DELETE", auth: true }),

    // ---- Interactions ----
    interactionStatus: (id: string) =>
        request<InteractionStatus>(`/events/${id}/interactions`, { auth: true }),
    bookmark: (id: string) => request(`/events/${id}/bookmark`, { method: "POST", auth: true }),
    unbookmark: (id: string) => request(`/events/${id}/bookmark`, { method: "DELETE", auth: true }),
    follow: (id: string) => request(`/events/${id}/follow`, { method: "POST", auth: true }),
    unfollow: (id: string) => request(`/events/${id}/follow`, { method: "DELETE", auth: true }),
    myBookmarks: () => request<EventList>("/me/bookmarks", { auth: true }),
    myFollows: () => request<EventList>("/me/follows", { auth: true }),
    myTickets: () => request<Order[]>("/me/tickets", { auth: true }),
    eventBuyers: (id: string) => request<EventBuyer[]>(`/events/${id}/buyers`, { auth: true }),
    notifyBuyers: (id: string, body: { recipients: string[]; subject: string; body: string }) =>
        request<{ sent: number }>(`/events/${id}/notify`, { method: "POST", body, auth: true }),
    // ---- Categories & tags ----
    categories: () => request<Category[]>("/categories"),
    tags: () => request<Tag[]>("/tags"),

    // ---- Payments ----
    initiatePayment: (event_id: string, quantity: number) =>
        request<InitiatePaymentResponse>("/payments/initiate", {
            method: "POST",
            body: { event_id, quantity },
            auth: true,
        }),
    verifyPayment: (tx_ref: string) =>
        request<Order>("/payments/verify", { method: "POST", body: { tx_ref }, auth: true }),
    scanTicket: (code: string) =>
        request<ScanResult>("/tickets/scan", { method: "POST", body: { code }, auth: true }),

    // ---- Admin ----
    adminCategories: () => request<Category[]>("/admin/categories", { auth: true }),
    createCategory: (body: Partial<Category>) =>
        request<Category>("/admin/categories", { method: "POST", body, auth: true }),
    updateCategory: (id: string, body: Partial<Category>) =>
        request<Category>(`/admin/categories/${id}`, { method: "PUT", body, auth: true }),
    deleteCategory: (id: string) =>
        request<{ message: string }>(`/admin/categories/${id}`, { method: "DELETE", auth: true }),
    setCategoryActive: (id: string, is_active: boolean) =>
        request<{ message: string }>(`/admin/categories/${id}/active`, {
            method: "PATCH",
            body: { is_active },
            auth: true,
        }),
    analytics: () => request<Analytics>("/admin/analytics", { auth: true }),
};
