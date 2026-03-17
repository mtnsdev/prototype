/**
 * Products API client. Calls endpoints as specified; backend built separately.
 * Uses mock/placeholder data when backend is not ready.
 */

import type {
  Product,
  ProductListParams,
  ProductListResponse,
} from "@/types/product";

export function getProductId(p: Product): string {
  return (p as { id?: string; _id?: string }).id ?? (p as { _id?: string })._id ?? "";
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return headers;
}

function buildQuery(params: ProductListParams): string {
  const sp = new URLSearchParams();
  if (params.agency_id != null && params.agency_id !== "") sp.set("agency_id", params.agency_id);
  if (params.search != null && params.search !== "") sp.set("search", params.search);
  if (params.category != null) sp.set("category", params.category);
  if (params.status != null) sp.set("status", params.status);
  if (params.country != null && params.country !== "") sp.set("country", params.country);
  if (params.partnership_tier != null) sp.set("partnership_tier", params.partnership_tier);
  if (params.price_range != null) sp.set("price_range", params.price_range);
  if (params.verification != null) sp.set("verification", params.verification);
  if (params.tab != null) sp.set("tab", params.tab);
  if (params.sort_by != null) sp.set("sort_by", params.sort_by);
  if (params.sort_order != null) sp.set("sort_order", params.sort_order);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export async function fetchProductList(params: ProductListParams): Promise<ProductListResponse> {
  const res = await fetch(`/api/products${buildQuery(params)}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function fetchProduct(productId: string): Promise<Product> {
  const res = await fetch(`/api/products/${productId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function createProduct(body: Partial<Product>): Promise<Product> {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function updateProduct(productId: string, body: Partial<Product>): Promise<Product> {
  const res = await fetch(`/api/products/${productId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function deleteProduct(productId: string): Promise<void> {
  const res = await fetch(`/api/products/${productId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
}

export async function copyFromEnable(enable_product_id: string): Promise<Product> {
  const res = await fetch("/api/products/copy-from-enable", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ enable_product_id }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function importProducts(formData: FormData): Promise<{ imported: number; errors?: string[] }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch("/api/products/import", { method: "POST", headers, body: formData });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function enrichProduct(
  productId: string,
  body: { fields_to_enrich: string[] }
): Promise<Record<string, string>> {
  const res = await fetch(`/api/products/${productId}/enrich`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}

export async function addToItinerary(
  itineraryId: string,
  body: { source_product_id: string; day: number; event_type: string; custom_notes?: string }
): Promise<unknown> {
  const res = await fetch(`/api/itineraries/${itineraryId}/events`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return res.json();
}
