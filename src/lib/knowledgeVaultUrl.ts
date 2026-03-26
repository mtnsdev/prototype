import type { KnowledgeVaultFiltersState } from "@/components/knowledge-vault/KnowledgeVaultFilters";
import type { IngestionStatus } from "@/types/knowledge-vault";
import { isKvSortOption, type KvSortOption } from "@/lib/knowledgeVaultSort";

export type ParsedKnowledgeVaultUrl = {
  q: string;
  sort: KvSortOption | undefined;
  page: number | undefined;
  /** Open document detail panel when this id is in the loaded list */
  docId: string | undefined;
  filters: KnowledgeVaultFiltersState;
};

function parseIngestion(s: string | null): IngestionStatus | undefined {
  if (s === "indexed" || s === "processing" || s === "not_indexed") return s;
  return undefined;
}

export function parseKnowledgeVaultSearchParams(sp: URLSearchParams): ParsedKnowledgeVaultUrl {
  const q = sp.get("q") ?? "";
  const sortRaw = sp.get("sort");
  const sort = sortRaw && isKvSortOption(sortRaw) ? sortRaw : undefined;
  const pageRaw = sp.get("page");
  const pageNum = pageRaw ? Number.parseInt(pageRaw, 10) : NaN;
  const page = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : undefined;
  const docRaw = sp.get("doc")?.trim();
  const docId = docRaw ? docRaw : undefined;

  const filters: KnowledgeVaultFiltersState = {};
  const scope = sp.get("scope");
  if (scope) filters.scope = scope;
  const tags = sp.get("tags");
  if (tags) {
    const list = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (list.length) filters.tags = list;
  }
  const ingestion = parseIngestion(sp.get("ingestion"));
  if (ingestion) filters.ingestion_status = ingestion;
  const src = sp.get("src");
  if (src) {
    const ids = src.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length) filters.source_ids = ids;
  }

  return { q, sort, page, docId, filters };
}

export function buildKnowledgeVaultSearchParams(args: {
  debouncedSearch: string;
  sortOption: KvSortOption;
  listPage: number;
  filters: KnowledgeVaultFiltersState;
  openDocumentId?: string | null;
}): URLSearchParams {
  const p = new URLSearchParams();
  const q = args.debouncedSearch.trim();
  if (q) p.set("q", q);
  if (args.sortOption !== "updated_desc") p.set("sort", args.sortOption);
  if (args.listPage > 1) p.set("page", String(args.listPage));
  const od = args.openDocumentId?.trim();
  if (od) p.set("doc", od);

  const f = args.filters;
  if (f.scope != null) p.set("scope", f.scope);
  if (f.tags?.length) p.set("tags", f.tags.join(","));
  if (f.ingestion_status) p.set("ingestion", f.ingestion_status);
  if (f.source_ids?.length) p.set("src", f.source_ids.join(","));

  return p;
}
