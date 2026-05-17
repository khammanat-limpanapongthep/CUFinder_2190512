import type { Item, Location, User, ItemStatus } from "../../types";
import { ApiError } from "../client-error";
import { createInitialState, newId, SESSION_STORAGE_KEY, type MockState } from "./data";

const STATE_STORAGE_KEY = "cufinder.mock.state";

function loadState(): MockState {
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as {
      locations: [string, Location][];
      users: [string, User][];
      items: [string, Item][];
    };
    const session = {
      userId: localStorage.getItem(SESSION_STORAGE_KEY) || null,
    };
    return {
      locations: new Map(parsed.locations),
      users: new Map(parsed.users),
      items: new Map(parsed.items),
      images: new Map(),
      session,
    };
  } catch {
    return createInitialState();
  }
}

function saveState() {
  try {
    const payload = {
      locations: [...STATE.locations.entries()],
      users: [...STATE.users.entries()],
      items: [...STATE.items.entries()],
    };
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(payload));
    if (STATE.session.userId) {
      localStorage.setItem(SESSION_STORAGE_KEY, STATE.session.userId);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    /* localStorage quota or unavailable; ignore */
  }
}

const STATE: MockState = loadState();

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function currentUser(): User | null {
  if (!STATE.session.userId) return null;
  return STATE.users.get(STATE.session.userId) ?? null;
}

function requireUser(): User {
  const u = currentUser();
  if (!u) throw new ApiError("unauthenticated", "Not signed in", 401);
  return u;
}

function requireWebAdmin(): User {
  const u = requireUser();
  if (u.role !== "web_admin") throw new ApiError("forbidden", "Web admin only", 403);
  return u;
}

function requireAnyAdmin(): User {
  const u = requireUser();
  if (u.role !== "web_admin" && u.role !== "location_admin") {
    throw new ApiError("forbidden", "Admin only", 403);
  }
  return u;
}

function parseQuery(url: string): { path: string; query: URLSearchParams } {
  const [pathPart, qs] = url.split("?");
  return { path: pathPart, query: new URLSearchParams(qs ?? "") };
}

