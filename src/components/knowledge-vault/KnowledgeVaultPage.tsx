"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ChevronDown, Upload, RefreshCw, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchKnowledgeSources,
  fetchKnowledgeDocuments,
  fetchKnowledgeHealth,
} from "@/lib/knowledge-vault-api";
import type {
  DataLayer,
  DataSource,
  KnowledgeDocument,
  IngestionHealth,
  IngestionStatus,
} from "@/types/knowledge-vault";
import KnowledgeVaultFilters, { type KnowledgeVaultFiltersState } from "./KnowledgeVaultFilters";
import DataSourceCards from "./DataSourceCards";
import IngestionHealthBar from "./IngestionHealthBar";
import DocumentGrid from "./DocumentGrid";
import DocumentDetailPanel from "./DocumentDetailPanel";
import EmailIngestionView from "./EmailIngestionView";
import UploadDocumentModal from "./UploadDocumentModal";
import ConnectSourceModal from "./ConnectSourceModal";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { VAULT_VISIBLE_DOCUMENTS, VAULT_VISIBLE_COUNT_TOOLTIP } from "./knowledgeVaultMockData";
import { useKnowledgeVaultUnprocessedEmailCount } from "@/contexts/KnowledgeVaultEmailContext";
import { useUser } from "@/contexts/UserContext";
import { knowledgeDocumentUiScope } from "@/lib/knowledgeDocumentScope";
import {
  canSeeKnowledgeDocument,
  isOversightPrivateDoc,
  matchesKvScopeFilter,
  type KvScopeOverrides,
} from "@/lib/knowledgeVaultVisibility";

const EMAIL_SOURCE_ID = "src-email";

export type KvSortOption =
  | "updated_desc"
  | "updated_asc"
  | "title_asc"
  | "title_desc"
  | "size_desc"
  | "size_asc";

function kvSortToApi(option: KvSortOption): { sort_by: string; sort_order: "asc" | "desc" } {
  const m: Record<KvSortOption, { sort_by: string; sort_order: "asc" | "desc" }> = {
    updated_desc: { sort_by: "last_updated", sort_order: "desc" },
    updated_asc: { sort_by: "last_updated", sort_order: "asc" },
    title_asc: { sort_by: "title", sort_order: "asc" },
    title_desc: { sort_by: "title", sort_order: "desc" },
    size_desc: { sort_by: "file_size_kb", sort_order: "desc" },
    size_asc: { sort_by: "file_size_kb", sort_order: "asc" },
  };
  return m[option];
}

function scopeFilterToDataLayer(scope: string | undefined): DataLayer | undefined {
  if (scope == null) return undefined;
  if (scope === "private") return "advisor";
  return "agency";
}

