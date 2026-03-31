"use client";

import { useState, useEffect, useCallback, useMemo, useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import type { Itinerary, ItineraryStatus, ItineraryListParams, PipelineStage } from "@/types/itinerary";
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
import { IS_PREVIEW_MODE } from "@/config/preview";
import DeleteItineraryModal from "./Modals/DeleteItineraryModal";
import {
  buildItinerariesSearchParams,
  mergeItinerariesListIntoUrl,
  parseItinerariesSearchParams,
} from "@/lib/itinerariesUrl";
import {
  DASHBOARD_LIST_PAGE_HEADER,
  DASHBOARD_LIST_PAGE_HEADER_SUBTITLE,
  DASHBOARD_LIST_PAGE_HEADER_TITLE,
  DASHBOARD_LIST_PAGE_HEADER_TITLE_STACK,
} from "@/lib/dashboardChrome";
import { PIPELINE_STAGE_LABEL_MAP, PIPELINE_STAGES } from "@/config/pipelineStages";
import { ITINERARY_STATUS_BADGES } from "./statusConfig";

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
  const pathname = usePathname();
  const showToast = useToast();
  const searchParams = useSearchParams();
  const tabFromUrl = (searchParams.get("tab") as "mine" | "agency") || "mine";
  const activeTab = tabFromUrl === "agency" ? "agency" : "mine";
  const createVicId = searchParams.get("vic_id") ?? undefined;
  const openCreateFromUrl = searchParams.get("create") === "1";
  const selectedItineraryId = searchParams.get("selected");

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ItineraryStatus | null>(null);
  const [destinationCountries, setDestinationCountries] = useState<string[]>([]);
  const [vicFilter, setVicFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "cards" | "board">("list");
  const [sortBy, setSortBy] = useState("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pipelineFilter, setPipelineFilter] = useState<PipelineStage | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState(false);

  const itinUrlHydratedRef = useRef(false);
  const itinUrlSyncedRef = useRef<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteItinerary, setDeleteItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    if (openCreateFromUrl) setCreateModalOpen(true);
  }, [openCreateFromUrl]);

  useEffect(() => {
    if (!selectedItineraryId) return;
    router.replace(`/dashboard/itineraries/${selectedItineraryId}`);
  }, [router, selectedItineraryId]);

  const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";
  const currentUser = user ? { id: user.id, role: user.role, agency_id: user.agency_id } : null;

  useLayoutEffect(() => {
    if (typeof window === "undefined" || itinUrlHydratedRef.current) return;
    itinUrlHydratedRef.current = true;
    const sp = new URLSearchParams(window.location.search);
    itinUrlSyncedRef.current = sp.toString();
    const p = parseItinerariesSearchParams(sp);
    setSearchQuery(p.q);
    setStatusFilter(p.status);
    setDestinationCountries(p.destinationCountries);
    setVicFilter(p.vic);
    setDateFrom(p.dateFrom);
    setDateTo(p.dateTo);
    setPipelineFilter(p.upcoming ? null : p.pipeline);
    setUpcomingTrips(p.upcoming);
    if (sp.has("sort_by")) setSortBy(p.sortBy);
    else {
      try {
        const s = localStorage.getItem(SORT_KEY);
        if (s) setSortBy(s);
      } catch (_) {}
    }
    if (sp.has("sort_order")) setSortOrder(p.sortOrder);
    else {
      try {
        const o = localStorage.getItem(SORT_ORDER_KEY) as "asc" | "desc" | null;
        if (o === "asc" || o === "desc") setSortOrder(o);
      } catch (_) {}
    }
    if (sp.has("view")) setViewMode(p.view);
    else {
      try {
        const v = localStorage.getItem(VIEW_KEY) as "list" | "cards" | "board" | null;
        if (v === "list" || v === "cards" || v === "board") setViewMode(v);
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (!itinUrlHydratedRef.current) return;
    const built = buildItinerariesSearchParams({
      tab: activeTab,
      q: searchQuery,
      status: statusFilter,
      destinationCountries,
      vic: vicFilter,
      dateFrom,
      dateTo,
      pipeline: pipelineFilter,
      upcoming: upcomingTrips,
      sortBy,
      sortOrder,
      view: viewMode,
    });
    const next = mergeItinerariesListIntoUrl(new URLSearchParams(searchParams.toString()), built);
    const qs = next.toString();
    if (qs === itinUrlSyncedRef.current) return;
    itinUrlSyncedRef.current = qs;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    activeTab,
    searchQuery,
    statusFilter,
    destinationCountries,
    vicFilter,
    dateFrom,
    dateTo,
    pipelineFilter,
    upcomingTrips,
    sortBy,
    sortOrder,
    viewMode,
    pathname,
    router,
    searchParams,
  ]);

  const loadItineraries = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    const params: ItineraryListParams = {
      tab: activeTab,
      agency_id: user?.agency_id != null ? String(user.agency_id) : undefined,
      search: searchQuery || undefined,
      status: statusFilter ?? undefined,
      vic_id: vicFilter ?? undefined,
      destination_countries: destinationCountries.length > 0 ? destinationCountries : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      pipeline_stage: upcomingTrips ? undefined : (pipelineFilter ?? undefined),
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
          destination_countries: params.destination_countries,
          date_from: params.date_from ?? undefined,
          date_to: params.date_to ?? undefined,
          pipeline_stages_in: upcomingTrips ? UPCOMING_PIPELINE_STAGES : undefined,
          pipeline_stage: upcomingTrips ? undefined : (pipelineFilter ?? undefined),
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
          destination_countries: params.destination_countries,
          date_from: params.date_from ?? undefined,
          date_to: params.date_to ?? undefined,
          pipeline_stages_in: upcomingTrips ? UPCOMING_PIPELINE_STAGES : undefined,
          pipeline_stage: upcomingTrips ? undefined : (pipelineFilter ?? undefined),
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
    destinationCountries,
    vicFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    pipelineFilter,
    upcomingTrips,
    isDev,
  ]);

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

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
    destinationCountries.length > 0 ||
    vicFilter != null ||
    dateFrom !== "" ||
    dateTo !== "" ||
    pipelineFilter != null ||
    upcomingTrips;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setDestinationCountries([]);
    setVicFilter(null);
    setDateFrom("");
    setDateTo("");
    setPipelineFilter(null);
    setUpcomingTrips(false);
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

  const stageCounts = useMemo(() => {
    const out: Partial<Record<PipelineStage, number>> = {};
    for (const s of PIPELINE_STAGES) out[s.key] = 0;
    for (const it of itinerariesForStageCounts) {
      const k = (it.pipeline_stage ?? "lead") as PipelineStage;
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }, [itinerariesForStageCounts]);

  const chipBtn =
    "flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[9px] text-muted-foreground transition-colors hover:bg-muted/45";

  const isEmpty = !isLoading && itineraries.length === 0 && !hasActiveFilters;
  const noResults = !isLoading && itineraries.length === 0 && hasActiveFilters;

  const canViewFinancials_ = canViewFinancials(currentUser);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-inset text-foreground">
      <header className={DASHBOARD_LIST_PAGE_HEADER}>
        <div className={DASHBOARD_LIST_PAGE_HEADER_TITLE_STACK}>
          <h1 className={DASHBOARD_LIST_PAGE_HEADER_TITLE}>Itineraries</h1>
          <p className={DASHBOARD_LIST_PAGE_HEADER_SUBTITLE}>
            {hasActiveFilters ? (
              <>
                <span>
                  {totalCount} {totalCount === 1 ? "itinerary" : "itineraries"}
                </span>
                {" · "}
                matching filters
              </>
            ) : (
              <span>
                {totalCount} {totalCount === 1 ? "itinerary" : "itineraries"}
              </span>
            )}
          </p>
        </div>
      </header>
      <ItineraryTabBar activeTab={activeTab} />
      <div className="relative z-10 shrink-0 px-6 pb-0 pt-4">
        <ItineraryToolbar
        activeTab={activeTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        destinationCountries={destinationCountries}
        onDestinationCountriesChange={setDestinationCountries}
        vicFilter={vicFilter}
        onVicChange={setVicFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        pipelineFilter={pipelineFilter}
        onPipelineFilterChange={setPipelineFilter}
        upcomingTrips={upcomingTrips}
        onUpcomingTripsChange={setUpcomingTrips}
        stageCounts={stageCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => {
          setSortBy(by);
          setSortOrder(order);
        }}
        onCreateItinerary={() => setCreateModalOpen(true)}
        resultTotal={totalCount}
        />
      </div>

      {(searchQuery.trim() ||
        statusFilter != null ||
        destinationCountries.length > 0 ||
        vicFilter != null ||
        dateFrom !== "" ||
        dateTo !== "" ||
        pipelineFilter != null ||
        upcomingTrips) && (
        <div className="mb-3 flex shrink-0 flex-wrap gap-1.5 px-6">
          {searchQuery.trim() ? (
            <button type="button" className={chipBtn} onClick={() => setSearchQuery("")} aria-label="Clear search">
              &quot;{searchQuery.trim().slice(0, 24)}
              {searchQuery.trim().length > 24 ? "…" : ""}&quot;
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {statusFilter ? (
            <button type="button" className={chipBtn} onClick={() => setStatusFilter(null)} aria-label="Clear status">
              {ITINERARY_STATUS_BADGES[statusFilter].label}
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {vicFilter ? (
            <button type="button" className={chipBtn} onClick={() => setVicFilter(null)} aria-label="Clear VIC filter">
              VIC
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {destinationCountries.length > 0 ? (
            <button
              type="button"
              className={chipBtn}
              onClick={() => setDestinationCountries([])}
              aria-label="Clear location filter"
            >
              Location: {destinationCountries.slice(0, 2).join(", ")}
              {destinationCountries.length > 2 ? ` +${destinationCountries.length - 2}` : ""}
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {dateFrom !== "" || dateTo !== "" ? (
            <button
              type="button"
              className={chipBtn}
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              aria-label="Clear trip date filter"
            >
              Dates
              {dateFrom ? ` · from ${dateFrom}` : ""}
              {dateTo ? ` · to ${dateTo}` : ""}
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {pipelineFilter ? (
            <button type="button" className={chipBtn} onClick={() => setPipelineFilter(null)} aria-label="Clear pipeline">
              {PIPELINE_STAGE_LABEL_MAP[pipelineFilter]}
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {upcomingTrips ? (
            <button type="button" className={chipBtn} onClick={() => setUpcomingTrips(false)} aria-label="Clear upcoming filter">
              Upcoming trips
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
        </div>
      )}

      {upcomingTrips && (
        <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.06)] px-3 py-2 text-xs text-brand-cta mx-6">
          <span>Showing upcoming trips: Committed, Preparing, Final Review, or Traveling.</span>
          <button type="button" onClick={() => setUpcomingTrips(false)} className="font-medium text-[#E8D5B5] hover:text-foreground">
            Clear
          </button>
        </div>
      )}

      {error && (
        <div className="shrink-0 px-4 py-2 text-sm text-[var(--muted-amber-text)] bg-[var(--muted-amber-bg)] border-b border-[var(--muted-amber-border)]">
          {error}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {(isEmpty || noResults) && (
          <div className="flex min-h-0 flex-1 flex-col overflow-auto px-4 pb-4 pt-0 md:px-6 md:pb-6">
            <ItinerariesEmptyState
              hasNoItineraries={isEmpty}
              tab={activeTab}
              onCreateItinerary={activeTab === "mine" ? () => setCreateModalOpen(true) : undefined}
              onClearFilters={noResults ? clearFilters : undefined}
            />
          </div>
        )}

        {!isEmpty && !noResults && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {viewMode === "board" && (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-0 md:px-6 md:pb-6">
                <ItineraryKanbanView itineraries={itineraries} />
              </div>
            )}
            {viewMode === "list" && (
            <div className="flex min-h-0 flex-1 overflow-auto px-4 pb-4 pt-0 md:px-6 md:pb-6">
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
            <div className="flex min-h-0 flex-1 overflow-auto px-4 pb-4 pt-0 md:px-6 md:pb-6">
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
          </div>
        )}
      </div>

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
