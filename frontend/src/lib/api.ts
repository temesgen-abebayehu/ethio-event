import Cookies from "js-cookie";

export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const TOKEN_KEY = "auth_token";

// Token helpers — stored in a cookie so it survives reloads.
export const tokenStore = {
    get: () => Cookies.get(TOKEN_KEY),
    set: (token: string) => Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: "lax" }),
    clear: () => Cookies.remove(TOKEN_KEY),
};

// ApiError carries the HTTP status and the server's error message.
export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

interface RequestOptions {
    method?: string;
    body?: unknown;
    auth?: boolean;
    query?: Record<string, unknown>;
}

function buildQuery(query?: Record<string, unknown>): string {
    if (!query) return "";
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
        }
    }
    const s = params.toString();
    return s ? `?${s}` : "";
}

// request is the core JSON fetch wrapper. Throws ApiError on non-2xx.
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (opts.auth) {
        const token = tokenStore.get();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${path}${buildQuery(opts.query)}`, {
        method: opts.method || "GET",
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    if (res.status === 204) return undefined as T;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new ApiError(res.status, (data as { error?: string }).error || "Request failed");
    }
    return data as T;
}

// uploadFiles posts multipart form data to the upload endpoint.
export async function uploadFiles(files: File[], eventId = "new"): Promise<{ files: { url: string; public_id: string }[] }> {
    const form = new FormData();
    form.append("event_id", eventId);
    files.forEach((f) => form.append("files", f));

    const token = tokenStore.get();
    const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new ApiError(res.status, (data as { error?: string }).error || "Upload failed");
    }
    return data as { files: { url: string; public_id: string }[] };
}
