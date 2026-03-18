"use client";

import { useState, useEffect, useMemo, useRef, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Copy,
  Share2,
  MoreHorizontal,
  Globe,
  Plus,
  UserPlus,
  Phone,
  FileText,
  RefreshCw,
  CheckCircle,
  ClipboardList,
  Eye,
  Plane,
  Heart,
  Archive,
  Mail,
} from "lucide-react";
import type { Itinerary, ItineraryDay, ItineraryEvent, PipelineStage, PipelineEvent } from "@/types/itinerary";
import { fetchItinerary } from "@/lib/itineraries-api";
import { FAKE_ITINERARIES } from "../fakeData";
import { PIPELINE_STAGES } from "@/config/pipelineStages";
import { getEmailTemplatesForPipelineStage } from "@/components/knowledge-vault/knowledgeVaultMockData";
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
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import EventDetailPanel from "./EventDetailPanel";
import ClientProposalModal from "./ClientProposalModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PublishItineraryModal,
  CompareOptionsModal,
  GuestPortalPreviewModal,
  InvoiceModal,
  ImportItineraryModal,
  DestinationGuideModal,
  ActivitySuggestModal,
} from "../CompetitorFeatureModals";

type Props = { itineraryId: string };

const PIPELINE_ICONS: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  UserPlus,
  Phone,
  FileText,
  RefreshCw,
  CheckCircle,
  ClipboardList,
  Eye,
  Plane,
  Heart,
  Archive,
};

function withPipelineDefaults(it: Itinerary): Itinerary {
  return {
    ...it,
    pipeline_stage: it.pipeline_stage ?? "lead",
    pipeline_history: it.pipeline_history ?? [],
  };
}

