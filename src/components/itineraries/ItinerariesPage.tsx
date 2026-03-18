"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Itinerary, ItineraryStatus, ItineraryListParams, PipelineStage } from "@/types/itinerary";
import { PIPELINE_STAGES } from "@/config/pipelineStages";
import { fetchItineraryList, getItineraryId } from "@/lib/itineraries-api";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";
import { canEditItinerary, canDeleteItinerary, canViewFinancials } from "@/utils/itineraryPermissions";
import { FAKE_ITINERARIES, filterAndPaginateFakeItineraries } from "./fakeData";
import ItineraryTabBar from "./ItineraryTabBar";
import ItineraryToolbar from "./ItineraryToolbar";
import ItineraryListView from "./ItineraryListView";
import ItineraryCardView from "./ItineraryCardView";
import ItineraryKanbanView from "./ItineraryKanbanView";
import ItinerariesEmptyState from "./ItinerariesEmptyState";
import CreateItineraryModal from "./Modals/CreateItineraryModal";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";
import DeleteItineraryModal from "./Modals/DeleteItineraryModal";
import { cn } from "@/lib/utils";

const VIEW_KEY = "itinerary_view";
const SORT_KEY = "itinerary_sortBy";
const SORT_ORDER_KEY = "itinerary_sortOrder";
const PAGE_SIZE = 20;

const UPCOMING_PIPELINE_STAGES: PipelineStage[] = [
  "committed",
  "preparing",
  "final_review",
  "traveling",
];

