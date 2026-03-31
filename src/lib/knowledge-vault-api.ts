/**
 * Knowledge Vault HTTP API. Uses mock data when backend is unavailable.
 * When the API returns 200 with empty lists (common on PR previews: proxy hits a
 * backend with no knowledge data), we fall back to mocks in preview mode so the
 * vault is still demonstrable.
 */

import { IS_PREVIEW_MODE } from "@/config/preview";
import type {
  DataSource,
  KnowledgeDocument,
  IngestionHealth,
  KnowledgeDocumentListParams,
  KnowledgeDocumentListResponse,
} from "@/types/knowledge-vault";

function useMockWhenApiEmpty(): boolean {
  if (typeof process === "undefined") return IS_PREVIEW_MODE;
  const flag = process.env.NEXT_PUBLIC_KV_USE_MOCK_WHEN_EMPTY;
  if (flag === "1" || flag === "true") return true;
  return IS_PREVIEW_MODE;
}

function normalizeSourcesPayload(data: unknown): DataSource[] {
  if (Array.isArray(data)) return data as DataSource[];
  if (data && typeof data === "object" && Array.isArray((data as { sources?: unknown }).sources)) {
    return (data as { sources: DataSource[] }).sources;
  }
  return [];
}

function normalizeDocumentsPayload(data: unknown): KnowledgeDocumentListResponse {
  if (!data || typeof data !== "object") return { documents: [], total: 0 };
  const o = data as Record<string, unknown>;
  const documents = Array.isArray(o.documents) ? (o.documents as KnowledgeDocument[]) : [];
  const total = typeof o.total === "number" ? o.total : documents.length;
  return { documents, total };
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return headers;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") sp.set(k, String(v));
  });
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export async function fetchKnowledgeSources(agencyId?: string): Promise<DataSource[]> {
  if (IS_PREVIEW_MODE) {
    const { getMockDataSources } = await import("@/components/knowledge-vault/knowledgeVaultMockData");
    return getMockDataSources();
  }
  const q = agencyId ? buildQuery({ agency_id: agencyId }) : "";
  try {
    const res = await fetch(`/api/knowledge/sources${q}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const sources = normalizeSourcesPayload(data);
    if (sources.length === 0 && useMockWhenApiEmpty()) {
      const { getMockDataSources } = await import("@/components/knowledge-vault/knowledgeVaultMockData");
      return getMockDataSources();
    }
    return sources;
  } catch {
    const { getMockDataSources } = await import("@/components/knowledge-vault/knowledgeVaultMockData");
    return getMockDataSources();
  }
}

export async function connectKnowledgeSource(
  sourceType: string,
  config: Record<string, unknown>
): Promise<DataSource> {
  try {
    const res = await fetch("/api/knowledge/sources/connect", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ source_type: sourceType, config }),
    });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    throw new Error("Connection failed");
  }
}

export async function syncKnowledgeSource(sourceId: string): Promise<void> {
  try {
    const res = await fetch(`/api/knowledge/sources/${sourceId}/sync`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error();
  } catch {
    // no-op
  }
}

export async function fetchKnowledgeDocuments(
  params: KnowledgeDocumentListParams
): Promise<KnowledgeDocumentListResponse> {
  if (IS_PREVIEW_MODE) {
    const { filterMockDocuments } = await import("@/components/knowledge-vault/knowledgeVaultMockData");
    return filterMockDocuments(params);
  }
  const q = buildQuery(params as Record<string, string | number | undefined>);
  try {
    const res = await fetch(`/api/knowledge/documents${q}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error();
    const body = normalizeDocumentsPayload(await res.json());
    if (body.documents.length === 0 && (body.total === 0 || body.total == null) && useMockWhenApiEmpty()) {
      const { filterMockDocuments } = await import("@/components/knowledge-vault/knowledgeVaultMockData");
      return filterMockDocuments(params);
    }
    return body;
  } catch {
    const { filterMockDocuments } = await import("@/components/knowledge-vault/knowledgeVaultMockData");
    return filterMockDocuments(params);
  }
}

export async function fetchKnowledgeDocument(documentId: string): Promise<KnowledgeDocument | null> {
  if (IS_PREVIEW_MODE) {
    const { getMockDocumentById } = await import("@/components/knowledge-vault/knowledgeVaultMockData");
    return getMockDocumentById(documentId);
  }
  try {
    const res = await fetch(`/api/knowledge/documents/${documentId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    const { getMockDocumentById } = await import("@/components/knowledge-vault/knowledgeVaultMockData");
    return getMockDocumentById(documentId);
  }
}

export async function uploadKnowledgeDocuments(
  formData: FormData
): Promise<{ documents: KnowledgeDocument[] }> {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers: HeadersInit = {};
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    const res = await fetch("/api/knowledge/documents/upload", {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    throw new Error("Upload failed");
  }
}

export async function updateKnowledgeDocument(
  documentId: string,
  body: Partial<Pick<KnowledgeDocument, "title" | "content_summary">>
): Promise<KnowledgeDocument> {
  try {
    const res = await fetch(`/api/knowledge/documents/${documentId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    throw new Error("Update failed");
  }
}

export async function deleteKnowledgeDocument(documentId: string): Promise<void> {
  try {
    const res = await fetch(`/api/knowledge/documents/${documentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error();
  } catch {
    throw new Error("Delete failed");
  }
}

export async function reindexKnowledgeDocument(documentId: string): Promise<void> {
  try {
    const res = await fetch(`/api/knowledge/documents/${documentId}/reindex`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error();
  } catch {
    // no-op
  }
}

export async function linkKnowledgeDocument(
  documentId: string,
  entityType: "product" | "vic",
  entityId: string
): Promise<void> {
  try {
    const res = await fetch(`/api/knowledge/documents/${documentId}/link`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ entity_type: entityType, entity_id: entityId }),
    });
    if (!res.ok) throw new Error();
  } catch {
    // no-op
  }
}

export async function unlinkKnowledgeDocument(
  documentId: string,
  entityId: string
): Promise<void> {
  try {
    const res = await fetch(`/api/knowledge/documents/${documentId}/link/${entityId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error();
  } catch {
    // no-op
  }
}

export async function fetchKnowledgeHealth(agencyId?: string): Promise<IngestionHealth> {
  if (IS_PREVIEW_MODE) {
    const { getMockIngestionHealth } = await import("@/components/knowledge-vault/knowledgeVaultMockData");
    return getMockIngestionHealth();
  }
  const q = agencyId ? buildQuery({ agency_id: agencyId }) : "";
  try {
    const res = await fetch(`/api/knowledge/health${q}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    const { getMockIngestionHealth } = await import("@/components/knowledge-vault/knowledgeVaultMockData");
    return getMockIngestionHealth();
  }
}
