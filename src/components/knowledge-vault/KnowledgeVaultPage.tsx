"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Upload, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchKnowledgeSources,
  fetchKnowledgeDocuments,
  fetchKnowledgeHealth,
} from "@/lib/knowledge-vault-api";
import type { DataSource, KnowledgeDocument, IngestionHealth, DataLayer, IngestionStatus } from "@/types/knowledge-vault";
import KnowledgeVaultFilters from "./KnowledgeVaultFilters";
import DataSourceCards from "./DataSourceCards";
import IngestionHealthBar from "./IngestionHealthBar";
import DocumentGrid from "./DocumentGrid";
import DocumentDetailPanel from "./DocumentDetailPanel";
import UploadDocumentModal from "./UploadDocumentModal";
import ConnectSourceModal from "./ConnectSourceModal";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { VAULT_VISIBLE_DOCUMENTS, VAULT_VISIBLE_COUNT_TOOLTIP, getVaultSidebarTags } from "./knowledgeVaultMockData";
export default function KnowledgeVaultPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [health, setHealth] = useState<IngestionHealth | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("last_updated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<{
    source_ids?: string[];
    data_layer?: DataLayer;
    ingestion_status?: IngestionStatus;
    tags?: string[];
  }>({});

  const tagFacets = useMemo(() => getVaultSidebarTags(), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [srcList, healthRes, docRes] = await Promise.all([
        fetchKnowledgeSources(),
        fetchKnowledgeHealth(),
        fetchKnowledgeDocuments({
          data_layer: filters.data_layer,
          ingestion_status: filters.ingestion_status,
          tags: filters.tags,
          source_ids: filters.source_ids?.length ? filters.source_ids.join(",") : undefined,
          search: searchQuery.trim() || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
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
  }, [filters, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  const vaultDocFiltersActive = useMemo(() => {
    return (
      Boolean(searchQuery.trim()) ||
      Boolean(filters.source_ids?.length) ||
      filters.data_layer != null ||
      filters.ingestion_status != null ||
      Boolean(filters.tags?.length)
    );
  }, [filters, searchQuery]);

  const hasActiveFilters = vaultDocFiltersActive;

  const selectedSourceIds = filters.source_ids ?? [];

  const toggleSource = useCallback((id: string) => {
    setFilters((f) => {
      const cur = f.source_ids ?? [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...f, source_ids: next.length ? next : undefined };
    });
  }, []);

  const handleDocumentTagsChange = useCallback((docId: string, tags: string[]) => {
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, tags } : d)));
    setSelectedDoc((d) => (d?.id === docId ? { ...d, tags } : d));
  }, []);

  const connectedCount = sources.filter((s) => s.status === "connected").length;

  return (
    <div className="h-full flex flex-col bg-[#0C0C0C] text-[#F5F5F5]">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Knowledge Vault" variant="full" dismissible sampleDataOnly />}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Knowledge Vault</h1>
          <p className="text-sm text-[rgba(245,245,245,0.6)] mt-0.5">
            {vaultDocFiltersActive ? (
              <>
                {totalDocs} matching ·{" "}
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
        <aside className="w-64 shrink-0 border-r border-[rgba(255,255,255,0.08)] bg-[#0C0C0C] overflow-y-auto hidden md:block">
          <KnowledgeVaultFilters
            sources={sources}
            filters={filters}
            onFiltersChange={setFilters}
            onConnectSource={() => setConnectOpen(true)}
            hasActiveFilters={hasActiveFilters}
            tagFacets={tagFacets}
            onClearFilters={() => {
              setFilters({});
              setSearchQuery("");
            }}
          />
        </aside>

        {filtersDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersDrawerOpen(false)} />
            <div className="relative w-72 bg-[#0C0C0C] border-r border-white/10 overflow-y-auto">
              <div className="sticky top-0 flex items-center justify-between p-3 border-b border-white/10 bg-[#0C0C0C]">
                <span className="font-medium text-[#F5F5F5]">Filters</span>
                <Button variant="ghost" size="sm" onClick={() => setFiltersDrawerOpen(false)}>
                  <X size={18} />
                </Button>
              </div>
              <KnowledgeVaultFilters
                sources={sources}
                filters={filters}
                onFiltersChange={setFilters}
                onConnectSource={() => {
                  setConnectOpen(true);
                  setFiltersDrawerOpen(false);
                }}
                hasActiveFilters={hasActiveFilters}
                tagFacets={tagFacets}
                onClearFilters={() => {
                  setFilters({});
                  setSearchQuery("");
                }}
              />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-auto flex flex-col">
          <div className="p-4 space-y-4">
            <DataSourceCards
              sources={sources}
              selectedSourceIds={selectedSourceIds}
              onToggleSource={toggleSource}
              onConnectSource={() => setConnectOpen(true)}
            />
            {health && (
              <IngestionHealthBar
                health={health}
                sources={sources}
                onFilterFailed={() => setFilters((f) => ({ ...f, ingestion_status: "failed" }))}
              />
            )}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]"
                />
                <Input
                  placeholder="Search documents, tags…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-[#F5F5F5]"
                />
              </div>
              <select
                value={sortBy + "-" + sortOrder}
                onChange={(e) => {
                  const [by, order] = e.target.value.split("-") as [string, "asc" | "desc"];
                  setSortBy(by);
                  setSortOrder(order);
                }}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F5F5] shrink-0 h-10"
              >
                <option value="last_updated-desc">Updated (newest)</option>
                <option value="last_updated-asc">Updated (oldest)</option>
                <option value="title-asc">Title (A–Z)</option>
                <option value="title-desc">Title (Z–A)</option>
                <option value="file_size_kb-desc">Size (largest first)</option>
              </select>
            </div>

            <DocumentGrid
              documents={documents}
              viewMode="list"
              loading={loading}
              onSelectDocument={setSelectedDoc}
            />
          </div>
        </main>

        {selectedDoc && (
          <DocumentDetailPanel
            document={selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onUpdate={() => load()}
            onTagsChange={handleDocumentTagsChange}
          />
        )}
      </div>

      <div className="md:hidden fixed bottom-4 left-4 z-40">
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 bg-[#161616]"
          onClick={() => setFiltersDrawerOpen(true)}
        >
          Filters
        </Button>
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