export default function ItinerariesPage() {
  const { user } = useUser();
  const router = useRouter();
  const showToast = useToast();
  const searchParams = useSearchParams();
  const tabFromUrl = (searchParams.get("tab") as "mine" | "agency") || "mine";
  const activeTab = tabFromUrl === "agency" ? "agency" : "mine";
  const createVicId = searchParams.get("vic_id") ?? undefined;
  const openCreateFromUrl = searchParams.get("create") === "1";
  const upcomingTripsFromUrl = searchParams.get("filter") === "upcoming";

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ItineraryStatus | null>(null);
  const [destinationFilter, setDestinationFilter] = useState<string | null>(null);
  const [vicFilter, setVicFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "cards" | "board">("list");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pipelineFilter, setPipelineFilter] = useState<PipelineStage | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteItinerary, setDeleteItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    if (openCreateFromUrl) setCreateModalOpen(true);
  }, [openCreateFromUrl]);

  const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";
  const currentUser = user ? { id: user.id, role: user.role, agency_id: user.agency_id } : null;

  const clearUpcomingUrlParam = useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString());
    if (sp.get("filter") !== "upcoming") return;
    sp.delete("filter");
    const q = sp.toString();
    router.replace(`/dashboard/itineraries${q ? `?${q}` : ""}`);
  }, [router, searchParams]);

  const loadItineraries = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    const params: ItineraryListParams = {
      tab: activeTab,
      agency_id: user?.agency_id != null ? String(user.agency_id) : undefined,
      search: searchQuery || undefined,
      status: statusFilter ?? undefined,
      vic_id: vicFilter ?? undefined,
      destination: destinationFilter ?? undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      page: 1,
      limit: PAGE_SIZE,
    };
    try {
      const data = await fetchItineraryList(params);
      const apiEmpty = !data.itineraries?.length && (data.total ?? 0) === 0;
      if (IS_PREVIEW_MODE || apiEmpty) {
        const fake = filterAndPaginateFakeItineraries(FAKE_ITINERARIES, {
          tab: activeTab,
          userId: user?.id != null ? String(user.id) : undefined,
          agencyId: user?.agency_id != null ? String(user.agency_id) : undefined,
          search: params.search,
          status: params.status ?? undefined,
          vic_id: params.vic_id ?? undefined,
          destination: params.destination ?? undefined,
          date_from: params.date_from ?? undefined,
          date_to: params.date_to ?? undefined,
          pipeline_stage: pipelineFilter ?? undefined,
          sortBy,
          sortOrder,
          page: 1,
          limit: PAGE_SIZE,
        });
        setItineraries(fake.itineraries);
        setTotalCount(fake.total);
      } else {
        setItineraries(data.itineraries ?? []);
        setTotalCount(data.total ?? 0);
      }
    } catch (e) {
      const fake = filterAndPaginateFakeItineraries(FAKE_ITINERARIES, {
        tab: activeTab,
        userId: user?.id != null ? String(user.id) : undefined,
        agencyId: user?.agency_id != null ? String(user.agency_id) : undefined,
        search: params.search,
        status: params.status ?? undefined,
        vic_id: params.vic_id ?? undefined,
        destination: params.destination ?? undefined,
        date_from: params.date_from ?? undefined,
        date_to: params.date_to ?? undefined,
        pipeline_stages_in: upcomingTripsFromUrl ? UPCOMING_PIPELINE_STAGES : undefined,
        pipeline_stage: upcomingTripsFromUrl ? undefined : (pipelineFilter ?? undefined),
        sortBy,
        sortOrder,
        page: 1,
        limit: PAGE_SIZE,
      });
      setItineraries(fake.itineraries);
      setTotalCount(fake.total);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    user?.id,
    user?.agency_id,
    searchQuery,
    statusFilter,
    destinationFilter,
    vicFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    pipelineFilter,
    upcomingTripsFromUrl,
    isDev,
  ]);

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = localStorage.getItem(VIEW_KEY) as "list" | "cards" | "board" | null;
    if (v === "list" || v === "cards" || v === "board") setViewMode(v);
    const s = localStorage.getItem(SORT_KEY);
    const o = localStorage.getItem(SORT_ORDER_KEY) as "asc" | "desc" | null;
    if (s) setSortBy(s);
    if (o === "asc" || o === "desc") setSortOrder(o);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, viewMode);
      localStorage.setItem(SORT_KEY, sortBy);
      localStorage.setItem(SORT_ORDER_KEY, sortOrder);
    } catch (_) {}
  }, [viewMode, sortBy, sortOrder]);

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter != null ||
    destinationFilter != null ||
    vicFilter != null ||
    dateFrom !== "" ||
    dateTo !== "" ||
    pipelineFilter != null ||
    upcomingTripsFromUrl;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setDestinationFilter(null);
    setVicFilter(null);
    setDateFrom("");
    setDateTo("");
    setPipelineFilter(null);
    clearUpcomingUrlParam();
  };

  const itinerariesForStageCounts = useMemo(() => {
    return filterAndPaginateFakeItineraries(FAKE_ITINERARIES, {
      tab: activeTab,
      userId: user?.id != null ? String(user.id) : undefined,
      agencyId: user?.agency_id != null ? String(user.agency_id) : undefined,
      page: 1,
      limit: 500,
      sortBy: "updated_at",
      sortOrder: "desc",
    }).itineraries;
  }, [activeTab, user?.id, user?.agency_id]);

  const isEmpty = !isLoading && itineraries.length === 0 && !hasActiveFilters;
  const noResults = !isLoading && itineraries.length === 0 && hasActiveFilters;

  const canViewFinancials_ = canViewFinancials(currentUser);

  return (
    <div className="h-full flex flex-col bg-[#0C0C0C] overflow-hidden">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Itineraries" variant="full" dismissible sampleDataOnly />}
      <ItineraryTabBar activeTab={activeTab} />
      <ItineraryToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        destinationFilter={destinationFilter}
        onDestinationChange={setDestinationFilter}
        vicFilter={vicFilter}
        onVicChange={setVicFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => {
          setSortBy(by);
          setSortOrder(order);
        }}
        onCreateItinerary={() => setCreateModalOpen(true)}
        onClearFilters={clearFilters}
      />

      {upcomingTripsFromUrl && (
        <div className="px-4 py-2 text-xs bg-emerald-500/10 text-emerald-200/90 border-b border-emerald-500/15 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span>
            Showing upcoming trips: Committed, Preparing, Final Review, or Traveling.
          </span>
          <button
            type="button"
            onClick={clearUpcomingUrlParam}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {error && (
        <div className="px-4 py-2 text-sm text-[var(--muted-amber-text)] bg-[var(--muted-amber-bg)] border-b border-[var(--muted-amber-border)]">
          {error}
        </div>
      )}

      {(isEmpty || noResults) && (
        <ItinerariesEmptyState
          hasNoItineraries={isEmpty}
          tab={activeTab}
          onCreateItinerary={activeTab === "mine" ? () => setCreateModalOpen(true) : undefined}
          onClearFilters={noResults ? clearFilters : undefined}
        />
      )}

      {!isEmpty && !noResults && (
        <>
          <div className="flex items-center gap-2 px-4 mb-2 overflow-x-auto pb-1 shrink-0 border-b border-white/[0.04]">
            <button
              type="button"
              onClick={() => {
                setPipelineFilter(null);
                clearUpcomingUrlParam();
              }}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                !pipelineFilter && !upcomingTripsFromUrl
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-gray-500 hover:text-gray-400"
              )}
            >
              All
            </button>
            {PIPELINE_STAGES.filter((s) => s.key !== "archived").map((stage) => (
              <button
                key={stage.key}
                type="button"
                onClick={() => {
                  setPipelineFilter(stage.key);
                  clearUpcomingUrlParam();
                }}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                  pipelineFilter === stage.key
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-gray-500 hover:text-gray-400"
                )}
              >
                {stage.label}
                <span className="ml-1 text-gray-600">
                  {itinerariesForStageCounts.filter((i) => (i.pipeline_stage ?? "lead") === stage.key).length}
                </span>
              </button>
            ))}
          </div>
          {viewMode === "board" && (
            <ItineraryKanbanView itineraries={itineraries} />
          )}
          {viewMode === "list" && (
            <div className="flex-1 overflow-auto">
              <ItineraryListView
                itineraries={itineraries}
                isLoading={isLoading}
                onEdit={(it) => router.push(`/dashboard/itineraries/${getItineraryId(it)}`)}
                onDelete={(it) => setDeleteItinerary(it)}
                onDuplicate={async (it) => {
                  try {
                    const { duplicateItinerary } = await import("@/lib/itineraries-api");
                    const dup = await duplicateItinerary(getItineraryId(it));
                    setItineraries((prev) => [dup, ...prev]);
                  } catch (_) {
                    if (isDev) {
                      const dup = {
                        ...it,
                        id: `fake-it-dup-${Date.now()}`,
                        trip_name: `${it.trip_name} (copy)`,
                        pipeline_stage: it.pipeline_stage ?? "lead",
                        pipeline_history: [...(it.pipeline_history ?? [])],
                      };
                      setItineraries((prev) => [dup, ...prev]);
                    }
                  }
                }}
                canEdit={(it) => canEditItinerary(currentUser, it)}
                canDelete={(it) => canDeleteItinerary(currentUser, it)}
                canViewFinancials={canViewFinancials_}
              />
            </div>
          )}
          {viewMode === "cards" && (
            <div className="flex-1 overflow-auto">
              <ItineraryCardView
                itineraries={itineraries}
                isLoading={isLoading}
                onEdit={(it) => router.push(`/dashboard/itineraries/${getItineraryId(it)}`)}
                onDelete={(it) => setDeleteItinerary(it)}
                onDuplicate={async (it) => {
                  try {
                    const { duplicateItinerary } = await import("@/lib/itineraries-api");
                    const dup = await duplicateItinerary(getItineraryId(it));
                    setItineraries((prev) => [dup, ...prev]);
                  } catch (_) {
                    if (isDev) {
                      const dup = {
                        ...it,
                        id: `fake-it-dup-${Date.now()}`,
                        trip_name: `${it.trip_name} (copy)`,
                        pipeline_stage: it.pipeline_stage ?? "lead",
                        pipeline_history: [...(it.pipeline_history ?? [])],
                      };
                      setItineraries((prev) => [dup, ...prev]);
                    }
                  }
                }}
                canEdit={(it) => canEditItinerary(currentUser, it)}
                canDelete={(it) => canDeleteItinerary(currentUser, it)}
                canViewFinancials={canViewFinancials_}
              />
            </div>
          )}
        </>
      )}

      <CreateItineraryModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        prefillVicId={createVicId}
        onCreated={(it) => {
          setCreateModalOpen(false);
          setItineraries((prev) => [it, ...prev]);
          setTotalCount((c) => c + 1);
          showToast("Itinerary created");
          router.push(`/dashboard/itineraries/${getItineraryId(it)}`);
        }}
      />
      <DeleteItineraryModal
        open={!!deleteItinerary}
        onClose={() => setDeleteItinerary(null)}
        itinerary={deleteItinerary}
        onDeleted={() => {
          if (deleteItinerary) setItineraries((prev) => prev.filter((i) => getItineraryId(i) !== getItineraryId(deleteItinerary)));
          setDeleteItinerary(null);
          showToast("Itinerary deleted");
        }}
      />
    </div>
  );
}
