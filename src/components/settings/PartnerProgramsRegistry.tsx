"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Award, ChevronLeft, Plus, Search } from "lucide-react";
import { usePartnerPrograms } from "@/contexts/PartnerProgramsContext";
import { usePermissions } from "@/hooks/usePermissions";
import { MOCK_DIRECTORY_PRODUCTS } from "@/components/products/productDirectoryMock";
import { PARTNER_PROGRAMS_REFERENCE_ISO } from "@/lib/partnerProgramsSeed";
import { INCENTIVE_REFERENCE_ISO, incentiveDisplayPhase } from "@/lib/incentiveUi";
import { validateIncentiveForm } from "@/lib/incentiveValidation";
import { cn } from "@/lib/utils";
import {
  PartnerProgramEditorContent,
  PartnerProgramEditorSectionNav,
} from "@/components/settings/PartnerProgramEditorContent";
import { IncentiveEditorForm } from "@/components/settings/incentive-editor-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Program, ProgramStatus, Incentive } from "@/types/partner-programs";

const REF = new Date(PARTNER_PROGRAMS_REFERENCE_ISO);

function daysFromRef(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - REF.getTime()) / 86_400_000);
}

function programCardStatus(p: Program): ProgramStatus {
  if (p.status === "archived" || p.status === "paused") return p.status;
  if (p.renewalDate) {
    const days = daysFromRef(p.renewalDate);
    if (days != null && days < 0) return "expired";
    if (days != null && days <= 30) return "expiring";
  }
  return "active";
}