function daysAgoShort(iso?: string): string {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

export default function ItineraryDetailPage({ itineraryId }: Props) {
  const router = useRouter();
  const { user } = useUser();
  const showToast = useToast();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [guestPortalOpen, setGuestPortalOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{ day: ItineraryDay; event: ItineraryEvent } | null>(null);
  const [editEvent, setEditEvent] = useState<{ day: ItineraryDay; event: ItineraryEvent } | null>(null);
  const [optionIndex, setOptionIndex] = useState(0);
  const [pipelineTarget, setPipelineTarget] = useState<PipelineStage | null>(null);
  const [pipelineNote, setPipelineNote] = useState("");
  const pipelinePopoverRef = useRef<HTMLDivElement>(null);
  const [publishLocal, setPublishLocal] = useState<{
    state: "published_clean" | "unpublished_changes" | "never";
    version: number;
    at: string;
  } | null>(null);

  const load = async () => {
    if (!itineraryId) {
      setLoading(false);
      setError("Itinerary not found");
      setItinerary(null);
      return;
    }
    setLoading(true);
    setError(null);
    const useFakeFirst =
      (typeof process !== "undefined" && process.env.NODE_ENV === "development") || IS_PREVIEW_MODE;
    if (useFakeFirst) {
      const fake = FAKE_ITINERARIES.find((i) => i.id === itineraryId);
      if (fake) {
        setItinerary(withPipelineDefaults(fake));
        setLoading(false);
        return;
      }
    }
    try {
      const it = await fetchItinerary(itineraryId);
      setItinerary(withPipelineDefaults(it));
    } catch (err) {
      if (useFakeFirst) {
        const fake = FAKE_ITINERARIES.find((i) => i.id === itineraryId);
        if (fake) {
          setItinerary(withPipelineDefaults(fake));
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

  useEffect(() => {
    if (pipelineTarget == null) return;
    const onDown = (e: MouseEvent) => {
      if (pipelinePopoverRef.current && !pipelinePopoverRef.current.contains(e.target as Node)) {
        setPipelineTarget(null);
        setPipelineNote("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pipelineTarget]);

  const currentUser = user ? { id: user.id, role: user.role, agency_id: user.agency_id } : null;
  const canEdit = itinerary ? canEditItinerary(currentUser, itinerary) : false;
  const canDelete = itinerary ? canDeleteItinerary(currentUser, itinerary) : false;
  const canViewFinancials_ = canViewFinancials(currentUser);
  const statusBadge = itinerary ? ITINERARY_STATUS_BADGES[itinerary.status] : null;

  const tripOpts = itinerary?.trip_options ?? [];
  const hasMultiOption =
    (itinerary?.status === "draft" || itinerary?.status === "proposed") && tripOpts.length > 0;

  const displayItinerary = useMemo(() => {
    if (!itinerary) return null;
    if (!hasMultiOption || optionIndex === 0) return itinerary;
    const opt = tripOpts[optionIndex - 1];
    if (!opt) return itinerary;
    return {
      ...itinerary,
      days: opt.days,
      total_client_price: opt.total_client_price ?? itinerary.total_client_price,
    };
  }, [itinerary, hasMultiOption, optionIndex, tripOpts]);

  const effPublish = publishLocal ?? {
    state: (itinerary?.publish_state ?? "never") as "never" | "published_clean" | "unpublished_changes",
    version: itinerary?.published_version ?? 0,
    at: itinerary?.last_published_at ?? "",
  };

  const nextPublishVersion = Math.max(1, effPublish.version + (effPublish.state === "never" ? 0 : 1));

  const handlePublishConfirm = () => {
    const v = effPublish.state === "never" ? 1 : effPublish.version + 1;
    setPublishLocal({
      state: "published_clean",
      version: v,
      at: new Date().toISOString(),
    });
    setPublishModalOpen(false);
    showToast(`Published v${v} — Client view updated`);
  };

  const openPublishFlow = () => {
    if (effPublish.state === "published_clean" && !publishLocal && itinerary?.publish_state === "published_clean") {
      showToast("Client view is up to date");
      return;
    }
    setPublishModalOpen(true);
  };

  const publishBtnClass =
    effPublish.state === "unpublished_changes" || itinerary?.publish_state === "unpublished_changes"
      ? "bg-amber-500 text-white hover:bg-amber-600"
      : effPublish.state === "never" || (!effPublish.version && itinerary?.publish_state === "never")
        ? "bg-emerald-600 text-white hover:bg-emerald-700"
        : "bg-gray-700 text-gray-400 hover:bg-gray-600";

  const isMonaco = itinerary?.id === "fake-it-1";

  const relevantTemplates = useMemo(
    () => (itinerary ? getEmailTemplatesForPipelineStage(itinerary.pipeline_stage) : []),
    [itinerary?.pipeline_stage]
  );

  const confirmPipelineMove = () => {
    if (!itinerary || !pipelineTarget || pipelineTarget === itinerary.pipeline_stage) return;
    const from = itinerary.pipeline_stage;
    const to = pipelineTarget;
    const evt: PipelineEvent = {
      from_stage: from,
      to_stage: to,
      changed_at: new Date().toISOString(),
      changed_by: user?.username ?? user?.email?.split("@")[0] ?? "Advisor",
      note: pipelineNote.trim() || undefined,
    };
    setItinerary({
      ...itinerary,
      pipeline_stage: to,
      pipeline_history: [...(itinerary.pipeline_history ?? []), evt],
    });
    const label = PIPELINE_STAGES.find((s) => s.key === to)?.label ?? to;
    showToast(`Moved to ${label}`);
    setPipelineTarget(null);
    setPipelineNote("");
  };

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

  if (error || !itinerary || !displayItinerary) {
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
      <div className="shrink-0 flex flex-col">
        <div className="px-4 pt-3">
          <Button variant="ghost" size="sm" asChild className="text-[rgba(245,245,245,0.7)] hover:text-[#F5F5F5]">
            <Link href="/dashboard/itineraries" className="inline-flex items-center gap-1">
              <ArrowLeft size={18} /> Back to Itineraries
            </Link>
          </Button>
        </div>
        <div className="relative h-[200px] w-full overflow-hidden bg-zinc-900">
          <ImageWithFallback
            fallbackType="trip"
            src={itinerary.hero_image_url}
            alt={itinerary.trip_name}
            className="w-full h-full object-cover opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h1 className="text-xl font-semibold text-white drop-shadow-sm">{itinerary.trip_name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={cn("text-xs px-1.5 py-0.5 rounded border", statusBadge?.className ?? "bg-white/10 border-white/20")}>
                {statusBadge?.label ?? itinerary.status}
              </span>
              {effPublish.state === "published_clean" && effPublish.version > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Published · v{effPublish.version} · {daysAgoShort(effPublish.at)}
                </span>
              )}
              {effPublish.state === "unpublished_changes" && (
                <span className="flex items-center gap-1.5 text-xs text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Unpublished changes
                </span>
              )}
              {(effPublish.state === "never" || effPublish.version === 0) && itinerary.publish_state !== "published_clean" && publishLocal?.state !== "published_clean" && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                  Not yet published
                </span>
              )}
              <span className="text-sm text-white/90">{formatDateRange(itinerary.trip_start_date, itinerary.trip_end_date)}</span>
              <span className="text-sm text-white/80">·</span>
              <Link href={`/dashboard/vics/${itinerary.primary_vic_id}`} className="text-sm text-white/90 hover:text-white hover:underline">
                {itinerary.primary_vic_name ?? itinerary.primary_vic_id}
              </Link>
            </div>
          </div>
        </div>
      </div>
      <header className="shrink-0 border-b border-[rgba(255,255,255,0.08)] px-4 py-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <Button variant="outline" size="sm" asChild className="border-white/10 text-[#F5F5F5]">
              <Link href={`/dashboard/itineraries/${itineraryId}/edit`}>
                <Pencil size={14} className="mr-1" /> Edit
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            className="bg-white text-gray-900 hover:bg-gray-100 rounded-lg px-4 py-2 font-medium"
            onClick={() => setShareModalOpen(true)}
          >
            <Share2 size={14} className="mr-1" /> Share with Client
          </Button>
          <Button size="sm" variant="outline" className="border-white/10 text-[#F5F5F5]" onClick={() => setGuestPortalOpen(true)}>
            <Globe size={14} className="mr-1" /> Guest Portal
          </Button>
          <StatusChangeDropdown
            itinerary={itinerary}
            onStatusChange={(newStatus) => {
              if (newStatus) setItinerary((prev) => (prev ? { ...prev, status: newStatus } : null));
              else load();
            }}
          />
          <Button size="sm" className={publishBtnClass} onClick={openPublishFlow}>
            Publish
          </Button>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/10 text-[#F5F5F5] px-2">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
              <DropdownMenuItem onClick={() => setInvoiceOpen(true)}>Generate Invoice</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canDelete && (
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(true)} className="border-white/10 text-red-400">
              <Trash2 size={14} className="mr-1" /> Delete
            </Button>
          )}
        </div>
      </header>

      <div className="shrink-0 px-4 py-3 border-b border-white/[0.06] relative bg-[#0C0C0C]">
        <div className="w-full overflow-x-auto mb-2">
          <div className="flex items-center min-w-max px-1">
            {PIPELINE_STAGES.map((stage, i) => {
              const currentIdx = PIPELINE_STAGES.findIndex((s) => s.key === itinerary.pipeline_stage);
              const isCurrent = itinerary.pipeline_stage === stage.key;
              const isPast = currentIdx > i;
              const Icon = PIPELINE_ICONS[stage.icon] ?? UserPlus;
              return (
                <Fragment key={stage.key}>
                  {i > 0 && (
                    <div
                      className={cn("h-[1px] w-6 mx-1 shrink-0", isPast ? "bg-emerald-500/40" : "bg-white/[0.06]")}
                    />
                  )}
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      if (stage.key === itinerary.pipeline_stage) return;
                      setPipelineTarget(stage.key);
                      setPipelineNote("");
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0",
                      isCurrent
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                        : isPast
                          ? "bg-white/5 text-gray-400 border border-white/10"
                          : "bg-white/[0.02] text-gray-600 border border-white/5 hover:border-white/10"
                    )}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    {stage.label}
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>
        {pipelineTarget != null && (
          <div
            ref={pipelinePopoverRef}
            className="absolute left-4 top-[calc(100%-4px)] z-50 bg-gray-900 border border-white/10 rounded-xl p-3 shadow-xl w-64"
          >
            <p className="text-xs text-gray-400 mb-2">
              Move to{" "}
              <span className="text-white font-medium">
                {PIPELINE_STAGES.find((s) => s.key === pipelineTarget)?.label}
              </span>
              ?
            </p>
            <textarea
              value={pipelineNote}
              onChange={(e) => setPipelineNote(e.target.value)}
              placeholder="Add a note (optional)..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-gray-300 placeholder:text-gray-600 resize-none mb-2"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="text-xs text-gray-500 hover:text-gray-400"
                onClick={() => {
                  setPipelineTarget(null);
                  setPipelineNote("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                onClick={confirmPipelineMove}
              >
                Confirm
              </button>
            </div>
          </div>
        )}
        {relevantTemplates.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Mail className="w-3 h-3 text-rose-400/50 shrink-0" />
            <span className="text-[10px] text-gray-500">Templates for this stage:</span>
            {relevantTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => showToast(`Opening "${t.title}" — coming in v2`)}
                className="text-[10px] text-rose-400/70 hover:text-rose-400 underline decoration-rose-400/20 hover:decoration-rose-400/40"
              >
                {t.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasMultiOption && (
        <div className="shrink-0 px-4 py-2 border-b border-white/[0.06] flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOptionIndex(0)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              optionIndex === 0 ? "bg-white/10 text-[#F5F5F5]" : "text-gray-500 hover:text-gray-300"
            )}
          >
            Option 1 — Classic Tuscany (current)
          </button>
          {tripOpts.map((opt, i) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setOptionIndex(i + 1)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                optionIndex === i + 1 ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Option {i + 2} — {opt.name}
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500"
            onClick={() => showToast("Option creation — coming soon")}
          >
            <Plus size={14} className="mr-1" /> Add Option
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 ml-auto" onClick={() => setCompareOpen(true)}>
            Compare Options
          </Button>
        </div>
      )}

      <div className="flex-1 flex min-h-0 flex-col max-md:flex-col md:flex-row">
        <main className="flex-1 overflow-auto min-w-0 order-first">
          <ItineraryTimeline
            itinerary={displayItinerary}
            canEdit={canEdit}
            canViewFinancials={canViewFinancials_}
            onEventChange={() => load()}
            onEventSelect={(day, ev) => setSelectedEvent({ day, event: ev })}
            editEvent={editEvent}
            onEditEventClose={() => setEditEvent(null)}
            onEditEventRequest={(day, ev) => setEditEvent({ day, event: ev })}
          />
        </main>
        <ItineraryDetailSidebar
          itinerary={itinerary}
          financialItinerary={displayItinerary}
          canViewFinancials={canViewFinancials_}
          onAIImport={() => setImportOpen(true)}
          onAIGuide={() => setGuideOpen(true)}
          onAISuggest={() => setSuggestOpen(true)}
        />
        {selectedEvent && (
          <EventDetailPanel
            event={selectedEvent.event}
            day={selectedEvent.day}
            itineraryId={itinerary.id}
            allDays={displayItinerary.days ?? []}
            onClose={() => setSelectedEvent(null)}
            onEdit={() => {
              setEditEvent({ day: selectedEvent.day, event: selectedEvent.event });
              setSelectedEvent(null);
            }}
            onRemove={() => {
              load();
              setSelectedEvent(null);
            }}
          />
        )}
      </div>

      <DeleteItineraryModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        itinerary={itinerary}
        onDeleted={() => router.push("/dashboard/itineraries")}
      />

      <ClientProposalModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} itinerary={itinerary} />

      <PublishItineraryModal
        open={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        itinerary={{
          ...itinerary,
          published_version: effPublish.version,
          last_published_at: effPublish.at,
          publish_state: effPublish.state,
        }}
        nextVersion={effPublish.state === "never" ? 1 : effPublish.version + 1}
        onPublish={handlePublishConfirm}
      />

      {tripOpts[0] && (
        <CompareOptionsModal
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          classicLabel="Classic Tuscany"
          luxuryOption={tripOpts[0]}
          onToast={showToast}
        />
      )}

      <GuestPortalPreviewModal
        open={guestPortalOpen}
        onClose={() => setGuestPortalOpen(false)}
        itinerary={itinerary}
        isMonaco={isMonaco}
      />

      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        itinerary={itinerary}
        onGenerate={() => {
          showToast("Invoice generated (mock) — PDF export coming in v2.");
          setInvoiceOpen(false);
        }}
      />

      <ImportItineraryModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onParse={() => showToast("AI Import — launching in v2. Events will appear here automatically.")}
      />

      <DestinationGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        vicName={itinerary.primary_vic_name ?? ""}
        dest={(itinerary.destinations ?? [])[0] ?? "Monaco"}
        dates={formatDateRange(itinerary.trip_start_date, itinerary.trip_end_date)}
        onGenerate={() => {
          showToast("Destination Guides — launching in v2.");
          setGuideOpen(false);
        }}
      />

      <ActivitySuggestModal
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        vicName={itinerary.primary_vic_name ?? "Client"}
        onAdd={() => showToast("Activity added (mock)")}
      />
    </div>
  );
}
