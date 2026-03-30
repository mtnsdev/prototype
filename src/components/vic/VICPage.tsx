"use client";

import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AcuityStatus, RelationshipStatus, VIC } from "@/types/vic";
import type { AcuitySettings } from "@/types/vic";
import type { VICListParams } from "@/types/vic";
import type { VICTab } from "./TabBar";
import { fetchVICList, fetchAcuitySettings, exportVICs, triggerAcuitySingle, triggerAcuityBulk, deleteVIC, getVICId } from "@/lib/vic-api";
import { useUser } from "@/contexts/UserContext";
import { canEditVIC, canDeleteVIC, canShareVIC, getVICViewLevel } from "@/utils/vicPermissions";
import { FAKE_VICS, filterAndPaginateFakeVics } from "./fakeData";
import TabBar from "./TabBar";
import VICToolbar from "./VICToolbar";
import VICListView from "./VICListView";
import VICCardView from "./VICCardView";
import BulkActionsBar from "./BulkActionsBar";
import EmptyState from "./EmptyState";
import AddEditVICModal from "./Modals/AddEditVICModal";
import DeleteConfirmModal from "./Modals/DeleteConfirmModal";
import ImportCSVModal from "./Modals/ImportCSVModal";
import AcuityProgressModal from "./Modals/AcuityProgressModal";
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog";
import { IS_PREVIEW_MODE } from "@/config/preview";
import {
  buildVicListSearchParams,
  mergeVicListIntoUrl,
  parseVicListSearchParams,
} from "@/lib/vicListUrl";

const VIC_VIEW_KEY = "vic_view";
const VIC_SORT_KEY = "vic_sortBy";
const VIC_SORT_ORDER_KEY = "vic_sortOrder";
const PAGE_SIZE = 20;