function newPartnerProgramFromDefaults(): Program {
  const id = `reg-${Date.now()}`;
  const now = new Date().toISOString();
  return {
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

type PartnerProgramsRegistryProps = {
  /** When true, registry is embedded in Product Directory → Partner Portal (no Settings back-nav). */
  embeddedInCatalog?: boolean;
  /** When true, hide back links (e.g. full editor opened from a dialog). */
  embeddedInModal?: boolean;
  /** Create a new program and open the editor on mount (e.g. deep link). */
  openAddProgramOnMount?: boolean;
};

export default function PartnerProgramsRegistry({
  embeddedInCatalog = false,
  embeddedInModal = false,
  openAddProgramOnMount = false,
}: PartnerProgramsRegistryProps) {
  const searchParams = useSearchParams();
  const { isAdmin } = usePermissions();
  const { snapshot, upsertProgram, removeProgram, upsertLink, upsertIncentive, removeLink, removeIncentive } =
    usePartnerPrograms();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const addOnMountDoneRef = useRef(false);

  const selected = useMemo(
    () => snapshot.programs.find((p) => p.id === selectedId) ?? null,
    [snapshot.programs, selectedId]
  );

  const programFromUrl = searchParams.get("program");
  useEffect(() => {
    if (!programFromUrl) return;
    if (!snapshot.programs.some((p) => p.id === programFromUrl)) return;
    setSelectedId(programFromUrl);
  }, [programFromUrl, snapshot.programs]);

  const createAndOpenNewProgram = useCallback(() => {
    const p = newPartnerProgramFromDefaults();
    upsertProgram(p);
    setSelectedId(p.id);
  }, [upsertProgram]);

  useEffect(() => {
    if (!openAddProgramOnMount || addOnMountDoneRef.current) return;
    addOnMountDoneRef.current = true;
    createAndOpenNewProgram();
  }, [openAddProgramOnMount, createAndOpenNewProgram]);

  const filteredPrograms = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return snapshot.programs.filter((p) => {
      if (statusFilter !== "all" && programCardStatus(p) !== statusFilter) return false;
      if (!qq) return true;
      return (
        p.name.toLowerCase().includes(qq) ||
        (p.network ?? "").toLowerCase().includes(qq)
      );
    });
  }, [snapshot.programs, q, statusFilter]);

  const linksForSelected = useMemo(
    () => snapshot.links.filter((l) => l.programId === selectedId),
    [snapshot.links, selectedId]
  );

  const linkedProductIds = useMemo(
    () => linksForSelected.map((l) => l.productId),
    [linksForSelected]
  );

  const incentivesForSelected = useMemo(
    () => snapshot.incentives.filter((p) => p.programId === selectedId),
    [snapshot.incentives, selectedId]
  );

  const incentiveRefDate = useMemo(() => new Date(INCENTIVE_REFERENCE_ISO), []);
  const sortedIncentives = useMemo(() => {
    const list = [...incentivesForSelected];
    const rank = (p: Incentive) => {
      const ph = incentiveDisplayPhase(p, incentiveRefDate);
      if (ph === "active") return 0;
      if (ph === "upcoming") return 1;
      return 2;
    };
    list.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
    return list;
  }, [incentivesForSelected, incentiveRefDate]);

  const sortedLinks = useMemo(() => {
    const list = [...linksForSelected];
    const productName = (id: string) => MOCK_DIRECTORY_PRODUCTS.find((p) => p.id === id)?.name ?? id;
    list.sort((a, b) => productName(a.productId).localeCompare(productName(b.productId)));
    return list;
  }, [linksForSelected]);

  const [programDraft, setProgramDraft] = useState<Program | null>(null);

  useEffect(() => {
    if (selected) setProgramDraft({ ...selected });
    else setProgramDraft(null);
  }, [selected]);

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

  const saveProgramDraft = useCallback(() => {
    if (!programDraft) return;
    upsertProgram({
      ...programDraft,
      updatedAt: new Date().toISOString(),
    });
  }, [programDraft, upsertProgram]);

  const editorDirty = useMemo(
    () => Boolean(selected && programDraft && JSON.stringify(selected) !== JSON.stringify(programDraft)),
    [selected, programDraft]
  );

  const programDirtySummary = useMemo(
    () => getPartnerProgramDraftDirtySummary(selected, programDraft),
    [selected, programDraft]
  );

  const toast = useToast();
  const registryScrollRef = useRef<HTMLDivElement>(null);
  const [discardCloseOpen, setDiscardCloseOpen] = useState(false);

  const requestCloseEditor = useCallback(() => {
    if (editorDirty) setDiscardCloseOpen(true);
    else setSelectedId(null);
  }, [editorDirty]);

  const confirmDiscardClose = useCallback(() => {
    setDiscardCloseOpen(false);
    setSelectedId(null);
  }, []);

  const handleSaveShortcut = useCallback(() => {
    if (!programDraft) return;
    if (!programDraft.name.trim()) {
      toast({ title: "Program name is required", tone: "destructive" });
      return;
    }
    if (!editorDirty) {
      toast({ title: "No changes to save", tone: "destructive" });
      return;
    }
    saveProgramDraft();
  }, [programDraft, editorDirty, saveProgramDraft, toast]);

  useEffect(() => {
    if (selectedId == null || discardCloseOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (!((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s")) return;
      e.preventDefault();
      handleSaveShortcut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, discardCloseOpen, handleSaveShortcut]);

  useEffect(() => {
    if (!editorDirty || selectedId == null) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [editorDirty, selectedId]);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg space-y-3 p-6">
        <p className="text-sm text-foreground">Partner programs are managed by workspace administrators.</p>
        <p className="text-sm text-muted-foreground">
          You can browse agreements and linked products in the product catalog.
        </p>
        <Button type="button" variant="secondary" className="rounded-xl" asChild>
          <Link href="/dashboard/products?tab=partner">Open Partner Programs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto max-w-5xl space-y-6",
        embeddedInModal ? "p-0" : embeddedInCatalog ? "py-1" : "p-6"
      )}
    >
      {!embeddedInModal ? (
        embeddedInCatalog ? (
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3 w-3" />
            Browse products
          </Link>
        ) : (
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3 w-3" />
            Settings
          </Link>
        )
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/[0.04]">
            <Award className="h-5 w-5 text-brand-cta" aria-hidden />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Partner Programs</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Agency-wide partner agreements, linked products, and promotions.
            </p>
          </div>
        </div>
        <Button type="button" className="gap-1 rounded-xl" onClick={createAndOpenNewProgram}>
          <Plus className="h-4 w-4" />
          Add Program
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search programs…"
            className="rounded-xl border-border bg-background pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProgramStatus | "all")}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring soon</option>
          <option value="expired">Expired</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPrograms.map((p) => {
          const links = snapshot.links.filter((l) => l.programId === p.id);
          const totalMock = `€${(links.length * 3525).toLocaleString()}`;
          const nextExpiry = links
            .map((l) => l.expiresAt)
            .filter(Boolean)
            .sort()[0];
          const days = daysFromRef(nextExpiry ?? p.renewalDate);
          const cardStatus = programCardStatus(p);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={cn(
                "rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-white/[0.03]",
                selectedId === p.id && "ring-1 ring-brand-cta/40"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.network ?? "—"}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", statusBadgeClass(cardStatus))}>
                  {cardStatus === "expiring" ? "Expiring soon" : cardStatus}
                </span>
              </div>
              <dl className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <dt>Products</dt>
                  <dd className="text-foreground/90">{links.length}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Tracked (demo)</dt>
                  <dd className="text-foreground/90">{totalMock}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Next renewal</dt>
                  <dd className="text-foreground/90">
                    {days != null ? `${days}d` : "—"}
                  </dd>
                </div>
              </dl>
            </button>
          );
        })}
      </div>

      {filteredPrograms.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No programs match your filters.</p>
      ) : null}

      <Dialog
        open={selectedId != null}
        onOpenChange={(open) => {
          if (open) return;
          if (editorDirty) setDiscardCloseOpen(true);
          else setSelectedId(null);
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden border-border bg-background p-0">
          {programDraft ? (
            <>
              <DialogHeader className="shrink-0 gap-0 border-b border-border bg-background px-5 py-2.5 text-left sm:px-6">
                <DialogTitle className="text-base font-semibold leading-tight">{programDraft.name}</DialogTitle>
                <p className="mt-0.5 text-2xs text-muted-foreground sm:text-xs">{programDraft.network ?? "Direct"}</p>
                <div className="mt-2 border-t border-border/50 pt-1.5">
                  <PartnerProgramEditorSectionNav
                    scrollContainerRef={registryScrollRef}
                    onBackToTop={() => registryScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
                  />
                </div>
              </DialogHeader>
              <div ref={registryScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-4 pt-3 sm:px-6">
                <PartnerProgramEditorContent
                  programDraft={programDraft}
                  patchProgramDraft={patchProgramDraft}
                  sortedLinks={sortedLinks}
                  linkCatalogProducts={MOCK_DIRECTORY_PRODUCTS}
                  sortedIncentives={sortedIncentives}
                  upsertIncentive={upsertIncentive}
                  onRemoveIncentive={removeIncentive}
                  upsertLink={upsertLink}
                  removeLink={removeLink}
                  productNameForId={(id) => MOCK_DIRECTORY_PRODUCTS.find((x) => x.id === id)?.name ?? id}
                />
              </div>
              <DialogFooter className="shrink-0 gap-2 border-t border-border bg-background px-6 py-3 sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={requestCloseEditor}>
                      {editorDirty ? "Discard changes" : "Cancel"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-[#A66B6B]/40 text-[#A66B6B]/90 hover:bg-[rgba(180,130,130,0.08)]"
                      onClick={() => {
                        if (!programDraft) return;
                        removeProgram(programDraft.id);
                        setSelectedId(null);
                      }}
                    >
                      Delete program
                    </Button>
                  </div>
                  {programDirtySummary.isDirty ? (
                    <p className="text-2xs text-muted-foreground">
                      {programDirtySummary.sectionCount <= 1
                        ? "Unsaved changes"
                        : `Unsaved changes in ${programDirtySummary.sectionCount} sections`}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  disabled={!programDraft.name.trim() || !editorDirty}
                  onClick={saveProgramDraft}
                >
                  Save
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={discardCloseOpen} onOpenChange={setDiscardCloseOpen}>
        <DialogContent className="border-border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes to this program. If you close now, they will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setDiscardCloseOpen(false)}>
              Keep editing
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDiscardClose}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function toIsoDate(d: string): string | null {
  return d ? `${d}T12:00:00.000Z` : null;
}

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
}

export function AddIncentiveDialog({
  open,
  onOpenChange,
  programId,
  linkedProductIds,
  editingIncentive,
  upsertIncentive,
  productNameForId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  programId: string | null;
  linkedProductIds: string[];
  editingIncentive: Incentive | null;
  upsertIncentive: (p: Incentive) => void;
  /** Resolve linked product id → label in scope picker (defaults to mock catalog). */
  productNameForId?: (id: string) => string;
}) {
  const [name, setName] = useState("");
  const [rateValue, setRateValue] = useState("+2%");
  const [rateType, setRateType] = useState<"percentage" | "flat">("percentage");
  const [stacksWithBase, setStacksWithBase] = useState(true);
  const [scopeAll, setScopeAll] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bookingStart, setBookingStart] = useState("");
  const [bookingEnd, setBookingEnd] = useState("");
  const [travelStart, setTravelStart] = useState("");
  const [travelEnd, setTravelEnd] = useState("");
  const [eligibilityNotes, setEligibilityNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSaveError(null);
    const e = editingIncentive;
    if (e) {
      setName(e.name);
      setRateValue(e.rateValue);
      setRateType(e.rateType);
      setStacksWithBase(e.stacksWithBase);
      if (e.productIds === "all") {
        setScopeAll(true);
        setSelectedProducts([]);
      } else {
        setScopeAll(false);
        const allowed = new Set(linkedProductIds);
        setSelectedProducts(e.productIds.filter((pid) => allowed.has(pid)));
      }
      setBookingStart(isoToDateInput(e.bookingWindowStart));
      setBookingEnd(isoToDateInput(e.bookingWindowEnd));
      setTravelStart(isoToDateInput(e.travelWindowStart));
      setTravelEnd(isoToDateInput(e.travelWindowEnd));
      setEligibilityNotes(e.eligibilityNotes ?? "");
      return;
    }
    setName("");
    setRateValue("+2%");
    setRateType("percentage");
    setStacksWithBase(true);
    setScopeAll(true);
    setSelectedProducts([]);
    setBookingStart("");
    setBookingEnd("");
    setTravelStart("");
    setTravelEnd("");
    setEligibilityNotes("");
  }, [open, editingIncentive, linkedProductIds]);

  const labelForProduct = useMemo(
    () => productNameForId ?? ((pid: string) => MOCK_DIRECTORY_PRODUCTS.find((x) => x.id === pid)?.name ?? pid),
    [productNameForId]
  );

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = () => {
    if (!programId) return;
    const err = validateIncentiveForm({
      bookingStart,
      bookingEnd,
      travelStart,
      travelEnd,
      volumeThreshold: "",
      volumeMetric: "",
      scopeAll,
      selectedProductIds: selectedProducts,
      linkedProductIds,
    });
    if (err) {
      setSaveError(err);
      return;
    }
    setSaveError(null);

    const now = new Date().toISOString();
    const isEdit = editingIncentive != null;
    const id = isEdit ? editingIncentive.id : `promo-${Date.now()}`;
    const productIds: string[] | "all" =
      scopeAll || linkedProductIds.length === 0 ? "all" : selectedProducts;

    const preserveVolume = isEdit && editingIncentive != null;

    upsertIncentive({
      id,
      programId,
      productIds,
      name: name.trim() || "Promotion",
      rateValue: rateValue.trim() || "0%",
      rateType,
      stacksWithBase,
      bookingWindowStart: toIsoDate(bookingStart),
      bookingWindowEnd: toIsoDate(bookingEnd),
      travelWindowStart: toIsoDate(travelStart),
      travelWindowEnd: toIsoDate(travelEnd),
      volumeThreshold: preserveVolume ? editingIncentive.volumeThreshold : null,
      volumeMetric: preserveVolume ? editingIncentive.volumeMetric : null,
      volumeRetroactive: preserveVolume ? editingIncentive.volumeRetroactive : false,
      eligibilityNotes: eligibilityNotes.trim() || null,
      createdBy: isEdit ? editingIncentive.createdBy : "admin",
      createdAt: isEdit ? editingIncentive.createdAt : now,
      updatedAt: now,
      updatedBy: "admin",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingIncentive ? "Edit time-bound incentive" : "Add time-bound incentive"}</DialogTitle>
          <p className="text-[11px] text-muted-foreground">
            Active / upcoming / ended and offer kind (override, bonus, seasonal, volume) are inferred from dates,
            stacking, and travel windows — not stored as separate fields. Volume-threshold fields stay in the data model
            but are not editable in this build.
          </p>
        </DialogHeader>
        <div className="py-2">
          <IncentiveEditorForm
            variant="dialog"
            name={name}
            onNameChange={setName}
            rateValue={rateValue}
            onRateValueChange={setRateValue}
            rateType={rateType}
            onRateTypeChange={setRateType}
            stacksWithBase={stacksWithBase}
            onStacksWithBaseChange={setStacksWithBase}
            bookingStart={bookingStart}
            onBookingStartChange={setBookingStart}
            bookingEnd={bookingEnd}
            onBookingEndChange={setBookingEnd}
            travelStart={travelStart}
            onTravelStartChange={setTravelStart}
            travelEnd={travelEnd}
            onTravelEndChange={setTravelEnd}
            eligibilityNotes={eligibilityNotes}
            onEligibilityNotesChange={setEligibilityNotes}
            scopeAll={scopeAll}
            onScopeAllChange={setScopeAll}
            linkedProductIds={linkedProductIds}
            selectedProducts={selectedProducts}
            onToggleProduct={toggleProduct}
            productLabel={labelForProduct}
            saveError={saveError}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={save}>
            {editingIncentive ? "Save changes" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
