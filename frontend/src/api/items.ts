import { api } from "./client";
import type {
  Item,
  ItemListQuery,
  ItemListResponse,
  ItemStatus,
  LostItem,
  FoundItem,
} from "../types";

type LostDraft = Omit<
  LostItem,
  "id" | "posted_by" | "posted_at" | "status"
>;
type FoundDraft = Omit<
  FoundItem,
  "id" | "posted_by" | "posted_at" | "status"
>;

export type ItemDraft = LostDraft | FoundDraft;

export const itemsApi = {
  list: (query: ItemListQuery = {}) =>
    api<ItemListResponse>("/api/items", { query: query as Record<string, string | number | undefined> }),
  get: (id: string) => api<Item>(`/api/items/${id}`),
  create: (draft: ItemDraft) =>
    api<Item>("/api/items", { method: "POST", body: draft }),
  setStatus: (id: string, status: ItemStatus) =>
    api<Item>(`/api/items/${id}/status`, { method: "PATCH", body: { status } }),
  remove: (id: string) =>
    api<void>(`/api/items/${id}`, { method: "DELETE" }),
};