export default function KnowledgeVaultPage() {
  const { user } = useUser();
  const isAdmin = user?.role === "admin" || user?.role === "agency_admin";
  const currentUserOwnerId = user?.id != null ? String(user.id) : "1";

  const [sources, setSources] = useState<DataSource[]>([]);
  const [health, setHealth] = useState<IngestionHealth | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAllPrivateDocs, setShowAllPrivateDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<KvSortOption>("updated_desc");
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [filters, setFilters] = useState<KnowledgeVaultFiltersState>({});
  const [docScopeOverrides, setDocScopeOverrides] = useState<KvScopeOverrides>({});
  const filtersPanelRef = useRef<HTMLDivElement>(null);

  const emailUnprocessedCount = useKnowledgeVaultUnprocessedEmailCount();

  const emailOnlyView =
    filters.source_ids?.length === 1 && filters.source_ids[0] === EMAIL_SOURCE_ID;

  const load = useCallback(async () => {
    setLoading(true);
    const { sort_by, sort_order } = kvSortToApi(sortOption);
    const emailOnly = filters.source_ids?.length === 1 && filters.source_ids[0] === EMAIL_SOURCE_ID;
    try {
      const [srcList, healthRes, docRes] = await Promise.all([
        fetchKnowledgeSources(),
        fetchKnowledgeHealth(),
        fetchKnowledgeDocuments({
          data_layer: emailOnly ? undefined : scopeFilterToDataLayer(filters.scope),
          ingestion_status: emailOnly ? undefined : filters.ingestion_status,
          source_ids: filters.source_ids?.length ? filters.source_ids.join(",") : undefined,
          search: searchQuery.trim() || undefined,
          sort_by,
          sort_order,
          page: 1,
          limit: 100,
        }),
      ]);
      setSources(Array.isArray(srcList) ? srcList : []);
      setHealth(healthRes);
      setDocuments(docRes.documents ?? []);
      setTotalDocs(docRes.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, sortOption]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleDocuments = useMemo(() => {
    if (emailOnlyView) return documents;
    return documents
      .filter((doc) =>
        canSeeKnowledgeDocument(doc, currentUserOwnerId, isAdmin, showAllPrivateDocs, docScopeOverrides)
      )
      .filter((doc) => matchesKvScopeFilter(doc, filters.scope, docScopeOverrides));
  }, [
    documents,
    emailOnlyView,
    currentUserOwnerId,
    isAdmin,
    showAllPrivateDocs,
    docScopeOverrides,
    filters.scope,
  ]);

  const oversightPrivate = useCallback(
    (doc: KnowledgeDocument) =>
      isOversightPrivateDoc(doc, currentUserOwnerId, isAdmin, showAllPrivateDocs, docScopeOverrides),
    [currentUserOwnerId, isAdmin, showAllPrivateDocs, docScopeOverrides]
  );

  const applyDocScopeOverride = useCallback((doc: KnowledgeDocument, scope: "private" | string) => {
    const base = knowledgeDocumentUiScope(doc);
    setDocScopeOverrides((prev) => {
      const next = { ...prev };
      if (scope === base) delete next[doc.id];
      else next[doc.id] = scope;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!selectedDoc || emailOnlyView) return;
    if (!visibleDocuments.some((d) => d.id === selectedDoc.id)) {
      setSelectedDoc(null);
    }
  }, [visibleDocuments, selectedDoc, emailOnlyView]);

  const listCount = emailOnlyView ? totalDocs : visibleDocuments.length;

  const vaultDocFiltersActive = useMemo(() => {
    return (
      Boolean(searchQuery.trim()) ||
      Boolean(filters.source_ids?.length) ||
      filters.scope != null ||
      filters.ingestion_status != null
    );
  }, [filters, searchQuery]);

  const hasDocumentFilters = useMemo(() => {
    return (
      Boolean(searchQuery.trim()) || filters.scope != null || filters.ingestion_status != null
    );
  }, [filters.scope, filters.ingestion_status, searchQuery]);

  const selectedSourceIds = filters.source_ids ?? [];

  const toggleSource = useCallback((id: string) => {
    setFilters((f) => {
      const cur = f.source_ids ?? [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...f, source_ids: next.length ? next : undefined };
    });
    setSelectedDoc(null);
  }, []);

  const connectedCount = sources.filter((s) => s.status === "connected").length;

  const scrollFiltersIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      filtersPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const handleFilterFailed = useCallback(() => {
    setFilters((f) => ({ ...f, ingestion_status: "failed" as IngestionStatus }));
    scrollFiltersIntoView();
  }, [scrollFiltersIntoView]);

  const clearDocumentFilters = useCallback(() => {
    setFilters((f) => ({
      ...f,
      scope: undefined,
      ingestion_status: undefined,
    }));
    setSearchQuery("");
  }, []);

  const filterPanelProps = {
    filters,
    onFiltersChange: setFilters,
    hasDocumentFilters,
    onClearDocumentFilters: clearDocumentFilters,
  };

  return (
    <div className="h-full flex flex-col bg-[#06060a] text-[#F5F5F5]">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Knowledge Vault" variant="full" dismissible sampleDataOnly />}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Knowledge Vault</h1>
          <p className="text-sm text-[rgba(245,245,245,0.6)] mt-0.5">
            {vaultDocFiltersActive ? (
              <>
                {emailOnlyView ? (
                  <>Email ingestion · </>
                ) : (
                  <>
                    {listCount} matching ·{" "}
                  </>
                )}
                <span className="border-b border-dotted border-gray-500 cursor-help" title={VAULT_VISIBLE_COUNT_TOOLTIP}>
                  {VAULT_VISIBLE_DOCUMENTS} documents visible
                </span>
                {" · "}
                {connectedCount} sources · Last sync 2 min ago
              </>
            ) : (
              <>
                <span className="border-b border-dotted border-gray-500 cursor-help" title={VAULT_VISIBLE_COUNT_TOOLTIP}>
                  {VAULT_VISIBLE_DOCUMENTS} documents visible
                </span>
                {" · "}
                {connectedCount} sources · Last sync 2 min ago
              </>
            )}
          </p>
          {isAdmin && !emailOnlyView && (
            <label className="mt-2 flex items-center gap-2 text-[11px] text-[rgba(245,245,245,0.5)] cursor-pointer select-none max-w-md">
              <input
                type="checkbox"
                className="rounded border-white/20 bg-white/[0.06] text-violet-500 focus:ring-violet-500/40"
                checked={showAllPrivateDocs}
                onChange={(e) => setShowAllPrivateDocs(e.target.checked)}
              />
              <Shield className="w-3.5 h-3.5 text-gray-500 shrink-0" aria-hidden />
              <span>
                Show all documents (includes other advisors&apos; private files — compliance / oversight). Shown at
                reduced opacity with a shield icon.
              </span>
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-[#F5F5F5]"
            onClick={() => setUploadOpen(true)}
          >
            <Upload size={14} className="mr-1.5" />
            Upload Document
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-[#F5F5F5]"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "mr-1.5 animate-spin" : "mr-1.5"} />
            Sync All
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <main className="flex-1 min-w-0 overflow-auto flex flex-col bg-[#06060a]">
          <div className="p-4 space-y-4">
            <DataSourceCards
              sources={sources}
              selectedSourceIds={selectedSourceIds}
              onToggleSource={toggleSource}
              onConnectSource={() => setConnectOpen(true)}
              emailUnprocessedCount={emailUnprocessedCount}
              loading={loading}
            />
            {health && (
              <IngestionHealthBar
                health={health}
                sources={sources}
                onFilterFailed={handleFilterFailed}
                activeIngestionFilter={filters.ingestion_status}
                documentFiltersUnavailable={emailOnlyView}
              />
            )}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]"
                />
                <Input
                  placeholder="Search documents…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-[#F5F5F5]"
                  disabled={emailOnlyView}
                />
              </div>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as KvSortOption)}
                disabled={emailOnlyView}
                className="text-[10px] bg-white/[0.03] border border-white/[0.04] rounded-lg px-3 py-1.5 text-gray-400 outline-none shrink-0 h-9 disabled:opacity-40"
              >
                <option value="updated_desc">Updated (newest)</option>
                <option value="updated_asc">Updated (oldest)</option>
                <option value="title_asc">Title (A–Z)</option>
                <option value="title_desc">Title (Z–A)</option>
                <option value="size_desc">Size (largest)</option>
                <option value="size_asc">Size (smallest)</option>
              </select>
            </div>

            {!emailOnlyView && (
              <div ref={filtersPanelRef} className="scroll-mt-6">
                <div className="hidden md:block rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                  <KnowledgeVaultFilters {...filterPanelProps} />
                </div>
                <details className="md:hidden rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden group">
                  <summary className="px-4 py-3 text-sm font-medium text-[#F5F5F5] cursor-pointer list-none flex items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2">
                      Document filters
                      <ChevronDown
                        size={16}
                        className="text-[rgba(245,245,245,0.45)] shrink-0 transition-transform group-open:rotate-180"
                      />
                    </span>
                    {hasDocumentFilters && (
                      <span className="text-[10px] uppercase tracking-wide text-amber-400/90 shrink-0">Active</span>
                    )}
                  </summary>
                  <div className="border-t border-white/[0.06]">
                    <KnowledgeVaultFilters {...filterPanelProps} />
                  </div>
                </details>
              </div>
            )}

            {emailOnlyView ? (
              <EmailIngestionView loading={loading} />
            ) : (
              <DocumentGrid
                documents={visibleDocuments}
                viewMode="list"
                loading={loading}
                onSelectDocument={setSelectedDoc}
                isOversightPrivate={oversightPrivate}
                scopeOverrides={docScopeOverrides}
              />
            )}
          </div>
        </main>

        {selectedDoc && !emailOnlyView && (
          <DocumentDetailPanel
            document={selectedDoc}
            oversightPrivate={oversightPrivate(selectedDoc)}
            scopeOverrides={docScopeOverrides}
            isAdmin={isAdmin}
            currentUserOwnerId={currentUserOwnerId}
            onScopeChange={(scope) => applyDocScopeOverride(selectedDoc, scope)}
            onClose={() => setSelectedDoc(null)}
            onUpdate={() => load()}
          />
        )}
      </div>

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          setUploadOpen(false);
          load();
        }}
      />
      <ConnectSourceModal open={connectOpen} onClose={() => setConnectOpen(false)} sources={sources} />
    </div>
  );
}
