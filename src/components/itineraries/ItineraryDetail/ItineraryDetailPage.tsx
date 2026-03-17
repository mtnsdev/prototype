"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Copy } from "lucide-react";
import type { Itinerary, ItineraryStatus } from "@/types/itinerary";
import { fetchItinerary } from "@/lib/itineraries-api";
import { FAKE_ITINERARIES } from "../fakeData";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";
import { canEditItinerary, canDeleteItinerary, canViewFinancials } from "@/utils/itineraryPermissions";
import { ITINERARY_STATUS_BADGES, formatDateRange } from "../statusConfig";
import { Button } from "@/components/ui/button";
import ItineraryDetailSidebar from "./ItineraryDetailSidebar";
import ItineraryTimeline from "./ItineraryTimeline";
import DeleteItineraryModal from "../Modals/DeleteItineraryModal";
import StatusChangeDropdown from "./StatusChangeDropdown";
import { cn } from "@/lib/utils";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";

type Props = { itineraryId: string };

export default function ItineraryDetailPage({ itineraryId }: Props) {
  const router = useRouter();
  const { user } = useUser();
  const showToast = useToast();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const load = async () => {
    if (!itineraryId) {
      setLoading(false);
      setError("Itinerary not found");
      setItinerary(null);
      return;
    }
    setLoading(true);
    setError(null);
    if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
      const fake = FAKE_ITINERARIES.find((i) => i.id === itineraryId);
      if (fake) {
        setItinerary(fake);
        setLoading(false);
        return;
      }
    }
    try {
      const it = await fetchItinerary(itineraryId);
      setItinerary(it);
    } catch (err) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        const fake = FAKE_ITINERARIES.find((i) => i.id === itineraryId);
        if (fake) {
          setItinerary(fake);
          setLoading(false);
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Failed to load");
      setItinerary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [itineraryId]);

  const currentUser = user ? { id: user.id, role: user.role, agency_id: user.agency_id } : null;
  const canEdit = itinerary ? canEditItinerary(currentUser, itinerary) : false;
  const canDelete = itinerary ? canDeleteItinerary(currentUser, itinerary) : false;
  const canViewFinancials_ = canViewFinancials(currentUser);
  const statusBadge = itinerary ? ITINERARY_STATUS_BADGES[itinerary.status] : null;

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-[#0C0C0C] overflow-hidden">
        <div className="shrink-0 h-10 px-4 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-white/10 animate-pulse" />
          <div className="h-5 w-48 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex-1 flex p-6 gap-6">
          <div className="flex-1 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
          <div className="w-72 space-y-3">
            <div className="h-32 rounded-lg bg-white/5 animate-pulse" />
            <div className="h-24 rounded-lg bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="p-6">
        <p className="text-red-400">{error ?? "Itinerary not found"}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/itineraries")} className="mt-4">
          Back to itineraries
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0C0C0C] overflow-hidden">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Itinerary" variant="compact" sampleDataOnly />}
      <header className="shrink-0 border-b border-[rgba(255,255,255,0.08)] p-4 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="shrink-0 text-[rgba(245,245,245,0.7)] hover:text-[#F5F5F5]">
          <Link href="/dashboard/itineraries" className="inline-flex items-center gap-1">
            <ArrowLeft size={18} /> Back to Itineraries
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-[#F5F5F5] truncate">{itinerary.trip_name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded border",
                statusBadge?.className ?? "bg-white/10 border-white/20"
              )}
            >
              {statusBadge?.label ?? itinerary.status}
            </span>
            {(itinerary.destinations ?? []).length > 0 && (
              <>
                {(itinerary.destinations ?? []).map((d) => (
                  <span key={d} className="text-xs px-2 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.8)]">
                    {d}
                  </span>
                ))}
              </>
            )}
            <span className="text-xs text-[rgba(245,245,245,0.5)]">
              {formatDateRange(itinerary.trip_start_date, itinerary.trip_end_date)}
            </span>
            <Link
              href={`/dashboard/vics/${itinerary.primary_vic_id}`}
              className="text-xs text-[rgba(245,245,245,0.7)] hover:text-[#F5F5F5] hover:underline"
            >
              {itinerary.primary_vic_name ?? itinerary.primary_vic_id}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" asChild className="border-white/10 text-[#F5F5F5]">
              <Link href={`/dashboard/itineraries/${itineraryId}/edit`}>
                <Pencil size={14} className="mr-1" /> Edit
              </Link>
            </Button>
          )}
          <StatusChangeDropdown
            itinerary={itinerary}
            onStatusChange={(newStatus) => {
              if (newStatus) setItinerary((prev) => (prev ? { ...prev, status: newStatus } : null));
              else load();
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-[#F5F5F5]"
            onClick={async () => {
              try {
                const { duplicateItinerary } = await import("@/lib/itineraries-api");
                const dup = await duplicateItinerary(itineraryId);
                showToast("Itinerary duplicated");
                router.push(`/dashboard/itineraries/${dup.id}`);
              } catch (_) {
                router.push("/dashboard/itineraries");
              }
            }}
          >
            <Copy size={14} className="mr-1" /> Duplicate
          </Button>
          {canDelete && (
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(true)} className="border-white/10 text-red-400">
              <Trash2 size={14} className="mr-1" /> Delete
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex min-h-0 flex-col max-md:flex-col md:flex-row">
        <main className="flex-1 overflow-auto min-w-0 order-first">
          <ItineraryTimeline
            itinerary={itinerary}
            canEdit={canEdit}
            canViewFinancials={canViewFinancials_}
            onEventChange={() => load()}
          />
        </main>
        <ItineraryDetailSidebar itinerary={itinerary} canViewFinancials={canViewFinancials_} />
      </div>

      <DeleteItineraryModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        itinerary={itinerary}
        onDeleted={() => router.push("/dashboard/itineraries")}
      />
    </div>
  );
}
