"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Upload,
  RefreshCw,
  Search,
  X,
  BookMarked,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchKnowledgeSources,
  fetchKnowledgeDocuments,
  fetchKnowledgeHealth,
} from "@/lib/knowledge-vault-api";
import type {
  DataSource,
  KnowledgeDocument,
  IngestionHealth,
  DataLayer,
  DocumentType,
  Freshness,
  IngestionStatus,
} from "@/types/knowledge-vault";
import KnowledgeVaultFilters from "./KnowledgeVaultFilters";
import DataSourceCards from "./DataSourceCards";
import IngestionHealthBar from "./IngestionHealthBar";
import DocumentGrid from "./DocumentGrid";
import DocumentDetailPanel from "./DocumentDetailPanel";
import UploadDocumentModal from "./UploadDocumentModal";
import ConnectSourceModal from "./ConnectSourceModal";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`;
  return Math.floor(sec / 604800) + " weeks ago";
}

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
    source_id?: string;
    data_layer?: DataLayer;
    document_type?: DocumentType;
    freshness?: Freshness;
    ingestion_status?: IngestionStatus;
    tags?: string[];
  }>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [srcList, healthRes, docRes] = await Promise.all([
        fetchKnowledgeSources(),
        fetchKnowledgeHealth(),
        fetchKnowledgeDocuments({
          ...filters,
          search: searchQuery || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          page: 1,
          limit: 50,
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

  const lastSyncLabel = sources[0]?.last_sync
    ? timeAgo(sources[0].last_sync)
    : "—";
  const hasActiveFilters = Object.keys(filters).some(
    (k) => filters[k as keyof typeof filters] != null
  );

  return (
    <div className="h-full flex flex-col bg-[#0C0C0C] text-[#F5F5F5]">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Knowledge Vault" variant="full" dismissible sampleDataOnly />}
      {/* Header */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Knowledge Vault</h1>
          <p className="text-sm text-[rgba(245,245,245,0.6)] mt-0.5">
            {totalDocs} documents · {sources.filter((s) => s.status === "connected").length} sources
            · Last sync {lastSyncLabel}
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

      {/* Three-panel layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left sidebar — filters (desktop) */}
        <aside className="w-64 shrink-0 border-r border-[rgba(255,255,255,0.08)] bg-[#0C0C0C] overflow-y-auto hidden md:block">
          <KnowledgeVaultFilters
            sources={sources}
            filters={filters}
            onFiltersChange={setFilters}
            onConnectSource={() => setConnectOpen(true)}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => setFilters({})}
          />
        </aside>

        {/* Mobile filters drawer */}
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
                onConnectSource={() => { setConnectOpen(true); setFiltersDrawerOpen(false); }}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => setFilters({})}
              />
            </div>
          </div>
        )}

        {/* Main: source cards + health + search + grid */}
        <main className="flex-1 min-w-0 overflow-auto flex flex-col">
          <div className="p-4 space-y-4">
            <DataSourceCards
              sources={sources}
              selectedSourceId={filters.source_id}
              onSelectSource={(id) =>
                setFilters((f) => ({ ...f, source_id: id || undefined }))
              }
              onConnectSource={() => setConnectOpen(true)}
            />
            {health && (
              <IngestionHealthBar
                health={health}
                onFilterFailed={() =>
                  setFilters((f) => ({ ...f, ingestion_status: "failed" }))
                }
              />
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(245,245,245,0.4)]"
                />
                <Input
                  placeholder="Search documents, summaries, tags…"
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
                className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F5F5F5]"
              >
                <option value="last_updated-desc">Updated (newest)</option>
                <option value="last_updated-asc">Updated (oldest)</option>
                <option value="title-asc">Title (A–Z)</option>
                <option value="title-desc">Title (Z–A)</option>
                <option value="quality_score-desc">Quality (high first)</option>
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

        {/* Right panel — document detail */}
        {selectedDoc && (
          <DocumentDetailPanel
            document={selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onUpdate={() => load()}
          />
        )}
      </div>

      {/* Mobile: open filters drawer */}
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
      <ConnectSourceModal open={connectOpen} onClose={() => setConnectOpen(false)} />
    </div>
  );
}
