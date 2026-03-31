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
import { IS_PREVIEW_MODE } from "@/config/preview";
import EventDetailPanel from "./EventDetailPanel";
import VICProposalModal from "./VICProposalModal";
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
      total_vic_price: opt.total_vic_price ?? itinerary.total_vic_price,
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
    showToast(`Published v${v} — VIC view updated`);
  };

  const openPublishFlow = () => {
    if (effPublish.state === "published_clean" && !publishLocal && itinerary?.publish_state === "published_clean") {
      showToast("VIC view is up to date");
      return;
    }
    setPublishModalOpen(true);
  };

  const publishBtnClass =
    effPublish.state === "unpublished_changes" || itinerary?.publish_state === "unpublished_changes"
      ? "border border-[var(--muted-amber-border)] bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] hover:bg-[var(--muted-amber-bg)]/80"
      : effPublish.state === "never" || (!effPublish.version && itinerary?.publish_state === "never")
        ? "bg-brand-cta text-brand-cta-foreground hover:bg-brand-cta-hover"
        : "bg-muted-foreground/15 text-muted-foreground hover:bg-muted-foreground/20";

  const isMonaco = itinerary?.id === "itin-001";

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
      <div className="h-full flex flex-col bg-inset overflow-hidden">
        <div className="shrink-0 h-10 px-4 border-b border-border flex items-center gap-3">
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
        <p className="text-[var(--muted-error-text)]">{error ?? "Itinerary not found"}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/itineraries")} className="mt-4">
          Back to itineraries
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-inset overflow-hidden">
      <div className="shrink-0 flex flex-col">
        <div className="px-4 pt-3">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/dashboard/itineraries" className="inline-flex items-center gap-1">
              <ArrowLeft size={18} /> Back to Itineraries
            </Link>
          </Button>
        </div>
        <div className="w-full border-b border-border bg-card/50 px-4 py-5">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{itinerary.trip_name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={cn("text-xs px-1.5 py-0.5 rounded-md border", statusBadge?.className ?? "bg-muted-foreground/10 border-border text-muted-foreground")}>
              {statusBadge?.label ?? itinerary.status}
            </span>
            {effPublish.state === "published_clean" && effPublish.version > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-success-text)]" />
                Published · v{effPublish.version} · {daysAgoShort(effPublish.at)}
              </span>
            )}
            {effPublish.state === "unpublished_changes" && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--muted-amber-text)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-amber-text)]" />
                Unpublished changes
              </span>
            )}
            {(effPublish.state === "never" || effPublish.version === 0) && itinerary.publish_state !== "published_clean" && publishLocal?.state !== "published_clean" && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                Not yet published
              </span>
            )}
            <span className="text-sm text-muted-foreground">{formatDateRange(itinerary.trip_start_date, itinerary.trip_end_date)}</span>
            <span className="text-sm text-muted-foreground/50">·</span>
            <Link href={`/dashboard/vics/${itinerary.primary_vic_id}`} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
              {itinerary.primary_vic_name ?? itinerary.primary_vic_id}
            </Link>
          </div>
        </div>
      </div>
      <header className="shrink-0 border-b border-border px-4 py-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <Button variant="outline" size="sm" asChild className="border-input text-foreground">
              <Link href={`/dashboard/itineraries/${itineraryId}/edit`}>
                <Pencil size={14} className="mr-1" /> Edit
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            className="bg-brand-cta text-brand-cta-foreground hover:bg-brand-cta-hover font-medium"
            onClick={() => setShareModalOpen(true)}
          >
            <Share2 size={14} className="mr-1" /> Share with VIC
          </Button>
          <Button size="sm" variant="outline" className="border-input text-foreground" onClick={() => setGuestPortalOpen(true)}>
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
            className="border-input text-foreground"
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
              <Button variant="outline" size="sm" className="border-input text-foreground px-2">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setInvoiceOpen(true)}>Generate Invoice</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canDelete && (
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(true)} className="border-input text-[var(--muted-error-text)]">
              <Trash2 size={14} className="mr-1" /> Delete
            </Button>
          )}
        </div>
      </header>

      <div className="shrink-0 px-4 py-3 border-b border-border relative bg-inset">
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
                      className={cn("h-px w-6 mx-1 shrink-0", isPast ? "bg-border" : "bg-border/40")}
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
                        ? "bg-muted-foreground/15 text-foreground border border-border"
                        : isPast
                          ? "bg-muted-foreground/6 text-muted-foreground border border-border/50"
                          : "bg-transparent text-muted-foreground/70 border border-border/40 hover:border-border"
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
            className="absolute left-4 top-[calc(100%-4px)] z-50 bg-popover border border-input rounded-xl p-3 text-popover-foreground shadow-xl w-64"
          >
            <p className="text-xs text-muted-foreground/90 mb-2">
              Move to{" "}
              <span className="text-foreground font-medium">
                {PIPELINE_STAGES.find((s) => s.key === pipelineTarget)?.label}
              </span>
              ?
            </p>
            <textarea
              value={pipelineNote}
              onChange={(e) => setPipelineNote(e.target.value)}
              placeholder="Add a note (optional)…"
              rows={3}
              className="w-full bg-white/5 border border-input rounded-lg p-2 text-xs text-foreground/88 placeholder:text-muted-foreground/55 resize-none mb-2"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
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
            <span className="text-2xs text-muted-foreground">Templates for this stage:</span>
            {relevantTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => showToast(`Opening "${t.title}" — coming in v2`)}
                className="text-2xs text-rose-400/70 hover:text-rose-400 underline decoration-rose-400/20 hover:decoration-rose-400/40"
              >
                {t.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasMultiOption && (
        <div className="shrink-0 px-4 py-2 border-b border-border flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOptionIndex(0)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              optionIndex === 0 ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
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
                optionIndex === i + 1 ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Option {i + 2} — {opt.name}
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => showToast("Option creation — coming soon")}
          >
            <Plus size={14} className="mr-1" /> Add Option
          </Button>
          <Button variant="outline" size="sm" className="border-input ml-auto" onClick={() => setCompareOpen(true)}>
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

      <VICProposalModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} itinerary={itinerary} />

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
        vicName={itinerary.primary_vic_name ?? "VIC"}
        onAdd={() => showToast("Activity added (mock)")}
      />
    </div>
  );
}