export function getMockImageUrl(id: string): string | undefined {
  return STATE.images.get(id);
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function matchesItemFilters(item: Item, q: URLSearchParams): boolean {
  const type = q.get("type");
  if (type && item.type !== type) return false;
  const category = q.get("category");
  if (category && item.category !== category) return false;
  const locationId = q.get("location_id");
  if (locationId) {
    const itemLoc =
      item.type === "lost" ? item.last_seen_location_id : item.found_location_id;
    if (itemLoc !== locationId) return false;
  }
  const search = q.get("q")?.toLowerCase().trim();
  if (search) {
    const hay = `${item.title} ${item.description}`.toLowerCase();
    if (!hay.includes(search)) return false;
  }
  const itemDate =
    item.type === "lost" ? item.last_seen_date : item.found_date;
  const dateFrom = q.get("date_from");
  if (dateFrom && itemDate < dateFrom) return false;
  const dateTo = q.get("date_to");
  if (dateTo && itemDate > dateTo + "T23:59:59Z") return false;
  const status = (q.get("status") ?? "open") as ItemStatus;
  if (item.status !== status) return false;
  return true;
}

export async function mockHandle<T>(
  method: string,
  fullUrl: string,
  body: unknown,
): Promise<T> {
  const { path, query } = parseQuery(fullUrl);
  const result = await routeRequest(method, path, query, body);
  return delay(result as T);
}

async function routeRequest(
  method: string,
  path: string,
  query: URLSearchParams,
  body: unknown,
): Promise<unknown> {
  // ---------- Auth ----------
  if (path === "/api/auth/logout" && method === "POST") {
    STATE.session.userId = null;
    saveState();
    return undefined;
  }

  if (path === "/api/auth/me" && method === "GET") {
    return requireUser();
  }

  // ---------- Locations ----------
  if (path === "/api/locations" && method === "GET") {
    const list = [...STATE.locations.values()].filter((l) => l.is_active);
    list.sort((a, b) => a.name.localeCompare(b.name));
    return { locations: list };
  }

  if (path === "/api/locations" && method === "POST") {
    requireWebAdmin();
    const { name, is_dropoff } = (body as { name?: string; is_dropoff?: boolean }) ?? {};
    if (!name || !name.trim()) {
      throw new ApiError("validation_failed", "Name required", 400);
    }
    const exists = [...STATE.locations.values()].some(
      (l) => l.name.toLowerCase() === name.toLowerCase() && l.is_active,
    );
    if (exists) throw new ApiError("conflict", "Location with this name exists", 409);
    const loc: Location = {
      id: newId("loc"),
      name: name.trim(),
      is_dropoff: is_dropoff ?? true,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    STATE.locations.set(loc.id, loc);
    saveState();
    return loc;
  }

  const locMatch = path.match(/^\/api\/locations\/([^/]+)$/);
  if (locMatch && (method === "PATCH" || method === "DELETE")) {
    requireWebAdmin();
    const id = locMatch[1];
    const loc = STATE.locations.get(id);
    if (!loc) throw new ApiError("not_found", "Location not found", 404);
    if (method === "DELETE") {
      loc.is_active = false;
      saveState();
      return undefined;
    }
    const patch = (body as Partial<Location>) ?? {};
    if (typeof patch.name === "string") loc.name = patch.name.trim();
    if (typeof patch.is_dropoff === "boolean") loc.is_dropoff = patch.is_dropoff;
    if (typeof patch.is_active === "boolean") loc.is_active = patch.is_active;
    saveState();
    return loc;
  }

  // ---------- Items ----------
  if (path === "/api/items" && method === "GET") {
    const all = [...STATE.items.values()].filter((i) => matchesItemFilters(i, query));
    all.sort((a, b) => (a.posted_at < b.posted_at ? 1 : -1));
    const skip = Number(query.get("skip") ?? 0);
    const limit = Math.min(Number(query.get("limit") ?? 30), 100);
    return { items: all.slice(skip, skip + limit), total: all.length };
  }

  if (path === "/api/items" && method === "POST") {
    const user = requireUser();
    const draft = body as Partial<Item> & { type?: "lost" | "found" };
    if (!draft || (draft.type !== "lost" && draft.type !== "found")) {
      throw new ApiError("validation_failed", "type must be lost or found", 400);
    }
    if (!draft.title || !draft.description || !draft.category) {
      throw new ApiError("validation_failed", "Missing required fields", 400);
    }
    const base = {
      id: newId("itm"),
      type: draft.type,
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      image_id: draft.image_id ?? null,
      status: "open" as const,
      posted_by: { id: user.id, display_name: user.display_name },
      posted_at: new Date().toISOString(),
    };
    let item: Item;
    if (draft.type === "lost") {
      const d = draft as Partial<import("../../types").LostItem>;
      if (!d.last_seen_location_id && !d.last_seen_location_text) {
        throw new ApiError("validation_failed", "Last seen location required", 400);
      }
      if (!d.last_seen_date) {
        throw new ApiError("validation_failed", "Last seen date required", 400);
      }
      item = {
        ...base,
        type: "lost",
        last_seen_location_id: d.last_seen_location_id ?? null,
        last_seen_location_text: d.last_seen_location_id ? null : d.last_seen_location_text ?? null,
        last_seen_date: d.last_seen_date,
        contact_info: d.contact_info?.trim() || null,
      };
    } else {
      const d = draft as Partial<import("../../types").FoundItem>;
      if (!d.found_location_id && !d.found_location_text) {
        throw new ApiError("validation_failed", "Found location required", 400);
      }
      if (!d.found_date) {
        throw new ApiError("validation_failed", "Found date required", 400);
      }
      if (!d.held_admin_location_id && !d.held_freetext) {
        throw new ApiError("validation_failed", "Held-at info required", 400);
      }
      item = {
        ...base,
        type: "found",
        found_location_id: d.found_location_id ?? null,
        found_location_text: d.found_location_id ? null : d.found_location_text ?? null,
        found_date: d.found_date,
        held_admin_location_id: d.held_admin_location_id ?? null,
        held_freetext: d.held_admin_location_id ? null : d.held_freetext ?? null,
      };
    }
    STATE.items.set(item.id, item);
    saveState();
    return item;
  }

  const itemDetail = path.match(/^\/api\/items\/([^/]+)$/);
  if (itemDetail && method === "GET") {
    const it = STATE.items.get(itemDetail[1]);
    if (!it) throw new ApiError("not_found", "Item not found", 404);
    return it;
  }

  if (itemDetail && method === "DELETE") {
    const admin = requireAnyAdmin();
    const it = STATE.items.get(itemDetail[1]);
    if (!it) throw new ApiError("not_found", "Item not found", 404);
    if (admin.role === "location_admin") {
      const heldHere =
        it.type === "found" && it.held_admin_location_id === admin.admin_location_id;
      if (!heldHere) {
        throw new ApiError("forbidden", "Item is not held at your location", 403);
      }
    }
    STATE.items.delete(it.id);
    saveState();
    return undefined;
  }

  const itemStatus = path.match(/^\/api\/items\/([^/]+)\/status$/);
  if (itemStatus && method === "PATCH") {
    const admin = requireAnyAdmin();
    const it = STATE.items.get(itemStatus[1]);
    if (!it) throw new ApiError("not_found", "Item not found", 404);
    if (admin.role === "location_admin") {
      const heldHere =
        it.type === "found" && it.held_admin_location_id === admin.admin_location_id;
      if (!heldHere) {
        throw new ApiError("forbidden", "Item is not held at your location", 403);
      }
    }
    const { status } = (body as { status?: ItemStatus }) ?? {};
    if (!status || !["open", "claimed", "disposed"].includes(status)) {
      throw new ApiError("validation_failed", "Invalid status", 400);
    }
    it.status = status;
    saveState();
    return it;
  }

  // ---------- Images ----------
  if (path === "/api/images" && method === "POST") {
    requireUser();
    const file = body as File;
    if (!(file instanceof File)) {
      throw new ApiError("validation_failed", "File required", 400);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new ApiError("validation_failed", "Image must be under 5 MB", 400);
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new ApiError("validation_failed", "Unsupported image type", 400);
    }
    const dataUrl = await readFileAsDataUrl(file);
    const id = newId("img");
    STATE.images.set(id, dataUrl);
    return { id };
  }

  throw new ApiError("not_found", `Mock route not implemented: ${method} ${path}`, 404);
}
