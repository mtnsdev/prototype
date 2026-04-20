"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Info, RefreshCw, Shield, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog";
import { fetchKnowledgeSources, fetchKnowledgeDocuments } from "@/lib/knowledge-vault-api";
import type { DataLayer, DataSource, KnowledgeDocument } from "@/types/knowledge-vault";
import KnowledgeVaultFilters, { type KnowledgeVaultFiltersState } from "./KnowledgeVaultFilters";
import DataSourceCards from "./DataSourceCards";
import DocumentGrid from "./DocumentGrid";
import DocumentDetailPanel from "./DocumentDetailPanel";
import EmailIngestionView from "./EmailIngestionView";
import KnowledgeVaultPermissionsPanel from "./KnowledgeVaultPermissionsPanel";
import ConnectSourceModal from "./ConnectSourceModal";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { VAULT_CATALOG_COUNT_TOOLTIP, getKnowledgeVaultDistinctTags } from "./knowledgeVaultMockData";
import { useUser } from "@/contexts/UserContext";
import { knowledgeDocumentUiScope } from "@/lib/knowledgeDocumentScope";
import {
  canAdminRescopeDocument,
  canSeeKnowledgeDocument,
  effectiveUiScope,
  isOversightPrivateDoc,
  matchesKvScopeFilter,
  type KvScopeOverrides,
} from "@/lib/knowledgeVaultVisibility";
import { KV_OFFBOARDING_PLAYBOOK } from "@/lib/knowledgeVaultOffboardingPolicy";
import {
  getKvAccessAuditSnapshot,
  recordKvAccessAudit,
  subscribeKvAccessAudit,
} from "@/lib/knowledgeVaultAuditLog";
import {
  kvSortToApi,
  kvToggleSortColumn,
  type KvSortColumn,
  type KvSortOption,
} from "@/lib/knowledgeVaultSort";
import { buildKnowledgeVaultSearchParams, parseKnowledgeVaultSearchParams } from "@/lib/knowledgeVaultUrl";
import { AppPageHeroHeader } from "@/components/ui/app-page-hero-header";
import { APP_PAGE_CONTENT_SHELL } from "@/lib/dashboardChrome";
import { TEAM_EVERYONE_ID } from "@/types/teams";

const EMAIL_SOURCE_ID = "src-email";
const KV_SEARCH_DEBOUNCE_MS = 320;

/** Fetch enough rows for in-browser visibility filters; table pages this list. */
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

function scopeFilterToDataLayer(scope: string | undefined): DataLayer | undefined {
  if (scope == null) return undefined;
  if (scope === "private") return "advisor";
  return "agency";
}

function formatKvAuditScope(scopeKey: string): string {
  if (scopeKey === "private") return "Private";
  if (scopeKey === "mirrors_source") return "Based on access";
  if (scopeKey === TEAM_EVERYONE_ID) return "Everyone";
  const t = MOCK_TEAMS.find((x) => x.id === scopeKey);
  return t?.name ?? scopeKey;
}

