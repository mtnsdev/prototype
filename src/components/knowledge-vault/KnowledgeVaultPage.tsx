"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ChevronDown, Info, RefreshCw, Search, Shield, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MOCK_TEAMS, resolveUserPolicies } from "@/lib/teamsMock";
import { dataSourceTypeToPolicySourceId } from "@/lib/knowledgeDocumentScope";
import { useToast } from "@/contexts/ToastContext";
import { useKvShareSuggestions } from "@/contexts/KvShareSuggestionsContext";
import { useTeams } from "@/contexts/TeamsContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchKnowledgeSources, fetchKnowledgeDocuments } from "@/lib/knowledge-vault-api";
import type { DataLayer, DataSource, KnowledgeDocument } from "@/types/knowledge-vault";
import KnowledgeVaultFilters, { type KnowledgeVaultFiltersState } from "./KnowledgeVaultFilters";
import DataSourceCards from "./DataSourceCards";
import DocumentGrid from "./DocumentGrid";
import DocumentDetailPanel from "./DocumentDetailPanel";
import EmailIngestionView from "./EmailIngestionView";
import KnowledgeVaultPermissionsPanel from "./KnowledgeVaultPermissionsPanel";
import ConnectSourceModal from "./ConnectSourceModal";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { VAULT_CATALOG_COUNT_TOOLTIP, getKnowledgeVaultDistinctTags } from "./knowledgeVaultMockData";
import { useUser } from "@/contexts/UserContext";
import { knowledgeDocumentUiScope } from "@/lib/knowledgeDocumentScope";
import {
  canAdminRescopeDocument,
  canSeeKnowledgeDocument,
  isOversightPrivateDoc,
  matchesKvScopeFilter,
  type KvScopeOverrides,
} from "@/lib/knowledgeVaultVisibility";

const EMAIL_SOURCE_ID = "src-email";

/** Fetch enough rows for client-side visibility filters; table pages this list. */
const KV_FETCH_LIMIT = 5000;
const KV_PAGE_SIZE = 20;

function kvPaginationItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const edge = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...edge].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push("gap");
    out.push(sorted[i]!);
  }
  return out;
}

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
  const { user, kvViewAsAdmin } = useUser();
  const toast = useToast();
  const kvShare = useKvShareSuggestions();
  const { teams: liveTeams } = useTeams();
  const isAdmin = kvViewAsAdmin || user?.role === "admin";
  const currentUserOwnerId = user?.id != null ? String(user.id) : "1";

  const [sources, setSources] = useState<DataSource[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAllPrivateDocs, setShowAllPrivateDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<KvSortOption>("updated_desc");
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [filters, setFilters] = useState<KnowledgeVaultFiltersState>({});
  const [docScopeOverrides, setDocScopeOverrides] = useState<KvScopeOverrides>({});
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [listPage, setListPage] = useState(1);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [docTagOverrides, setDocTagOverrides] = useState<Record<string, string[]>>({});
  const [deleteModal, setDeleteModal] = useState<
    null | { mode: "single"; doc: KnowledgeDocument } | { mode: "bulk"; count: number }
  >(null);
  const filtersPanelRef = useRef<HTMLDivElement>(null);
  const scopeTeamsForFilter = useMemo(() => {
    if (isAdmin) return liveTeams;
    const uid = String(user?.id ?? "");
    return liveTeams.filter((t) => t.isDefault || (uid && t.memberIds.includes(uid)));
  }, [isAdmin, liveTeams, user?.id]);

  const vaultTagFilterOptions = useMemo(() => getKnowledgeVaultDistinctTags(), []);

  const resolvedPolicies = useMemo(
    () =>
      resolveUserPolicies(user ? { id: String(user.id), role: isAdmin ? "admin" : user.role } : null, MOCK_TEAMS),
    [user, isAdmin]
  );

  const isSourcePolicyBlocked = useCallback(
    (source: DataSource) => {
      if (resolvedPolicies.accessibleSources === "all") return false;
      const key = dataSourceTypeToPolicySourceId(source.source_type);
      if (!key) return false;
      return !resolvedPolicies.accessibleSources.includes(key);
    },
    [resolvedPolicies]
  );

  const emailOnlyView =
    filters.source_ids?.length === 1 && filters.source_ids[0] === EMAIL_SOURCE_ID;

  const load = useCallback(async () => {
    setLoading(true);
    const { sort_by, sort_order } = kvSortToApi(sortOption);
    const emailOnly = filters.source_ids?.length === 1 && filters.source_ids[0] === EMAIL_SOURCE_ID;
    try {
      const [srcList, docRes] = await Promise.all([
        fetchKnowledgeSources(),
        fetchKnowledgeDocuments({
          data_layer: emailOnly ? undefined : scopeFilterToDataLayer(filters.scope),
          ingestion_status: emailOnly ? undefined : filters.ingestion_status,
          source_ids: filters.source_ids?.length ? filters.source_ids.join(",") : undefined,
          tags: emailOnly ? undefined : filters.tags?.length ? filters.tags.join(",") : undefined,
          search: searchQuery.trim() || undefined,
          sort_by,
          sort_order,
          page: 1,
          limit: KV_FETCH_LIMIT,
        }),
      ]);
      setSources(Array.isArray(srcList) ? srcList : []);
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
        canSeeKnowledgeDocument(
          doc,
          currentUserOwnerId,
          isAdmin,
          showAllPrivateDocs,
          docScopeOverrides,
          resolvedPolicies
        )
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
    resolvedPolicies,
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
    kvShare.setApprovalHandler((docId, teamId) => {
      const d = documents.find((x) => x.id === docId);
      if (d && canAdminRescopeDocument(d)) applyDocScopeOverride(d, teamId);
      const label = MOCK_TEAMS.find((t) => t.id === teamId)?.name ?? teamId;
      toast(`Scope changed to ${label}`);
    });
    return () => kvShare.setApprovalHandler(null);
  }, [kvShare, documents, applyDocScopeOverride, toast]);

  useEffect(() => {
    setSelectedDocIds([]);
    setListPage(1);
  }, [filters, searchQuery, sortOption, showAllPrivateDocs]);

  const handleShareDocument = useCallback(
    (doc: KnowledgeDocument, teamId: string) => {
      const team = MOCK_TEAMS.find((t) => t.id === teamId);
      const name = team?.name ?? "team";
      if (isAdmin && canAdminRescopeDocument(doc)) {
        applyDocScopeOverride(doc, teamId);
        toast(`Scope changed to ${name}`);
        return;
      }
      if (!isAdmin) {
        kvShare.addSuggestion({
          docId: doc.id,
          docTitle: doc.title,
          teamId,
          teamName: name,
        });
        toast({
          title: "Suggestion sent",
          description: `Suggested sharing "${doc.title}" with ${name}. An admin will review.`,
          duration: 4000,
        });
        return;
      }
      toast("Scope can't be changed for this document.");
    },
    [isAdmin, applyDocScopeOverride, toast, kvShare]
  );

  const handleDeleteDocument = useCallback(
    (doc: KnowledgeDocument) => {
      if (!isAdmin) return;
      setDeleteModal({ mode: "single", doc });
    },
    [isAdmin]
  );

  const toggleDocSelected = useCallback((docId: string) => {
    setSelectedDocIds((prev) => (prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]));
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedDocIds((prev) => {
      const ids = visibleDocuments.map((d) => d.id);
      const allOn = ids.length > 0 && ids.every((id) => prev.includes(id));
      return allOn ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])];
    });
  }, [visibleDocuments]);

  const bulkShareWithTeam = useCallback(
    (teamId: string) => {
      const team = MOCK_TEAMS.find((t) => t.id === teamId);
      const name = team?.name ?? "team";
      const targets = visibleDocuments.filter((d) => selectedDocIds.includes(d.id));
      if (targets.length === 0) return;
      if (!isAdmin) {
        kvShare.addSuggestions(
          targets.map((d) => ({
            docId: d.id,
            docTitle: d.title,
            teamId,
            teamName: name,
          }))
        );
        toast({
          title: "Suggestion sent",
          description: `Suggested sharing ${targets.length} document${targets.length > 1 ? "s" : ""} with ${name}. An admin will review.`,
          duration: 4000,
        });
        return;
      }
      setDocScopeOverrides((prev) => {
        const next = { ...prev };
        for (const doc of targets) {
          if (canAdminRescopeDocument(doc)) next[doc.id] = teamId;
        }
        return next;
      });
      toast(`Scope updated for applicable documents — ${name}`);
    },
    [isAdmin, selectedDocIds, visibleDocuments, toast, kvShare]
  );

  const bulkDownload = useCallback(() => {
    if (!resolvedPolicies.canExportDocuments) {
      toast("Your team policy doesn’t allow exporting documents.");
      return;
    }
    toast("Download started (demo)");
  }, [toast, resolvedPolicies.canExportDocuments]);

  const openDocument = useCallback((doc: KnowledgeDocument) => {
    setPermissionsOpen(false);
    setSelectedDoc(doc);
  }, []);

  const bulkDelete = useCallback(() => {
    if (!isAdmin || selectedDocIds.length === 0) return;
    setDeleteModal({ mode: "bulk", count: selectedDocIds.length });
  }, [isAdmin, selectedDocIds.length]);

  const confirmMoveToTrash = useCallback(() => {
    if (!deleteModal) return;
    toast("Documents moved to trash (demo). They will be removed after 30 days unless restored.");
    if (deleteModal.mode === "bulk") {
      setSelectedDocIds([]);
    } else if (selectedDoc?.id === deleteModal.doc.id) {
      setSelectedDoc(null);
    }
    setDeleteModal(null);
  }, [deleteModal, toast, selectedDoc]);

  const selectedDocEffectiveTags = useMemo(() => {
    if (!selectedDoc) return [];
    return docTagOverrides[selectedDoc.id] ?? selectedDoc.tags;
  }, [selectedDoc, docTagOverrides]);

  const addSelectedDocTag = useCallback(
    (tag: string) => {
      if (!selectedDoc) return;
      setDocTagOverrides((prev) => {
        const cur = prev[selectedDoc.id] ?? selectedDoc.tags;
        if (cur.includes(tag)) return prev;
        return { ...prev, [selectedDoc.id]: [...cur, tag] };
      });
    },
    [selectedDoc]
  );

  const removeSelectedDocTag = useCallback(
    (tag: string) => {
      if (!selectedDoc) return;
      setDocTagOverrides((prev) => {
        const base = prev[selectedDoc.id] ?? selectedDoc.tags;
        return { ...prev, [selectedDoc.id]: base.filter((t) => t !== tag) };
      });
    },
    [selectedDoc]
  );

  const renameSelectedDocTag = useCallback(
    (oldTag: string, newTag: string) => {
      if (!selectedDoc) return;
      const t = newTag.trim();
      if (!t || t === oldTag) return;
      setDocTagOverrides((prev) => {
        const base = prev[selectedDoc.id] ?? selectedDoc.tags;
        const withoutOld = base.filter((x) => x !== oldTag);
        if (withoutOld.includes(t)) return prev;
        return { ...prev, [selectedDoc.id]: base.map((x) => (x === oldTag ? t : x)) };
      });
    },
    [selectedDoc]
  );

  useEffect(() => {
    if (!selectedDoc || emailOnlyView) return;
    if (!visibleDocuments.some((d) => d.id === selectedDoc.id)) {
      setSelectedDoc(null);
    }
  }, [visibleDocuments, selectedDoc, emailOnlyView]);

  const totalVisible = visibleDocuments.length;
  const listCount = emailOnlyView ? totalDocs : totalVisible;
  const totalListPages = Math.max(1, Math.ceil(totalVisible / KV_PAGE_SIZE));

  useEffect(() => {
    setListPage((p) => Math.min(p, totalListPages));
  }, [totalListPages]);

  const pagedVisibleDocuments = useMemo(() => {
    const start = (listPage - 1) * KV_PAGE_SIZE;
    return visibleDocuments.slice(start, start + KV_PAGE_SIZE);
  }, [visibleDocuments, listPage]);

  const pageSummaryStart = totalVisible === 0 ? 0 : (listPage - 1) * KV_PAGE_SIZE + 1;
  const pageSummaryEnd = totalVisible === 0 ? 0 : Math.min(listPage * KV_PAGE_SIZE, totalVisible);
  const pageItems = useMemo(() => kvPaginationItems(listPage, totalListPages), [listPage, totalListPages]);

  const vaultDocFiltersActive = useMemo(() => {
    return (
      Boolean(searchQuery.trim()) ||
      Boolean(filters.source_ids?.length) ||
      filters.scope != null ||
      Boolean(filters.tags?.length) ||
      filters.ingestion_status != null
    );
  }, [filters, searchQuery]);

  const hasDocumentFilters = useMemo(() => {
    return (
      Boolean(searchQuery.trim()) ||
      filters.scope != null ||
      Boolean(filters.tags?.length) ||
      filters.ingestion_status != null
    );
  }, [filters.scope, filters.tags, filters.ingestion_status, searchQuery]);

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

  const clearDocumentFilters = useCallback(() => {
    setFilters((f) => ({
      ...f,
      scope: undefined,
      tags: undefined,
      ingestion_status: undefined,
    }));
    setSearchQuery("");
  }, []);

  const filterPanelProps = {
    filters,
    onFiltersChange: setFilters,
    hasDocumentFilters,
    onClearDocumentFilters: clearDocumentFilters,
    tagOptions: vaultTagFilterOptions,
    scopeTeams: scopeTeamsForFilter,
  };

  return (
    <div className="h-full flex flex-col bg-[#08080c] text-[#F5F5F5]">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] px-6 py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-none text-[#F5F5F5]">Knowledge Vault</h1>
          <p className="mt-1 text-[11px] leading-snug text-[rgba(245,245,245,0.5)]">
            {vaultDocFiltersActive ? (
              <>
                {emailOnlyView ? (
                  <>Email ingestion · </>
                ) : null}
                <span className="border-b border-dotted border-gray-500 cursor-help" title={VAULT_CATALOG_COUNT_TOOLTIP}>
                  {listCount} documents
                </span>
                {emailOnlyView ? null : <> matching · </>}
                {" "}
                {connectedCount} sources · Last sync 2 min ago
              </>
            ) : (
              <>
                <span className="border-b border-dotted border-gray-500 cursor-help" title={VAULT_CATALOG_COUNT_TOOLTIP}>
                  {listCount} documents
                </span>
                {" · "}
                {connectedCount} sources · Last sync 2 min ago
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isAdmin && !emailOnlyView && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-white/10 px-2.5 text-[11px] text-[#F5F5F5]"
              onClick={() => {
                setSelectedDoc(null);
                setPermissionsOpen(true);
              }}
            >
              <Settings2 size={13} className="mr-1 shrink-0" />
              Manage Permissions
            </Button>
          )}
          {isAdmin && !emailOnlyView && (
            <label className="flex h-8 cursor-pointer select-none items-center gap-2 shrink-0">
              <span className="sr-only">Show all documents including other advisors private files</span>
              <div
                className={cn(
                  "relative w-7 h-4 rounded-full transition-colors shrink-0",
                  showAllPrivateDocs ? "bg-blue-500/20" : "bg-white/[0.06]"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-3 h-3 rounded-full transition-transform",
                    showAllPrivateDocs ? "translate-x-3.5 bg-blue-400" : "translate-x-0.5 bg-gray-500"
                  )}
                />
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={showAllPrivateDocs}
                onChange={(e) => setShowAllPrivateDocs(e.target.checked)}
              />
              <span className="text-[10px] text-gray-500">Show all</span>
              {showAllPrivateDocs && <Shield className="w-3 h-3 text-gray-600 shrink-0" aria-hidden />}
            </label>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-white/10 px-2.5 text-[11px] text-[#F5F5F5]"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "mr-1 shrink-0 animate-spin" : "mr-1 shrink-0"} />
            Sync All
          </Button>
        </div>
      </header>
      {IS_PREVIEW_MODE && (
        <PreviewBanner feature="Knowledge Vault" variant="full" dismissible sampleDataOnly />
      )}

      <div className="flex-1 flex min-h-0">
        <main className="flex-1 min-w-0 overflow-auto flex flex-col bg-[#08080c]">
          <div className="p-4 space-y-4">
            <DataSourceCards
              sources={sources}
              selectedSourceIds={selectedSourceIds}
              onToggleSource={toggleSource}
              onConnectSource={() => setConnectOpen(true)}
              loading={loading}
              isSourcePolicyBlocked={isSourcePolicyBlocked}
              isAdmin={isAdmin}
            />
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative min-w-[200px] flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                />
                <Input
                  placeholder="Search documents…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-[#F5F5F5]"
                  disabled={emailOnlyView}
                />
              </div>
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
                        className="text-[var(--text-tertiary)] shrink-0 transition-transform group-open:rotate-180"
                      />
                    </span>
                    {hasDocumentFilters && (
                      <span className="text-[10px] uppercase tracking-wide text-[var(--muted-amber-text)] shrink-0">
                        Active
                      </span>
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
              <>
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  <Info className="w-3 h-3 shrink-0" aria-hidden />
                  <span>
                    Enable indexes PDFs, Word docs, spreadsheets, text files, and images. Other file types are
                    stored but not searchable in chat.
                  </span>
                </div>
                {selectedDocIds.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <span className="text-xs text-gray-400">
                      {selectedDocIds.length} document{selectedDocIds.length > 1 ? "s" : ""} selected
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="text-[10px] px-3 py-1.5 rounded-lg bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.06]"
                          >
                            {isAdmin ? "Share with…" : "Suggest sharing…"}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                          {MOCK_TEAMS.map((team) => (
                            <DropdownMenuItem
                              key={team.id}
                              className="text-xs text-gray-400 focus:text-white"
                              onClick={() => bulkShareWithTeam(team.id)}
                            >
                              {team.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {resolvedPolicies.canExportDocuments ? (
                        <button
                          type="button"
                          className="text-[10px] px-3 py-1.5 rounded-lg bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.06]"
                          onClick={bulkDownload}
                        >
                          Download
                        </button>
                      ) : null}
                      {isAdmin && (
                        <button
                          type="button"
                          className="text-[10px] px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.06]"
                          style={{ color: "#A66B6B" }}
                          onClick={bulkDelete}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <DocumentGrid
                  documents={pagedVisibleDocuments}
                  viewMode="list"
                  loading={loading}
                  onSelectDocument={openDocument}
                  isOversightPrivate={oversightPrivate}
                  scopeOverrides={docScopeOverrides}
                  listSelection={{
                    selectedIds: selectedDocIds,
                    onToggle: toggleDocSelected,
                    onSelectAllToggle: toggleSelectAllVisible,
                  }}
                  isAdmin={isAdmin}
                  teams={MOCK_TEAMS.map((t) => ({ id: t.id, name: t.name }))}
                  onShareDocument={handleShareDocument}
                  onDeleteDocument={handleDeleteDocument}
                  canExportDocuments={resolvedPolicies.canExportDocuments}
                  shareSubmenuLabel={isAdmin ? "Share with…" : "Suggest sharing…"}
                  listSortControl={
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as KvSortOption)}
                      className="h-8 min-w-[10.5rem] rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] text-[var(--text-secondary)] outline-none"
                      aria-label="Sort documents"
                    >
                      <option value="updated_desc">Updated (newest)</option>
                      <option value="updated_asc">Updated (oldest)</option>
                      <option value="title_asc">Title (A–Z)</option>
                      <option value="title_desc">Title (Z–A)</option>
                      <option value="size_desc">Size (largest)</option>
                      <option value="size_asc">Size (smallest)</option>
                    </select>
                  }
                />
                {!loading && totalVisible > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06] text-[11px] text-[var(--text-tertiary)]">
                    <span className="tabular-nums">
                      Showing {pageSummaryStart}–{pageSummaryEnd} of {totalVisible}
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[var(--text-quaternary)] mr-1">Page</span>
                      <button
                        type="button"
                        disabled={listPage <= 1}
                        onClick={() => setListPage((p) => Math.max(1, p - 1))}
                        className="px-2 py-1 rounded-md bg-white/[0.04] text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                      >
                        Prev
                      </button>
                      {pageItems.map((item, idx) =>
                        item === "gap" ? (
                          <span key={`g-${idx}`} className="px-1 text-gray-600">
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setListPage(item)}
                            className={cn(
                              "min-w-[2rem] px-2 py-1 rounded-md tabular-nums",
                              item === listPage
                                ? "bg-white/15 text-white"
                                : "bg-white/[0.04] text-gray-400 hover:text-white"
                            )}
                          >
                            {item}
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        disabled={listPage >= totalListPages}
                        onClick={() => setListPage((p) => Math.min(totalListPages, p + 1))}
                        className="px-2 py-1 rounded-md bg-white/[0.04] text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {permissionsOpen && isAdmin && !emailOnlyView && (
          <KnowledgeVaultPermissionsPanel sources={sources} onClose={() => setPermissionsOpen(false)} />
        )}
        {selectedDoc && !emailOnlyView && !permissionsOpen && (
          <DocumentDetailPanel
            document={selectedDoc}
            oversightPrivate={oversightPrivate(selectedDoc)}
            scopeOverrides={docScopeOverrides}
            isAdmin={isAdmin}
            currentUserOwnerId={currentUserOwnerId}
            onScopeChange={(scope) => applyDocScopeOverride(selectedDoc, scope)}
            onClose={() => setSelectedDoc(null)}
            canExportDocuments={resolvedPolicies.canExportDocuments}
            documentTags={selectedDocEffectiveTags}
            onAddDocumentTag={addSelectedDocTag}
            onRemoveDocumentTag={removeSelectedDocTag}
            onRenameDocumentTag={renameSelectedDocTag}
            onSuggestShareWithTeam={(teamId, teamName) => {
              const d = selectedDoc;
              if (!d) return;
              kvShare.addSuggestion({
                docId: d.id,
                docTitle: d.title,
                teamId,
                teamName,
              });
              toast({
                title: "Suggestion sent",
                description: `Suggested sharing "${d.title}" with ${teamName}. An admin will review.`,
                duration: 4000,
              });
            }}
          />
        )}
      </div>

      <Dialog open={deleteModal != null} onOpenChange={(o) => !o && setDeleteModal(null)}>
        <DialogContent className="bg-[#0e0e12] border border-white/[0.06] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Move to trash?</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              {deleteModal?.mode === "single" ? (
                <>
                  &quot;{deleteModal.doc.title}&quot; will be moved to trash and automatically deleted after 30
                  days.
                </>
              ) : deleteModal?.mode === "bulk" ? (
                <>
                  {deleteModal.count} documents will be moved to trash and automatically deleted after 30 days.
                </>
              ) : null}
              <br />
              <br />
              An admin can restore these documents within 30 days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/[0.06] bg-white/[0.04] text-sm text-gray-300"
              onClick={() => setDeleteModal(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="text-sm"
              style={{
                background: "rgba(166,107,107,0.10)",
                border: "1px solid rgba(166,107,107,0.20)",
                color: "#A66B6B",
              }}
              onClick={confirmMoveToTrash}
            >
              Move to trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConnectSourceModal open={connectOpen} onClose={() => setConnectOpen(false)} sources={sources} />
    </div>
  );
}
