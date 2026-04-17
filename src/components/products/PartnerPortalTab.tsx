"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Award, Flame, Plus, X } from "lucide-react";
import {
  PartnerProgramEditorContent,
  PartnerProgramEditorSectionNav,
} from "@/components/settings/PartnerProgramEditorContent";
import { usePartnerPrograms } from "@/contexts/PartnerProgramsContext";
import {
  PageSearchField,
  directoryFilterSelectContentClass,
  directoryFilterSelectItemClass,
  directoryFilterSelectTriggerActiveClass,
  directoryFilterSelectTriggerClass,
} from "@/components/ui/page-search-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/contexts/ToastContext";
import { getPartnerProgramDraftDirtySummary } from "@/lib/partnerProgramDraftSections";
import { EditIconButton } from "@/components/ui/edit-icon-button";
import { cn } from "@/lib/utils";
import { partnerPortalProgramDomId } from "@/lib/partnerPortalData";
import { PARTNER_PROGRAMS_REFERENCE_ISO } from "@/lib/partnerProgramsSeed";
import {
  INCENTIVE_REFERENCE_ISO,
  incentiveDisplayPhase,
  incentiveWindowParts,
} from "@/lib/incentiveUi";
import { directoryProductTypeShortLabel, getPrimaryDirectoryType } from "@/components/products/directoryProductTypeHelpers";
import { directoryCategoryColors } from "@/components/products/productDirectoryVisual";
import {
  getActiveIncentiveOfferCount,
} from "@/components/products/productDirectoryCommission";
import type { Incentive, Program, ProgramStatus } from "@/types/partner-programs";
import type { DirectoryProduct } from "@/types/product-directory";
import { AMENITY_LABELS } from "@/components/products/productDirectoryFilterConfig";

const REF = new Date(PARTNER_PROGRAMS_REFERENCE_ISO);

function daysFromRef(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - REF.getTime()) / 86_400_000);
}

function programCardStatus(p: Program): ProgramStatus {
  if (p.status === "archived" || p.status === "paused") return p.status;
  if (p.status === "expired" || p.status === "expiring") return p.status;
  if (p.renewalDate) {
    const days = daysFromRef(p.renewalDate);
    if (days != null && days < 0) return "expired";
    if (days != null && days <= 30) return "expiring";
  }
  return "active";
}

function statusBadgeClass(s: ProgramStatus | "all"): string {
  switch (s) {
    case "active":
      return "bg-[rgba(130,160,130,0.2)] text-foreground/90 border border-[rgba(130,160,130,0.35)]";
    case "expiring":
      return "bg-[rgba(200,160,90,0.18)] text-foreground/90 border border-[rgba(200,160,90,0.35)]";
    case "expired":
      return "bg-[rgba(180,130,130,0.18)] text-foreground/90 border border-[rgba(180,130,130,0.35)]";
    case "paused":
    case "archived":
      return "bg-white/[0.06] text-muted-foreground border border-border";
    default:
      return "bg-white/[0.06] text-muted-foreground border border-border";
  }
}

function statusLabel(cardStatus: ProgramStatus): string {
  if (cardStatus === "expiring") return "Expiring soon";
  if (cardStatus === "archived") return "Archived";
  return cardStatus.charAt(0).toUpperCase() + cardStatus.slice(1);
}

type Surface = "list" | "edit";

type Props = {
  isAdmin?: boolean;
  canViewCommissions?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  /** When set, parent can disable outer page scroll so only the program editor pane scrolls (avoids nested scroll). */
  onEditorSurfaceChange?: (editorOpen: boolean) => void;
  /** False when this tab is hidden in a multi-tab shell (e.g. product catalog) so the parent can restore outer scroll. */
  partnerTabVisible?: boolean;
  catalogProducts?: DirectoryProduct[];
  onSelectProduct?: (productId: string) => void;
  onBrowseByProgram?: (programId: string) => void;
};