function formatKnowledgeVaultLastSync(sources: DataSource[]): string {
  const connected = sources.filter((s) => s.status === "connected");
  if (connected.length === 0) return "Connect a source to sync";
  let best: number | null = null;
  for (const s of connected) {
    if (!s.last_sync) continue;
    const t = new Date(s.last_sync).getTime();
    if (Number.isNaN(t)) continue;
    best = best == null ? t : Math.max(best, t);
  }
  if (best == null) return "No sync timestamps yet";
  const diffMin = Math.floor((Date.now() - best) / 60000);
  if (diffMin < 1) return "Last sync just now";
  if (diffMin < 60) return `Last sync ${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 48) return `Last sync ${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `Last sync ${diffD}d ago`;
}

export default function KnowledgeVaultPage() {
  const { user, prototypeAdminView } = useUser();
  const toast = useToast();
  const kvShare = useKvShareSuggestions();
  const { teams: liveTeams } = useTeams();
  const effectiveUser = useMemo(
    () =>
      user ??
      (IS_PREVIEW_MODE
        ? {
            id: 1,
            role: "advisor",
            username: "Demo Advisor",
            email: "demo@agency.test",
            status: "active",
          }
        : null),
    [user]
  );
  const isAdmin = prototypeAdminView;
  const currentUserOwnerId = effectiveUser?.id != null ? String(effectiveUser.id) : "1";
  const router = useRouter();
  const pathname = usePathname();
  const kvUrlSyncedRef = useRef<string | null>(null);
  const kvUrlHydratedRef = useRef(false);

  const [sources, setSources] = useState<DataSource[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAllPrivateDocs, setShowAllPrivateDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOption, setSortOption] = useState<KvSortOption>("updated_desc");
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  /** Deep-link `?doc=` until the panel opens or we give up (keeps URL stable vs sync effect). */
  const [kvPendingOpenDocId, setKvPendingOpenDocId] = useState<string | null>(null);
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
    const uid = String(effectiveUser?.id ?? "");
    return liveTeams.filter((t) => t.isDefault || (uid && t.memberIds.includes(uid)));
  }, [isAdmin, liveTeams, effectiveUser?.id]);

  const vaultTagFilterOptions = useMemo(() => getKnowledgeVaultDistinctTags(), []);

  const resolvedPolicies = useMemo(
    () =>
      resolveUserPolicies(
        effectiveUser ? { id: String(effectiveUser.id), role: isAdmin ? "admin" : effectiveUser.role } : null,
        MOCK_TEAMS
      ),
    [effectiveUser, isAdmin]
  );

  const kvAccessAuditLog = useSyncExternalStore(
    subscribeKvAccessAudit,
    getKvAccessAuditSnapshot,
    getKvAccessAuditSnapshot
  );

  const auditActorLabel = effectiveUser?.username ?? effectiveUser?.email ?? "Admin";

  const syncKnowledgeVaultFromLocation = useCallback(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    kvUrlSyncedRef.current = sp.toString();
    const p = parseKnowledgeVaultSearchParams(sp);
    setSearchQuery(p.q);
    setDebouncedSearch(p.q.trim());
    setSortOption(p.sort ?? "updated_desc");
    setListPage(p.page ?? 1);
    setFilters(Object.keys(p.filters).length > 0 ? p.filters : {});
    if (p.docId) setKvPendingOpenDocId(p.docId);
    else {
      setKvPendingOpenDocId(null);
      setSelectedDoc(null);
    }
  }, []);

  const isSourcePolicyBlocked = useCallback(
    (source: DataSource) => {
      if (resolvedPolicies.accessibleSources === "all") return false;
      const key = dataSourceTypeToPolicySourceId(source.source_type);
      if (!key) return false;
      return !resolvedPolicies.accessibleSources.includes(key);
    },
    [resolvedPolicies]
  );

  const onListSortColumn = useCallback((column: KvSortColumn) => {
    setSortOption((prev) => kvToggleSortColumn(prev, column));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), KV_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useLayoutEffect(() => {
    if (kvUrlHydratedRef.current) return;
    kvUrlHydratedRef.current = true;
    syncKnowledgeVaultFromLocation();
  }, [syncKnowledgeVaultFromLocation]);

  useEffect(() => {
    const onPopState = () => syncKnowledgeVaultFromLocation();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [syncKnowledgeVaultFromLocation]);

  useEffect(() => {
    if (!kvUrlHydratedRef.current) return;
    const p = buildKnowledgeVaultSearchParams({
      debouncedSearch,
      sortOption,
      listPage,
      filters,
      openDocumentId: selectedDoc?.id ?? kvPendingOpenDocId,
    });
    const qs = p.toString();
    if (qs === kvUrlSyncedRef.current) return;
    kvUrlSyncedRef.current = qs;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedSearch, sortOption, listPage, filters, pathname, router, selectedDoc?.id, kvPendingOpenDocId]);

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
          search: debouncedSearch.trim() || undefined,
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
  }, [filters, debouncedSearch, sortOption]);

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

  useEffect(() => {
    const pending = kvPendingOpenDocId;
    if (!pending || loading) return;
    const match =
      visibleDocuments.find((d) => d.id === pending) ?? documents.find((d) => d.id === pending);
    if (match) {
      setKvPendingOpenDocId(null);
      setPermissionsOpen(false);
      setSelectedDoc(match);
      return;
    }
    setKvPendingOpenDocId(null);
  }, [loading, visibleDocuments, documents, kvPendingOpenDocId]);

  const oversightPrivate = useCallback(
    (doc: KnowledgeDocument) =>
      isOversightPrivateDoc(doc, currentUserOwnerId, isAdmin, showAllPrivateDocs, docScopeOverrides),
    [currentUserOwnerId, isAdmin, showAllPrivateDocs, docScopeOverrides]
  );

  const applyDocScopeOverride = useCallback(
    (doc: KnowledgeDocument, scope: "private" | string) => {
      const prevEff = effectiveUiScope(doc, docScopeOverrides);
      const base = knowledgeDocumentUiScope(doc);
      const nextEffective = scope === base ? base : scope;
      if (prevEff !== nextEffective) {
        recordKvAccessAudit({
          docId: doc.id,
          docTitle: doc.title,
          actorLabel: auditActorLabel,
          fromScope: prevEff,
          toScope: nextEffective,
        });
      }
      setDocScopeOverrides((prev) => {
        const next = { ...prev };
        if (scope === base) delete next[doc.id];
        else next[doc.id] = scope;
        return next;
      });
    },
    [docScopeOverrides, auditActorLabel]
  );

  useEffect(() => {
    kvShare.setApprovalHandler((docId, teamId) => {
      const d = documents.find((x) => x.id === docId);
      if (d && canAdminRescopeDocument(d)) applyDocScopeOverride(d, teamId);
      const label = MOCK_TEAMS.find((t) => t.id === teamId)?.name ?? teamId;
      toast({ title: `Access: ${label}`, tone: "success" });
    });
    return () => kvShare.setApprovalHandler(null);
  }, [kvShare, documents, applyDocScopeOverride, toast]);

  useEffect(() => {
    setSelectedDocIds([]);
    setListPage(1);
  }, [filters, debouncedSearch, sortOption, showAllPrivateDocs]);

  const handleShareDocument = useCallback(
    (doc: KnowledgeDocument, teamId: string) => {
      const team = MOCK_TEAMS.find((t) => t.id === teamId);
      const name = team?.name ?? "team";
      if (isAdmin && canAdminRescopeDocument(doc)) {
        applyDocScopeOverride(doc, teamId);
        toast({ title: `Access: ${name}`, tone: "success" });
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
          tone: "success",
        });
        return;
      }
      toast({
        title: "Access can't be changed for this document.",
        tone: "destructive",
      });
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
          tone: "success",
        });
        return;
      }
      setDocScopeOverrides((prev) => {
        const next = { ...prev };
        for (const doc of targets) {
          if (!canAdminRescopeDocument(doc)) continue;
          const prevEff = effectiveUiScope(doc, prev);
          if (prevEff === teamId) continue;
          recordKvAccessAudit({
            docId: doc.id,
            docTitle: doc.title,
            actorLabel: auditActorLabel,
            fromScope: prevEff,
            toScope: teamId,
          });
          next[doc.id] = teamId;
        }
        return next;
      });
      toast({
        title: `Access updated for applicable documents — ${name}`,
        tone: "success",
      });
    },
    [isAdmin, selectedDocIds, visibleDocuments, toast, kvShare, auditActorLabel]
  );

  const bulkDownload = useCallback(() => {
    if (!resolvedPolicies.canExportDocuments) {
      toast({
        title: "Your team policy doesn’t allow exporting documents.",
        tone: "destructive",
      });
      return;
    }
    toast({ title: "Download started (demo)", tone: "success" });
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
    toast({
      title: "Moved to trash (demo)",
      description: "Documents will be removed after 30 days unless restored.",
      tone: "success",
    });
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

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedDocIds((prev) => {
      const ids = pagedVisibleDocuments.map((d) => d.id);
      const allOn = ids.length > 0 && ids.every((id) => prev.includes(id));
      if (allOn) return prev.filter((id) => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });
  }, [pagedVisibleDocuments]);

  const selectAllMatchingVisible = useCallback(() => {
    setSelectedDocIds((prev) => [...new Set([...prev, ...visibleDocuments.map((d) => d.id)])]);
  }, [visibleDocuments]);

  const pageSummaryStart = totalVisible === 0 ? 0 : (listPage - 1) * KV_PAGE_SIZE + 1;
  const pageSummaryEnd = totalVisible === 0 ? 0 : Math.min(listPage * KV_PAGE_SIZE, totalVisible);
  const pageItems = useMemo(() => kvPaginationItems(listPage, totalListPages), [listPage, totalListPages]);

  const hasServerSideListFilters = useMemo(
    () =>
      Boolean(
        debouncedSearch.trim() ||
          filters.source_ids?.length ||
          filters.scope != null ||
          filters.tags?.length ||
          filters.ingestion_status != null
      ),
    [debouncedSearch, filters]
  );

  const lastSyncLabel = useMemo(() => formatKnowledgeVaultLastSync(sources), [sources]);

  const pageDocIds = useMemo(() => pagedVisibleDocuments.map((d) => d.id), [pagedVisibleDocuments]);
  const allOnPageSelected =
    pageDocIds.length > 0 && pageDocIds.every((id) => selectedDocIds.includes(id));
  const allMatchingSelected =
    totalVisible > 0 && visibleDocuments.every((d) => selectedDocIds.includes(d.id));
  const showSelectAllMatchingHint =
    allOnPageSelected && totalVisible > pageDocIds.length && !allMatchingSelected;

  const listRefetching = loading && documents.length > 0;

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
    searchActive: Boolean(searchQuery.trim()),
    tagOptions: vaultTagFilterOptions,
    scopeTeams: scopeTeamsForFilter,
  };

  const adminGovernanceFooter =
    isAdmin ? (
      <div className="mt-8 space-y-3 border-t border-border pt-6">
        <details className="group rounded-xl border border-border bg-foreground/[0.03] px-4 py-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground/90 hover:text-foreground list-none flex items-center justify-between gap-2">
            <span>{KV_OFFBOARDING_PLAYBOOK.title}</span>
            <span className="text-2xs text-muted-foreground/70 group-open:hidden">Show</span>
            <span className="text-2xs text-muted-foreground/70 hidden group-open:inline">Hide</span>
          </summary>
          <ul className="mt-3 space-y-2 text-2xs text-muted-foreground list-disc pl-4 leading-relaxed">
            {KV_OFFBOARDING_PLAYBOOK.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </details>
        <details className="group rounded-xl border border-border bg-foreground/[0.03] px-4 py-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground/90 hover:text-foreground list-none flex items-center justify-between gap-2">
            <span>Access change log — vault &amp; email (this session)</span>
            <span className="text-2xs text-muted-foreground/70 group-open:hidden">Show</span>
            <span className="text-2xs text-muted-foreground/70 hidden group-open:inline">Hide</span>
          </summary>
          {kvAccessAuditLog.length === 0 ? (
            <p className="mt-3 text-2xs text-muted-foreground/70">
              No access changes yet. Vault document panel, bulk share, and email ingest (thread or attachment access)
              write here in this session (demo only — production should use an immutable audit service).
            </p>
          ) : (
            <ul className="mt-3 max-h-48 overflow-y-auto space-y-2 text-2xs text-muted-foreground">
              {kvAccessAuditLog.map((e) => (
                <li key={e.id} className="border-b border-white/[0.04] pb-2 last:border-0">
                  <span className="text-muted-foreground/90">{new Date(e.at).toLocaleString()}</span>
                  {" · "}
                  <span className="text-foreground/88">{e.actorLabel}</span>
                  <br />
                  <span className="text-muted-foreground/90 truncate block" title={e.docTitle}>
                    {e.docTitle}
                  </span>
                  {formatKvAuditScope(e.fromScope)} → {formatKvAuditScope(e.toScope)}
                </li>
              ))}
            </ul>
          )}
        </details>
      </div>
    ) : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background text-foreground">
      <AppPageHeroHeader
        eyebrow="Knowledge"
        title="Knowledge Vault"
        subtitle={
          vaultDocFiltersActive ? (
            <>
              {emailOnlyView ? (
                <>Email ingestion · </>
              ) : null}
              <span className="border-b border-dotted border-input cursor-help" title={VAULT_CATALOG_COUNT_TOOLTIP}>
                {listCount} documents
              </span>
              {emailOnlyView ? null : <> matching · </>}
              {" "}
              {connectedCount} sources · {lastSyncLabel}
            </>
          ) : (
            <>
              <span className="border-b border-dotted border-input cursor-help" title={VAULT_CATALOG_COUNT_TOOLTIP}>
                {listCount} documents
              </span>
              {" · "}
              {connectedCount} sources · {lastSyncLabel}
            </>
          )
        }
        toolbar={
          <>
            {isAdmin && !emailOnlyView && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-input px-2.5 text-xs text-foreground"
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
              <label
                className="flex h-8 cursor-pointer select-none items-center gap-2 shrink-0"
                title="When enabled, your list includes other advisors’ private vault files for admin oversight. Your own private files are always shown. This does not change who can see what—only what you can browse as an admin."
              >
                <span className="sr-only">
                  When enabled, include other advisors private vault files for admin oversight. Your private
                  files are always visible. Does not change sharing permissions.
                </span>
                <div
                  className={cn(
                    "relative w-7 h-4 rounded-full transition-colors shrink-0",
                    showAllPrivateDocs ? "bg-blue-500/20" : "bg-white/[0.06]"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-3 h-3 rounded-full transition-transform",
                      showAllPrivateDocs ? "translate-x-3.5 bg-blue-400" : "translate-x-0.5 bg-muted-foreground/40"
                    )}
                  />
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={showAllPrivateDocs}
                  onChange={(e) => setShowAllPrivateDocs(e.target.checked)}
                />
                <span className="text-2xs text-muted-foreground">Show all</span>
                {showAllPrivateDocs && <Shield className="w-3 h-3 text-muted-foreground/70 shrink-0" aria-hidden />}
              </label>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-input px-2.5 text-xs text-foreground"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw size={13} className={loading ? "mr-1 shrink-0 animate-spin" : "mr-1 shrink-0"} />
              Sync All
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        <main className="flex-1 min-w-0 overflow-auto flex flex-col bg-background">
          <div className={cn(APP_PAGE_CONTENT_SHELL, "space-y-4 py-4")}>
            <DataSourceCards
              sources={sources}
              selectedSourceIds={selectedSourceIds}
              onToggleSource={toggleSource}
              onConnectSource={() => setConnectOpen(true)}
              loading={loading}
              isSourcePolicyBlocked={isSourcePolicyBlocked}
              isAdmin={isAdmin}
            />
            <div ref={filtersPanelRef} className="scroll-mt-6">
              <KnowledgeVaultFilters
                {...filterPanelProps}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchDisabled={emailOnlyView}
                hideScopeToolbar={emailOnlyView}
              />
            </div>

            {emailOnlyView ? (
              <>
                <EmailIngestionView loading={loading} />
                {adminGovernanceFooter}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-2xs text-muted-foreground/70">
                  <Info className="w-3 h-3 shrink-0" aria-hidden />
                  <span>
                    Enable indexes PDFs, Word docs, spreadsheets, text files, and images. Other file types are
                    stored but not searchable in chat.
                  </span>
                </div>
                {selectedDocIds.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/[0.03] border border-border rounded-xl">
                    <span className="text-xs text-muted-foreground/90">
                      {selectedDocIds.length} document{selectedDocIds.length > 1 ? "s" : ""} selected
                      {allMatchingSelected && totalVisible > 0 ? " · All matching results" : null}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="text-2xs px-3 py-1.5 rounded-lg bg-foreground/[0.05] text-muted-foreground/90 hover:text-foreground hover:bg-foreground/[0.06]"
                          >
                            {isAdmin ? "Share with…" : "Suggest sharing…"}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {MOCK_TEAMS.map((team) => (
                            <DropdownMenuItem
                              key={team.id}
                              className="text-xs text-muted-foreground/90 focus:text-white"
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
                          className="text-2xs px-3 py-1.5 rounded-lg bg-foreground/[0.05] text-muted-foreground/90 hover:text-foreground hover:bg-foreground/[0.06]"
                          onClick={bulkDownload}
                        >
                          Download
                        </button>
                      ) : null}
                      {isAdmin && (
                        <button
                          type="button"
                          className="text-2xs px-3 py-1.5 rounded-lg bg-foreground/[0.05] hover:bg-foreground/[0.06]"
                          style={{ color: "#A66B6B" }}
                          onClick={bulkDelete}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {showSelectAllMatchingHint && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-brand-cta/20 bg-brand-cta/[0.06] px-3 py-2 text-xs text-[#D4C4A8]">
                    <span>
                      All {pageDocIds.length} on this page are selected. Select all {totalVisible} documents
                      matching your filters?
                    </span>
                    <button
                      type="button"
                      onClick={selectAllMatchingVisible}
                      className="font-medium text-brand-cta underline-offset-2 hover:underline"
                    >
                      Select all {totalVisible}
                    </button>
                  </div>
                )}
                <DocumentGrid
                  documents={pagedVisibleDocuments}
                  loading={loading}
                  onSelectDocument={openDocument}
                  isOversightPrivate={oversightPrivate}
                  scopeOverrides={docScopeOverrides}
                  listSelection={{
                    selectedIds: selectedDocIds,
                    onToggle: toggleDocSelected,
                    onSelectAllPageToggle: toggleSelectAllOnPage,
                  }}
                  isAdmin={isAdmin}
                  teams={MOCK_TEAMS.map((t) => ({ id: t.id, name: t.name }))}
                  onShareDocument={handleShareDocument}
                  onDeleteDocument={handleDeleteDocument}
                  canExportDocuments={resolvedPolicies.canExportDocuments}
                  shareSubmenuLabel={isAdmin ? "Share with…" : "Suggest sharing…"}
                  listSort={{ option: sortOption, onColumnClick: onListSortColumn }}
                  listEmpty={
                    !loading && totalVisible === 0
                      ? {
                          variant:
                            documents.length === 0
                              ? hasServerSideListFilters
                                ? "filtered_empty"
                                : "api_empty"
                              : "vic_visibility",
                          onConnectSource: () => setConnectOpen(true),
                        }
                      : undefined
                  }
                  listRefetching={listRefetching}
                />
                {!loading && totalVisible > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border text-xs text-[var(--text-tertiary)]">
                    <span className="tabular-nums">
                      Showing {pageSummaryStart}–{pageSummaryEnd} of {totalVisible}
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[var(--text-quaternary)] mr-1">Page</span>
                      <button
                        type="button"
                        disabled={listPage <= 1}
                        onClick={() => setListPage((p) => Math.max(1, p - 1))}
                        className="px-2 py-1 rounded-md bg-foreground/[0.05] text-muted-foreground/90 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                      >
                        Prev
                      </button>
                      {pageItems.map((item, idx) =>
                        item === "gap" ? (
                          <span key={`g-${idx}`} className="px-1 text-muted-foreground/70">
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
                                : "bg-foreground/[0.05] text-muted-foreground/90 hover:text-foreground"
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
                        className="px-2 py-1 rounded-md bg-foreground/[0.05] text-muted-foreground/90 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
                {adminGovernanceFooter}
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
                tone: "success",
              });
            }}
          />
        )}
      </div>

      <DestructiveConfirmDialog
        open={deleteModal != null}
        onOpenChange={(o) => !o && setDeleteModal(null)}
        title="Move to trash?"
        description={
          deleteModal?.mode === "single" ? (
            <>
              &quot;{deleteModal.doc.title}&quot; will be moved to trash and automatically deleted after 30 days.
            </>
          ) : deleteModal?.mode === "bulk" ? (
            <>
              {deleteModal.count} document{deleteModal.count !== 1 ? "s" : ""} will be moved to trash and
              automatically deleted after 30 days.
            </>
          ) : null
        }
        consequence="An admin can restore these documents within 30 days."
        confirmLabel="Move to trash"
        cancelLabel="Cancel"
        onConfirm={async () => {
          confirmMoveToTrash();
        }}
      />

      <ConnectSourceModal open={connectOpen} onClose={() => setConnectOpen(false)} sources={sources} />
    </div>
  );
}
