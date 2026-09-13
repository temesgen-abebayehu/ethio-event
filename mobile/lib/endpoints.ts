import { request } from "./api";
import type {
    AuthResponse,
    Category,
    Event,
    EventBuyer,
    EventFilters,
    EventList,
    InitiatePaymentResponse,
    InteractionStatus,
    Order,
    ScanResult,
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

    // ---- Discovery ----
    events: (filters?: EventFilters) => request<EventList>("/events", { query: filters as Record<string, unknown> }),
    event: (idOrSlug: string) => request<Event>(`/events/${idOrSlug}`, { auth: true }),
    categories: () => request<Category[]>("/categories"),

    // ---- Interactions ----
    interactionStatus: (id: string) => request<InteractionStatus>(`/events/${id}/interactions`, { auth: true }),
    bookmark: (id: string) => request(`/events/${id}/bookmark`, { method: "POST", auth: true }),
    unbookmark: (id: string) => request(`/events/${id}/bookmark`, { method: "DELETE", auth: true }),
    follow: (id: string) => request(`/events/${id}/follow`, { method: "POST", auth: true }),
    unfollow: (id: string) => request(`/events/${id}/follow`, { method: "DELETE", auth: true }),
    myBookmarks: () => request<Event[]>("/me/bookmarks", { auth: true }),
    myFollows: () => request<Event[]>("/me/follows", { auth: true }),

    // ---- Ticketing ----
    myTickets: () => request<Order[]>("/me/tickets", { auth: true }),
    initiatePayment: (event_id: string, quantity: number) =>
        request<InitiatePaymentResponse>("/payments/initiate", { method: "POST", body: { event_id, quantity }, auth: true }),
    verifyPayment: (tx_ref: string) =>
        request<Order>("/payments/verify", { method: "POST", body: { tx_ref }, auth: true }),

    // ---- Organizer ----
    myEvents: () => request<EventList>("/events/mine", { auth: true }),
    eventBuyers: (id: string) => request<EventBuyer[]>(`/events/${id}/buyers`, { auth: true }),
    scanTicket: (code: string) => request<ScanResult>("/tickets/scan", { method: "POST", body: { code }, auth: true }),
};
