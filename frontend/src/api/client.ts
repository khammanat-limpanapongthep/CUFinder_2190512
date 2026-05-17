import { mockHandle, getMockImageUrl } from "./mock/handlers";
import { ApiError } from "./client-error";

export { ApiError };

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") === "true";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: ApiOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const url = buildUrl(path, opts.query);

  if (USE_MOCK) {
    return mockHandle<T>(method, url, opts.body);
  }

  const res = await fetch(apiUrl(url), {
    method,
    credentials: "include",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let payload: { error?: { code?: string; message?: string } } = {};
    try {
      payload = await res.json();
    } catch {
      /* not json */
    }
    throw new ApiError(
      payload.error?.code ?? "internal_error",
      payload.error?.message ?? res.statusText,
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function uploadImage(file: File): Promise<{ id: string }> {
  if (USE_MOCK) {
    return mockHandle<{ id: string }>("POST", "/api/images", file);
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(apiUrl("/api/images"), {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  if (!res.ok) {
    throw new ApiError("upload_failed", "Image upload failed", res.status);
  }
  return res.json();
}

export function imageUrl(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  if (USE_MOCK) {
    return getMockImageUrl(id);
  }
  return apiUrl(`/api/images/${id}`);
}
