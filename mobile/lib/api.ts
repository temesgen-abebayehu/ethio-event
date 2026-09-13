import * as SecureStore from "expo-secure-store";

// On a device, localhost won't reach your machine — set EXPO_PUBLIC_API_URL to your LAN IP.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

const TOKEN_KEY = "auth_token";
let memToken: string | null = null;

export const tokenStore = {
    get: () => memToken,
    async load() {
        memToken = await SecureStore.getItemAsync(TOKEN_KEY);
        return memToken;
    },
    async set(token: string) {
        memToken = token;
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    },
    async clear() {
        memToken = null;
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    },
};

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
        if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    }
    const s = params.toString();
    return s ? `?${s}` : "";
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (opts.auth && memToken) headers.Authorization = `Bearer ${memToken}`;

    const res = await fetch(`${API_URL}${path}${buildQuery(opts.query)}`, {
        method: opts.method ?? "GET",
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    if (res.status === 204) return undefined as T;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error || "Request failed");
    return data as T;
}