export default function VICPage() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = (searchParams.get("tab") as VICTab) || "mine";
  const activeTab: VICTab = tabFromUrl === "shared" || tabFromUrl === "agency" ? tabFromUrl : "mine";

  const [vics, setVics] = useState<VIC[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [relationshipStatus, setRelationshipStatus] = useState<string | null>(null);
  const [acuityStatusFilter, setAcuityStatusFilter] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"list" | "cards">("list");
  const [sortBy, setSortBy] = useState("full_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const vicUrlHydratedRef = useRef(false);
  const vicUrlSyncedRef = useRef<string | null>(null);
  const skipPageResetRef = useRef(true);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || vicUrlHydratedRef.current) return;
    vicUrlHydratedRef.current = true;
    const sp = new URLSearchParams(window.location.search);
    vicUrlSyncedRef.current = sp.toString();
    const p = parseVicListSearchParams(sp);
    setSearchQuery(p.q);
    setSelectedCountry(p.country);
    setRelationshipStatus(p.status);
    setAcuityStatusFilter(p.acuity);
    if (sp.has("sort_by")) setSortBy(p.sortBy);
    else {
      try {
        const s = localStorage.getItem(VIC_SORT_KEY);
        if (s) setSortBy(s);
      } catch (_) {}
    }
    if (sp.has("sort_order")) setSortOrder(p.sortOrder);
    else {
      try {
        const o = localStorage.getItem(VIC_SORT_ORDER_KEY) as "asc" | "desc" | null;
        if (o === "asc" || o === "desc") setSortOrder(o);
      } catch (_) {}
    }
    if (sp.has("view")) setViewMode(p.view);
    else {
      try {
        const v = localStorage.getItem(VIC_VIEW_KEY) as "list" | "cards" | null;
        if (v === "cards") setViewMode("cards");
      } catch (_) {}
    }
    if (sp.has("page")) setPage(p.page);
  }, []);

  const [selectedVicIds, setSelectedVicIds] = useState<Set<string>>(new Set());

  const [isAddEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingVic, setEditingVic] = useState<VIC | null>(null);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingVic, setDeletingVic] = useState<VIC | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);
  const [isBulkAcuityModalOpen, setBulkAcuityModalOpen] = useState(false);

  const [acuitySettings, setAcuitySettings] = useState<AcuitySettings | null>(null);
  const [acuitySettingsLoaded, setAcuitySettingsLoaded] = useState(false);

  const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";

  const loadVics = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    const params: VICListParams = {
      tab: activeTab,
      search: searchQuery || undefined,
      country: selectedCountry || undefined,
      status: relationshipStatus as VICListParams["status"] ?? undefined,
      acuity_status: (acuityStatusFilter as VICListParams["acuity_status"]) ?? undefined,
      sortBy,
      sortOrder,
      page,
      limit: PAGE_SIZE,
    };
    try {
      const data = await fetchVICList(params);
      const apiEmpty = !data.vics?.length && (data.total ?? 0) === 0;
      if (IS_PREVIEW_MODE || apiEmpty) {
        const fake = filterAndPaginateFakeVics(FAKE_VICS, {
          tab: activeTab,
          userId: user?.id != null ? String(user.id) : undefined,
          search: params.search,
          country: params.country ?? undefined,
          status: relationshipStatus || undefined,
          acuityStatus: acuityStatusFilter || undefined,
          sortBy,
          sortOrder,
          page,
          limit: PAGE_SIZE,
        });
        setVics(fake.vics);
        setTotalCount(fake.total);
      } else {
        setVics(data.vics ?? []);
        setTotalCount(data.total ?? 0);
      }
    } catch (e) {
      const fake = filterAndPaginateFakeVics(FAKE_VICS, {
        tab: activeTab,
        userId: user?.id != null ? String(user.id) : undefined,
        search: searchQuery || undefined,
        country: selectedCountry ?? undefined,
        status: relationshipStatus || undefined,
        acuityStatus: acuityStatusFilter || undefined,
        sortBy,
        sortOrder,
        page,
        limit: PAGE_SIZE,
      });
      setVics(fake.vics);
      setTotalCount(fake.total);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, user?.id, searchQuery, selectedCountry, relationshipStatus, acuityStatusFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    loadVics();
  }, [loadVics]);

  // Poll when any VIC is running
  useEffect(() => {
    const hasRunning = vics.some((v) => v.acuityStatus === "running");
    if (!hasRunning) return;
    const t = setInterval(loadVics, 10000);
    return () => clearInterval(t);
  }, [vics, loadVics]);

  useEffect(() => {
    let cancelled = false;
    fetchAcuitySettings()
      .then((s) => {
        if (!cancelled) {
          setAcuitySettings(s);
          setAcuitySettingsLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setAcuitySettingsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!vicUrlHydratedRef.current) return;
    const built = buildVicListSearchParams({
      tab: activeTab,
      q: searchQuery,
      country: selectedCountry,
      status: relationshipStatus as RelationshipStatus | null,
      acuity: acuityStatusFilter as AcuityStatus | null,
      sortBy,
      sortOrder,
      view: viewMode,
      page,
    });
    const next = mergeVicListIntoUrl(new URLSearchParams(searchParams.toString()), built);
    const qs = next.toString();
    if (qs === vicUrlSyncedRef.current) return;
    vicUrlSyncedRef.current = qs;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    activeTab,
    searchQuery,
    selectedCountry,
    relationshipStatus,
    acuityStatusFilter,
    sortBy,
    sortOrder,
    viewMode,
    page,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    if (!vicUrlHydratedRef.current) return;
    if (skipPageResetRef.current) {
      skipPageResetRef.current = false;
      return;
    }
    setPage(1);
  }, [searchQuery, selectedCountry, relationshipStatus, acuityStatusFilter, activeTab]);

  // Force card view on mobile (< 768px)
  const [forceCardView, setForceCardView] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const fn = () => setForceCardView(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  const effectiveViewMode = forceCardView ? "cards" : viewMode;

  useEffect(() => {
    try {
      localStorage.setItem(VIC_VIEW_KEY, viewMode);
      localStorage.setItem(VIC_SORT_KEY, sortBy);
      localStorage.setItem(VIC_SORT_ORDER_KEY, sortOrder);
    } catch (_) {}
  }, [viewMode, sortBy, sortOrder]);

  const hasActiveFilters = searchQuery !== "" || selectedCountry !== null || relationshipStatus !== null || acuityStatusFilter !== null;
  const isEmpty = !isLoading && vics.length === 0 && !hasActiveFilters;
  const noResults = !isLoading && vics.length === 0 && hasActiveFilters;

  const currentUser = user ? { id: user.id, role: user.role, agency_id: user.agency_id } : null;
  const canEdit = (vic: VIC) => activeTab !== "agency" && canEditVIC(currentUser, vic);
  const canDelete = (vic: VIC) => activeTab !== "agency" && canDeleteVIC(currentUser, vic);
  const canShare = (vic: VIC) => canShareVIC(currentUser, vic);
  const viewLevel = (vic: VIC) => getVICViewLevel(currentUser, vic);

  const toggleSelect = (id: string) => {
    setSelectedVicIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedVicIds.size === vics.length) setSelectedVicIds(new Set());
    else setSelectedVicIds(new Set(vics.map((v) => getVICId(v))));
  };

  const clearSelection = () => setSelectedVicIds(new Set());

  const openAdd = () => {
    setEditingVic(null);
    setAddEditModalOpen(true);
  };
  const openEdit = (vic: VIC) => {
    setEditingVic(vic);
    setAddEditModalOpen(true);
  };
  const closeAddEdit = () => {
    setAddEditModalOpen(false);
    setEditingVic(null);
    loadVics();
  };

  const openDelete = (vic: VIC) => {
    setDeletingVic(vic);
    setDeleteModalOpen(true);
  };
  const closeDelete = () => {
    setDeleteModalOpen(false);
    setDeletingVic(null);
    loadVics();
  };

  const canRunAcuity = acuitySettings != null && acuitySettings.requester_type !== "" && acuitySettings.requester_name !== "" && acuitySettings.requester_location !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCountry(null);
    setRelationshipStatus(null);
    setAcuityStatusFilter(null);
    setPage(1);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-inset">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border pl-6 pr-[4.5rem] py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-none text-foreground">VICs</h1>
          <p className="mt-1 text-xs leading-snug text-muted-foreground/75">
            {hasActiveFilters ? (
              <>
                <span>
                  {totalCount} VIC{totalCount !== 1 ? "s" : ""}
                </span>
                {" · "}
                matching filters
              </>
            ) : (
              <span>
                {totalCount} VIC{totalCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
      </header>
      <TabBar activeTab={activeTab} className="shrink-0" />
      <div className="relative z-10 shrink-0 px-6 pb-0 pt-4">
        <VICToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        relationshipStatus={relationshipStatus}
        onRelationshipStatusChange={setRelationshipStatus}
        acuityStatus={acuityStatusFilter}
        onAcuityStatusChange={setAcuityStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => {
          setSortBy(by);
          setSortOrder(order);
        }}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        onAddVIC={activeTab === "mine" ? openAdd : undefined}
        onImportCSV={() => setImportModalOpen(true)}
        onClearFilters={clearFilters}
        onExportCSV={async () => {
          try {
            const blob = await exportVICs({ tab: activeTab, search: searchQuery, country: selectedCountry || undefined, sortBy, sortOrder, limit: 10000 });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "vics-export.csv";
            a.click();
            URL.revokeObjectURL(url);
          } catch (_) {}
        }}
        bulkSelectedCount={selectedVicIds.size}
        onBulkRunAcuity={selectedVicIds.size > 0 ? () => setBulkAcuityModalOpen(true) : undefined}
        onBulkDelete={selectedVicIds.size > 0 ? () => {
          const ids = Array.from(selectedVicIds);
          if (ids.length === 1) {
            const first = vics.find((v) => getVICId(v) === ids[0]);
            if (first) { setDeletingVic(first); setDeleteModalOpen(true); }
          } else setBulkDeleteIds(ids);
        } : undefined}
        />
      </div>

      {selectedVicIds.size > 0 && (
        <BulkActionsBar
          count={selectedVicIds.size}
          canRunAcuity={canRunAcuity}
          onRunAcuity={() => setBulkAcuityModalOpen(true)}
          onBulkUpdateStatus={(status) => {
            setVics((prev) =>
              prev.map((v) =>
                selectedVicIds.has(getVICId(v)) ? { ...v, relationship_status: status as VIC["relationship_status"] } : v
              )
            );
            clearSelection();
          }}
          onBulkTag={() => {
            // TODO: open BulkTagModal or inline tag picker
          }}
          onDelete={() => {
            const ids = Array.from(selectedVicIds);
            if (ids.length === 1) {
              const first = vics.find((v) => getVICId(v) === ids[0]);
              if (first) {
                setDeletingVic(first);
                setDeleteModalOpen(true);
              }
            } else {
              setBulkDeleteIds(ids);
            }
          }}
          onBulkExport={() => {
            const selected = vics.filter((v) => selectedVicIds.has(getVICId(v)));
            const headers = ["full_name", "email", "phone_primary", "home_city", "home_country", "relationship_status"];
            const rows = selected.map((v) =>
              headers.map((h) => (v as unknown as Record<string, unknown>)[h] ?? "").map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
            );
            const csv = [headers.join(","), ...rows].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "vics-selected.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
          onClearSelection={clearSelection}
        />
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4 md:p-6">
        {error && (
          <div className="rounded-lg bg-[var(--muted-error-bg)] border border-[var(--muted-error-border)] text-[var(--muted-error-text)] px-4 py-2 text-sm mb-4">
            {error}
          </div>
        )}
        {isEmpty && (
          <EmptyState
            isNoVICs
            tab={activeTab}
            onAddVIC={activeTab === "mine" ? openAdd : undefined}
            onImportCSV={activeTab === "mine" ? () => setImportModalOpen(true) : undefined}
          />
        )}
        {noResults && <EmptyState isNoVICs={false} onClearFilters={clearFilters} />}
        {!isEmpty && !noResults && (
          <>
            {effectiveViewMode === "list" ? (
              <VICListView
                vics={vics}
                isLoading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(by, order) => { setSortBy(by); setSortOrder(order); }}
                selectedVicIds={selectedVicIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onEdit={openEdit}
                onDelete={openDelete}
                canEdit={canEdit}
                canDelete={canDelete}
                viewLevel={viewLevel}
                showRequestFullAccess={activeTab === "agency"}
                onRequestFullAccess={() => {}}
              />
            ) : (
              <VICCardView
                vics={vics}
                isLoading={isLoading}
                onEdit={openEdit}
                onDelete={openDelete}
                onShare={() => {}}
                canEdit={canEdit}
                canDelete={canDelete}
                canShare={canShare}
                viewLevel={viewLevel}
                showRequestFullAccess={activeTab === "agency"}
                onRequestFullAccess={() => {}}
              />
            )}
            {totalCount > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm text-muted-foreground">
                <span className="order-2 sm:order-1">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
                </span>
                <div className="flex gap-2 order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex-1 sm:flex-none min-h-[36px] px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * PAGE_SIZE >= totalCount}
                    className="flex-1 sm:flex-none min-h-[36px] px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isAddEditModalOpen && (
        <AddEditVICModal
          vic={editingVic}
          onClose={closeAddEdit}
          onSaved={closeAddEdit}
        />
      )}
      <DeleteConfirmModal
        open={isDeleteModalOpen && deletingVic != null}
        vic={deletingVic}
        onClose={closeDelete}
        onConfirm={closeDelete}
      />
      <DestructiveConfirmDialog
        open={Boolean(bulkDeleteIds && bulkDeleteIds.length > 0)}
        onOpenChange={(o) => {
          if (!o && !bulkDeleteBusy) {
            setBulkDeleteIds(null);
            clearSelection();
          }
        }}
        title="Delete VICs"
        description={
          <>
            Delete{" "}
            <span className="font-medium text-foreground tabular-nums">{bulkDeleteIds?.length ?? 0}</span>{" "}
            selected VIC{(bulkDeleteIds?.length ?? 0) !== 1 ? "s" : ""}?
          </>
        }
        consequence="This will also remove their Acuity intelligence profiles."
        confirmLabel="Delete"
        loading={bulkDeleteBusy}
        onConfirm={async () => {
          if (!bulkDeleteIds) return;
          setBulkDeleteBusy(true);
          try {
            for (const id of bulkDeleteIds) {
              try {
                await deleteVIC(id);
              } catch {
                /* continue */
              }
            }
            setBulkDeleteIds(null);
            clearSelection();
            loadVics();
          } finally {
            setBulkDeleteBusy(false);
          }
        }}
      />
      {isImportModalOpen && (
        <ImportCSVModal
          onClose={() => { setImportModalOpen(false); loadVics(); }}
          onImported={() => { setImportModalOpen(false); loadVics(); }}
        />
      )}
      {isBulkAcuityModalOpen && selectedVicIds.size > 0 && (
        <AcuityProgressModal
          vicIds={Array.from(selectedVicIds)}
          onClose={() => { setBulkAcuityModalOpen(false); clearSelection(); loadVics(); }}
          onStart={async () => {
            try {
              await triggerAcuityBulk(Array.from(selectedVicIds));
              setVics((prev) => prev.map((v) => (selectedVicIds.has(getVICId(v)) ? { ...v, acuity_status: "running" as const } : v)));
            } catch (_) {}
          }}
        />
      )}
    </div>
  );
}
