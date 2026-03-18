"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Itinerary, ItineraryStatus, ItineraryListParams } from "@/types/itinerary";
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

const VIEW_KEY = "itinerary_view";
const SORT_KEY = "itinerary_sortBy";
const SORT_ORDER_KEY = "itinerary_sortOrder";
const PAGE_SIZE = 20;

export default function ItinerariesPage() {
  const { user } = useUser();
  const router = useRouter();
  const showToast = useToast();
  const searchParams = useSearchParams();
  const tabFromUrl = (searchParams.get("tab") as "mine" | "agency") || "mine";
  const activeTab = tabFromUrl === "agency" ? "agency" : "mine";
  const createVicId = searchParams.get("vic_id") ?? undefined;
  const openCreateFromUrl = searchParams.get("create") === "1";

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

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteItinerary, setDeleteItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    if (openCreateFromUrl) setCreateModalOpen(true);
  }, [openCreateFromUrl]);

  const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";
  const currentUser = user ? { id: user.id, role: user.role, agency_id: user.agency_id } : null;

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
    dateTo !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setDestinationFilter(null);
    setVicFilter(null);
    setDateFrom("");
    setDateTo("");
  };

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
                      const dup = { ...it, id: `fake-it-dup-${Date.now()}`, trip_name: `${it.trip_name} (copy)` };
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
                      const dup = { ...it, id: `fake-it-dup-${Date.now()}`, trip_name: `${it.trip_name} (copy)` };
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