function PartnerLinkedProductStripTile({
  product,
  canViewCommissions,
  onSelect,
  brokenImage,
  onImageError,
}: {
  product: DirectoryProduct;
  canViewCommissions: boolean;
  onSelect: () => void;
  brokenImage: boolean;
  onImageError: () => void;
}) {
  const placeLine =
    product.city && product.country ? `${product.city}, ${product.country}` : product.location;
  const incentiveOfferCount = getActiveIncentiveOfferCount(product);
  const showIncentive = canViewCommissions && incentiveOfferCount > 0;
  const primaryType = getPrimaryDirectoryType(product);
  const cat = directoryCategoryColors(primaryType);
  const typePillLabel = directoryProductTypeShortLabel(product);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-[104px] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-border bg-inset text-left shadow-sm transition-colors hover:border-brand-cta/35"
    >
      <div className="relative h-[64px] w-full overflow-hidden bg-popover">
        {product.imageUrl && !brokenImage ? (
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={onImageError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080c]/60 via-transparent to-transparent" />
        <span
          className="absolute bottom-1.5 left-1.5 rounded-full border px-1.5 py-px text-[8px] backdrop-blur-sm"
          style={{
            background: cat.bg,
            color: cat.color,
            borderColor: cat.border,
          }}
        >
          {typePillLabel}
        </span>
        {showIncentive ? (
          <div
            className="absolute right-1 top-1 flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-400"
            title={`${incentiveOfferCount} active incentive${incentiveOfferCount !== 1 ? "s" : ""}`}
          >
            <Flame className="h-2 w-2" aria-hidden />
            {incentiveOfferCount > 1 ? incentiveOfferCount : null}
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 px-1.5 py-1.5 pt-1">
        <p className="line-clamp-2 text-[10px] font-medium leading-snug text-foreground">{product.name}</p>
        {placeLine ? (
          <p className="line-clamp-1 text-[8px] leading-tight text-muted-foreground">{placeLine}</p>
        ) : null}
      </div>
    </button>
  );
}

export function PartnerPortalTab({
  isAdmin = false,
  canViewCommissions = true,
  onDirtyChange,
  onEditorSurfaceChange,
  partnerTabVisible = true,
  catalogProducts = [],
  onSelectProduct,
  onBrowseByProgram,
}: Props) {
  const {
    snapshot,
    revision,
    upsertProgram,
    removeProgram,
    upsertLink,
    upsertIncentive,
    removeLink,
    removeIncentive,
  } = usePartnerPrograms();
  const searchParams = useSearchParams();
  const openedProgramFromUrlRef = useRef<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | "all">("all");
  const [surface, setSurface] = useState<Surface>("list");
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [programDraft, setProgramDraft] = useState<Program | null>(null);
  const [linkedTileBroken, setLinkedTileBroken] = useState<Record<string, boolean>>({});

  const productById = useMemo(() => {
    const m = new Map<string, DirectoryProduct>();
    for (const p of catalogProducts) m.set(p.id, p);
    return m;
  }, [catalogProducts]);

  const incentiveRefDate = useMemo(() => new Date(INCENTIVE_REFERENCE_ISO), []);

  const savedProgram = useMemo(
    () => (selectedProgramId ? snapshot.programs.find((p) => p.id === selectedProgramId) ?? null : null),
    [snapshot.programs, selectedProgramId]
  );

  const draftInitForIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedProgramId || surface !== "edit") {
      if (!selectedProgramId || surface === "list") {
        draftInitForIdRef.current = null;
        setProgramDraft(null);
      }
      return;
    }
    const p = snapshot.programs.find((x) => x.id === selectedProgramId);
    if (!p) return;
    if (draftInitForIdRef.current !== selectedProgramId) {
      draftInitForIdRef.current = selectedProgramId;
      setProgramDraft({ ...p });
    }
  }, [selectedProgramId, snapshot.programs, surface]);

  const editDialogDirty = useMemo(() => {
    if (!programDraft || !savedProgram) return false;
    return JSON.stringify(programDraft) !== JSON.stringify(savedProgram);
  }, [programDraft, savedProgram]);

  const programDirtySummary = useMemo(
    () => getPartnerProgramDraftDirtySummary(savedProgram, programDraft),
    [savedProgram, programDraft]
  );

  useEffect(() => {
    onDirtyChange?.(surface === "edit" && editDialogDirty);
  }, [onDirtyChange, surface, editDialogDirty]);

  const linksForEditing = useMemo(
    () => (selectedProgramId ? snapshot.links.filter((l) => l.programId === selectedProgramId) : []),
    [snapshot.links, selectedProgramId]
  );

  const linkedProductIdsForEditing = useMemo(
    () => linksForEditing.map((l) => l.productId),
    [linksForEditing]
  );

  const incentivesForEditing = useMemo(
    () =>
      selectedProgramId ? snapshot.incentives.filter((i) => i.programId === selectedProgramId) : [],
    [snapshot.incentives, selectedProgramId]
  );

  const sortedIncentivesEditing = useMemo(() => {
    const list = [...incentivesForEditing];
    const rank = (p: Incentive) => {
      const ph = incentiveDisplayPhase(p, incentiveRefDate);
      if (ph === "active") return 0;
      if (ph === "upcoming") return 1;
      return 2;
    };
    list.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
    return list;
  }, [incentivesForEditing, incentiveRefDate]);

  const sortedLinksEditing = useMemo(() => {
    const list = [...linksForEditing];
    const nameFor = (id: string) => productById.get(id)?.name ?? id;
    list.sort((a, b) => nameFor(a.productId).localeCompare(nameFor(b.productId)));
    return list;
  }, [linksForEditing, productById]);

  const patchProgramDraft = useCallback((patch: Partial<Program>) => {
    setProgramDraft((d) => {
      if (!d) return null;
      const next: Program = { ...d, ...patch };
      if (patch.agencyContact) {
        next.agencyContact = { ...d.agencyContact, ...patch.agencyContact };
      }
      return next;
    });
  }, []);

  const toast = useToast();
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const editorScrollRef = useRef<HTMLDivElement>(null);

  const goToList = useCallback(() => {
    draftInitForIdRef.current = null;
    setSurface("list");
    setSelectedProgramId(null);
    setProgramDraft(null);
  }, []);

  const handleCloseEditSurface = useCallback(() => {
    if (!editDialogDirty) goToList();
    else setDiscardDialogOpen(true);
  }, [editDialogDirty, goToList]);

  const confirmDiscard = useCallback(() => {
    setDiscardDialogOpen(false);
    goToList();
  }, [goToList]);

  useEffect(() => {
    if (surface === "list" || discardDialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      handleCloseEditSurface();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [surface, discardDialogOpen, handleCloseEditSurface]);

  useEffect(() => {
    if (surface !== "edit" || !editDialogDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [surface, editDialogDirty]);

  const saveProgramDraft = useCallback(() => {
    if (!programDraft) return;
    upsertProgram({
      ...programDraft,
      updatedAt: new Date().toISOString(),
    });
    goToList();
  }, [programDraft, upsertProgram, goToList]);

  const handleSaveShortcut = useCallback(() => {
    if (surface === "edit" && programDraft) {
      if (!programDraft.name.trim()) {
        toast({ title: "Program name is required", tone: "destructive" });
        return;
      }
      if (!editDialogDirty) {
        toast({ title: "No changes to save", tone: "destructive" });
        return;
      }
      saveProgramDraft();
    }
  }, [surface, programDraft, editDialogDirty, saveProgramDraft, toast]);

  useEffect(() => {
    if (surface === "list" || discardDialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s")) return;
      e.preventDefault();
      handleSaveShortcut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [surface, discardDialogOpen, handleSaveShortcut]);

  /** Open the full editor in one step (same idea as rep firms: list → form, no read-only middle). */
  const openProgramEditorForId = useCallback(
    (programId: string) => {
      if (!isAdmin) return;
      if (!snapshot.programs.some((x) => x.id === programId)) return;
      draftInitForIdRef.current = null;
      setSelectedProgramId(programId);
      setSurface("edit");
    },
    [isAdmin, snapshot.programs]
  );

  const beginAddProgram = useCallback(() => {
    if (!isAdmin) return;
    const id = `reg-${Date.now()}`;
    const now = new Date().toISOString();
    const created: Program = {
      id,
      name: "New program",
      network: null,
      type: "preferred_partner",
      termsSummary: null,
      commissionRate: "10%",
      commissionType: "percentage",
      commissionCurrency: "EUR",
      amenities: [],
      customAmenities: [],
      hasPropertyLevelOverrides: false,
      agencyContact: { name: null, email: null, phone: null },
      agreementStart: null,
      renewalDate: null,
      status: "active",
      agencyTerms: null,
      agencyNegotiatedRate: null,
      agencyId: "tl-demo",
      createdBy: "admin",
      createdAt: now,
      updatedAt: now,
    };
    upsertProgram(created);
    draftInitForIdRef.current = null;
    setSelectedProgramId(id);
    setSurface("edit");
  }, [isAdmin, upsertProgram]);

  const productNameForId = useCallback((id: string) => productById.get(id)?.name ?? id, [productById]);

  const programsOrdered = useMemo(() => {
    return [...snapshot.programs].sort((a, b) => a.name.localeCompare(b.name));
  }, [snapshot.programs]);

  const filteredPrograms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programsOrdered.filter((p) => {
      if (p.status === "archived" && statusFilter !== "archived") return false;
      const cardStatus = programCardStatus(p);
      if (statusFilter !== "all" && cardStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.network ?? "").toLowerCase().includes(q) ||
        (p.termsSummary ?? "").toLowerCase().includes(q) ||
        (p.agencyTerms ?? "").toLowerCase().includes(q)
      );
    });
  }, [programsOrdered, search, statusFilter]);

  const programScrollKey = searchParams.get("program");
  useEffect(() => {
    if (!programScrollKey) return;
    if (openedProgramFromUrlRef.current === programScrollKey) return;
    if (!snapshot.programs.some((p) => p.id === programScrollKey)) return;
    openedProgramFromUrlRef.current = programScrollKey;
    if (!isAdmin) return;
    setSelectedProgramId(programScrollKey);
    draftInitForIdRef.current = null;
    setSurface("edit");
  }, [programScrollKey, snapshot.programs, isAdmin]);

  useEffect(() => {
    if (!programScrollKey) openedProgramFromUrlRef.current = null;
  }, [programScrollKey]);

  useEffect(() => {
    if (!programScrollKey) return;
    const id = partnerPortalProgramDomId(programScrollKey);
    if (surface !== "list") return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [programScrollKey, revision, filteredPrograms.length, surface]);

  const showEditChrome = surface === "edit";

  useLayoutEffect(() => {
    if (!partnerTabVisible) {
      onEditorSurfaceChange?.(false);
      return;
    }
    onEditorSurfaceChange?.(showEditChrome);
  }, [partnerTabVisible, showEditChrome, onEditorSurfaceChange]);

  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-none",
        showEditChrome ? "flex min-h-0 flex-1 flex-col gap-0" : "space-y-6"
      )}
    >
      {!canViewCommissions ? (
        <p className="text-2xs text-muted-foreground">
          Commission amounts are hidden for your role. Program names and structure still apply.
        </p>
      ) : null}

      {surface === "list" ? (
      <div className="sticky top-0 z-20 -mx-6 space-y-3 border-b border-border bg-inset px-6 pb-3 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 basis-[min(100%,20rem)]">
            <PageSearchField
              value={search}
              onChange={setSearch}
              placeholder="Search programs by name, network, or terms…"
              aria-label="Search partner programs"
            />
          </div>
          {isAdmin ? (
            <Button type="button" variant="toolbarAccent" size="sm" className="shrink-0 gap-1" onClick={beginAddProgram}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add program
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ProgramStatus | "all")}
          >
            <SelectTrigger
              className={cn(
                directoryFilterSelectTriggerClass,
                // Full label in the trigger (no ellipsis); width follows selected option
                "w-max min-w-max max-w-none shrink-0 *:data-[slot=select-value]:line-clamp-none [&_[data-slot=select-value]]:line-clamp-none",
                statusFilter !== "all" && directoryFilterSelectTriggerActiveClass
              )}
              aria-label="Filter by status"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className={directoryFilterSelectContentClass}>
              <SelectItem className={directoryFilterSelectItemClass} value="all">
                All statuses
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="active">
                Active
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="expiring">
                Expiring soon
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="expired">
                Expired
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="paused">
                Paused
              </SelectItem>
              <SelectItem className={directoryFilterSelectItemClass} value="archived">
                Archived
              </SelectItem>
            </SelectContent>
          </Select>
          {(statusFilter !== "all" || search.trim() !== "") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>
      ) : null}

      {showEditChrome ? (
        <section
          id="partner-program-editor"
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-popover shadow-sm"
        >
          <div className="shrink-0 border-b border-border/80 bg-popover px-4 py-2 sm:px-5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold leading-tight tracking-tight text-foreground sm:text-[15px]">
                  {programDraft?.name.trim() || "Partner program"}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Close"
                onClick={() => handleCloseEditSurface()}
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            {surface === "edit" && programDraft ? (
              <div className="mt-2 border-t border-border/50 pt-1.5">
                <PartnerProgramEditorSectionNav
                  scrollContainerRef={editorScrollRef}
                  onBackToTop={() => editorScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                />
              </div>
            ) : null}
          </div>

          <div
            ref={editorScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-5 pt-3 sm:px-5 sm:pb-6"
          >
            <div className="space-y-6">
            {programDraft ? (
              <PartnerProgramEditorContent
                programDraft={programDraft}
                patchProgramDraft={patchProgramDraft}
                sortedLinks={sortedLinksEditing}
                linkCatalogProducts={catalogProducts}
                sortedIncentives={sortedIncentivesEditing}
                upsertIncentive={upsertIncentive}
                onRemoveIncentive={removeIncentive}
                upsertLink={upsertLink}
                removeLink={removeLink}
                productNameForId={productNameForId}
              />
            ) : null}
            </div>
          </div>

          <div className="relative z-20 flex shrink-0 flex-wrap items-center gap-2 border-t border-border/80 bg-popover/95 px-4 py-3.5 shadow-[0_-10px_28px_-12px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:px-6">
            <div className="mr-auto flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              {surface === "edit" && programDraft ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-fit shrink-0"
                  onClick={() => {
                    if (!programDraft) return;
                    if (!window.confirm(`Delete “${programDraft.name}”? This removes the program and its links.`)) return;
                    removeProgram(programDraft.id);
                    goToList();
                  }}
                >
                  Delete program
                </Button>
              ) : null}
              {surface === "edit" && programDirtySummary.isDirty ? (
                <p className="text-2xs text-muted-foreground">
                  {programDirtySummary.sectionCount <= 1
                    ? "Unsaved changes"
                    : `Unsaved changes in ${programDirtySummary.sectionCount} sections`}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => handleCloseEditSurface()}>
              {surface === "edit" && editDialogDirty ? "Discard changes" : "Cancel"}
            </Button>
            <Button
              type="button"
              disabled={!programDraft?.name?.trim() || !editDialogDirty}
              onClick={saveProgramDraft}
              className="bg-[#B07A5B] text-[#08080c] hover:bg-[#c08a6f] disabled:opacity-40"
            >
              Save
            </Button>
            </div>
          </div>
        </section>
      ) : null}

      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent className="border-border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes to this program. If you leave now, they will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setDiscardDialogOpen(false)}>
              Keep editing
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDiscard}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {surface === "list" && filteredPrograms.length === 0 ? (
        <div className="rounded-xl border border-border bg-white/[0.02] px-6 py-12 text-center">
          <Award className="mx-auto mb-3 h-8 w-8 text-brand-cta/70" aria-hidden />
          <p className="text-compact font-medium text-foreground">No programs match</p>
          <p className="mt-1 text-xs text-muted-foreground">Try another search term or clear filters.</p>
        </div>
      ) : null}

      {surface === "list" && filteredPrograms.length > 0 ? (
        <div className="w-full space-y-4">
          {filteredPrograms.map((program) => {
            const links = snapshot.links.filter((l) => l.programId === program.id);
            const cardStatus = programCardStatus(program);
            const linkedProductIds = links.map((l) => l.productId);
            const programIncentives = snapshot.incentives.filter((i) => i.programId === program.id);
            const sortedProgramIncentives = [...programIncentives].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
            const singleIncentive =
              sortedProgramIncentives.length === 1 ? sortedProgramIncentives[0] : null;
            const singleIncentiveWindows = singleIncentive
              ? incentiveWindowParts(singleIncentive)
              : null;
            const incentiveCount = programIncentives.length;

            return (
              <div
                key={program.id}
                id={partnerPortalProgramDomId(program.id)}
                className="scroll-mt-4 w-full overflow-hidden rounded-2xl border border-border bg-popover"
              >
                <div className="relative w-full p-4 text-left">
                  {isAdmin ? (
                    <EditIconButton
                      label={`Edit ${program.name}`}
                      className="absolute right-3 top-3 z-0"
                      onClick={() => openProgramEditorForId(program.id)}
                    />
                  ) : null}
                  <div className={cn("min-w-0", isAdmin && "pr-11")}>
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{program.name}</h3>
                          <span className="rounded-full bg-[rgba(201,169,110,0.12)] px-2 py-0.5 text-[9px] text-brand-cta">
                            {links.length} product{links.length !== 1 ? "s" : ""}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-medium",
                              statusBadgeClass(cardStatus)
                            )}
                          >
                            {statusLabel(cardStatus)}
                          </span>
                          {incentiveCount > 0 && !singleIncentive ? (
                            <span className="rounded-full border border-border bg-white/[0.04] px-2 py-0.5 text-[9px] text-muted-foreground">
                              {incentiveCount} incentive{incentiveCount !== 1 ? "s" : ""}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-2xs text-muted-foreground">{program.network ?? "—"}</p>
                        {program.termsSummary ? (
                          <p className="mt-1.5 line-clamp-4 text-2xs leading-relaxed text-muted-foreground">
                            {program.termsSummary}
                          </p>
                        ) : null}
                        {(program.amenities.length > 0 || program.customAmenities.length > 0) ? (
                          <div className="mt-2">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                              Amenities
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {program.amenities.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md border border-brand-cta/25 bg-[rgba(201,169,110,0.08)] px-1.5 py-0.5 text-[9px] text-brand-cta"
                                >
                                  {AMENITY_LABELS[tag] ?? tag}
                                </span>
                              ))}
                              {program.customAmenities.map((label, i) => (
                                <span
                                  key={`custom-${i}-${label}`}
                                  className="rounded-md border border-border bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-foreground/90"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {canViewCommissions ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="rounded-md border border-brand-cta/20 bg-[rgba(201,169,110,0.06)] px-1.5 py-0.5 text-[9px] text-brand-cta">
                              {program.commissionRate}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {singleIncentive ? (
                  <div
                    className={cn(
                      "border-t border-border bg-inset/25 px-4 py-3 sm:px-4",
                      incentiveDisplayPhase(singleIncentive, incentiveRefDate) === "expired" && "opacity-70"
                    )}
                  >
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                      Temporary incentive
                    </p>
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 space-y-0.5">
                        {canViewCommissions ? (
                          <p className="text-xs font-semibold text-brand-cta">
                            {singleIncentive.rateValue} effective
                            {singleIncentive.rateType === "flat" ? (
                              <span className="font-normal text-muted-foreground"> (flat)</span>
                            ) : null}
                          </p>
                        ) : (
                          <p className="text-xs font-medium text-muted-foreground">Incentive on file</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {singleIncentive.stacksWithBase ? "Stacks with base" : "Does not stack (override)"}
                        </p>
                        <p className="text-2xs font-medium text-foreground">{singleIncentive.name}</p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-0.5 text-[10px] leading-snug text-muted-foreground sm:max-w-[min(100%,14rem)] sm:text-right">
                        {singleIncentiveWindows &&
                        !singleIncentiveWindows.bookLine &&
                        !singleIncentiveWindows.travelLine ? (
                          <p>Open-ended windows</p>
                        ) : null}
                        {singleIncentiveWindows?.bookLine ? (
                          <p>{singleIncentiveWindows.bookLine}</p>
                        ) : null}
                        {singleIncentiveWindows?.travelLine ? (
                          <p>{singleIncentiveWindows.travelLine}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                {linkedProductIds.length > 0 ? (
                  <div className="border-t border-border bg-inset/35 px-3 py-2 sm:px-4">
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/65">
                        Linked products
                        <span className="ml-1.5 font-medium tabular-nums text-muted-foreground/90">
                          ({linkedProductIds.length})
                        </span>
                      </p>
                      {onBrowseByProgram ? (
                        <button
                          type="button"
                          onClick={() => onBrowseByProgram(program.id)}
                          className="shrink-0 rounded-md border border-brand-cta/30 bg-[rgba(201,169,110,0.10)] px-2 py-1 text-[10px] font-medium text-brand-cta hover:bg-[rgba(201,169,110,0.15)]"
                        >
                          View all in Products
                        </button>
                      ) : null}
                    </div>
                    <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
                      {linkedProductIds.map((pid) => {
                        const p = productById.get(pid);
                        if (!p) {
                          return (
                            <div
                              key={pid}
                              className="flex w-[104px] shrink-0 items-center justify-center rounded-lg border border-border bg-inset p-2 text-[9px] text-muted-foreground"
                            >
                              {pid}
                            </div>
                          );
                        }
                        return (
                          <PartnerLinkedProductStripTile
                            key={pid}
                            product={p}
                            canViewCommissions={canViewCommissions}
                            onSelect={() => onSelectProduct?.(pid)}
                            brokenImage={!!linkedTileBroken[pid]}
                            onImageError={() =>
                              setLinkedTileBroken((prev) =>
                                prev[pid] ? prev : { ...prev, [pid]: true }
                              )
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-border px-3 py-2 sm:px-4">
                    <p className="text-[10px] text-muted-foreground">
                      {isAdmin
                        ? "No catalog products linked yet. Use the pencil above to attach products."
                        : "No catalog products linked yet."}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

    </div>
  );
}
