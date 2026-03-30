"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Award, Lock, Plus, Trash2 } from "lucide-react";
import type {
  DirectoryCollectionOption,
  DirectoryPartnerProgram,
  DirectoryProduct,
  DirectoryProductPromotion,
} from "@/types/product-directory";
import type { Team } from "@/types/teams";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import {
  isProgramBookable,
  programDisplayCommissionRate,
  programDisplayName,
  programFilterId,
} from "./productDirectoryCommission";
import type { PartnerPortalAdminSavePayload } from "./productDirectoryLogic";
import { directoryCategoryLabel } from "./productDirectoryVisual";
import { PageSearchField } from "@/components/ui/page-search-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function productsInDirectoryCollection(
  col: DirectoryCollectionOption,
  products: DirectoryProduct[]
): DirectoryProduct[] {
  return products.filter((p) => p.collectionIds.includes(col.id));
}

function collectionScopeForBadge(c: DirectoryCollectionOption): "private" | "mirrors_source" | string {
  return c.scope === "private" ? "private" : (c.teamId ?? TEAM_EVERYONE_ID);
}

type CollectionsTabProps = {
  collections: DirectoryCollectionOption[];
  products: DirectoryProduct[];
  teams: Team[];
  onOpenCollection: (collectionId: string) => void;
};

export function ProductDirectoryCollectionsTab({
  collections,
  products,
  teams,
  onOpenCollection,
}: CollectionsTabProps) {
  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");
  const filteredCollections = useMemo(() => {
    const q = collectionSearchQuery.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (c.description?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [collections, collectionSearchQuery]);

  const orderedFilteredCollections = useMemo(() => {
    const system = filteredCollections.filter((c) => c.isSystem);
    const user = filteredCollections.filter((c) => !c.isSystem);
    return [...system, ...user];
  }, [filteredCollections]);

  const gridClass =
    "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5";

  if (collections.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white/[0.02] px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No collections yet</p>
        <p className="mt-1 text-2xs text-muted-foreground">Create a collection from a product or ask your admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="w-full max-w-md">
        <PageSearchField
          value={collectionSearchQuery}
          onChange={setCollectionSearchQuery}
          placeholder="Search collection…"
          aria-label="Search collections by name or description"
        />
      </div>
      {filteredCollections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-input bg-white/[0.02] px-6 py-12 text-center">
          <p className="text-compact font-medium text-foreground">No collections match your search</p>
          <p className="mt-1 text-xs text-muted-foreground">Try another term, or clear the filter.</p>
          <button
            type="button"
            onClick={() => setCollectionSearchQuery("")}
            className="mt-4 text-xs font-semibold text-brand-cta transition-colors hover:text-[#d4b47e]"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className={gridClass}>
      {orderedFilteredCollections.map((col) => {
        const members = productsInDirectoryCollection(col, products);
        const preview = members.slice(0, 4);
        const placeholders = 4 - preview.length;

        return (
          <button
            key={col.id}
            type="button"
            onClick={() => onOpenCollection(col.id)}
            className="group overflow-hidden rounded-xl border border-border bg-popover text-left transition-colors hover:border-brand-cta/20 hover:bg-[#101018]"
          >
            <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-px bg-inset p-px">
              {preview.map((p) => (
                <div key={p.id} className="relative min-h-0 min-w-0 overflow-hidden bg-[#14141c]">
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
              {placeholders > 0
                ? Array.from({ length: placeholders }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex min-h-0 min-w-0 items-center justify-center bg-white/[0.04] text-[8px] text-muted-foreground/55"
                    >
                      Empty
                    </div>
                  ))
                : null}
            </div>
            <div className="p-2">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <p className="min-w-0 truncate text-xs font-medium text-foreground">{col.name}</p>
                  {col.isSystem ? (
                    <span className="shrink-0 text-[9px] text-muted-foreground bg-white/[0.03] border border-white/[0.04] px-1.5 py-0.5 rounded">
                      Auto
                    </span>
                  ) : null}
                </div>
                {col.description ? (
                  <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-muted-foreground">{col.description}</p>
                ) : null}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground">
                    {members.length} product{members.length !== 1 ? "s" : ""}
                  </span>
                  <ScopeBadge scope={collectionScopeForBadge(col)} teams={teams} />
                </div>
              </div>
            </div>
          </button>
        );
      })}
        </div>
      )}
    </div>
  );
}

export type PartnerPortalRow = {
  key: string;
  program: DirectoryPartnerProgram;
  products: DirectoryProduct[];
};

export function buildPartnerPortalRows(products: DirectoryProduct[]): PartnerPortalRow[] {
  const map = new Map<string, { program: DirectoryPartnerProgram; products: DirectoryProduct[] }>();
  for (const product of products) {
    for (const pp of product.partnerPrograms ?? []) {
      const key = programFilterId(pp);
      const cur = map.get(key);
      if (!cur) {
        map.set(key, { program: pp, products: [product] });
      } else if (!cur.products.some((x) => x.id === product.id)) {
        cur.products.push(product);
      }
    }
  }
  return Array.from(map.values())
    .map((v) => ({ key: programFilterId(v.program), program: v.program, products: v.products }))
    .sort((a, b) => programDisplayName(a.program).localeCompare(programDisplayName(b.program)));
}

function normalizeProgramForCompare(p: DirectoryPartnerProgram) {
  return {
    ...p,
    name: p.name ?? "",
    programName: p.programName ?? "",
    scope: p.scope ?? "",
    commissionRate: p.commissionRate ?? null,
    expiryDate: p.expiryDate ?? null,
    contact: p.contact ?? "",
    amenities: p.amenities ?? "",
    status: p.status ?? "active",
    activePromotions: (p.activePromotions ?? []).map((x) => ({ ...x })),
    amenityTags: p.amenityTags ? [...p.amenityTags] : [],
  };
}

function programChanged(a: DirectoryPartnerProgram, b: DirectoryPartnerProgram): boolean {
  return JSON.stringify(normalizeProgramForCompare(a)) !== JSON.stringify(normalizeProgramForCompare(b));
}

/** True when the in-memory draft differs from saved program + attachment state. */
function partnerPortalEditIsDirty(args: {
  key: string;
  savedProgram: DirectoryPartnerProgram;
  draftProgram: DirectoryPartnerProgram;
  attached: DirectoryProduct[];
  attachedDraftIds: string[];
  productOverrides: Record<string, { commissionRate: number | null; amenities: string }> | undefined;
  useProductSpecificTerms: boolean | undefined;
}): boolean {
  const {
    key,
    savedProgram,
    draftProgram,
    attached,
    attachedDraftIds,
    productOverrides,
    useProductSpecificTerms: varianceNow,
  } = args;
  if (programChanged(savedProgram, draftProgram)) return true;
  const attachedChanged =
    attachedDraftIds.length !== attached.length || attached.some((p) => !attachedDraftIds.includes(p.id));
  if (attachedChanged) return true;
  const varianceInitial =
    new Set(
      attached.map((p) => {
        const match = p.partnerPrograms.find((pp) => programFilterId(pp) === key);
        return `${match?.commissionRate ?? ""}::${match?.amenities ?? ""}`;
      })
    ).size > 1;
  if ((varianceNow ?? false) !== varianceInitial) return true;
  const current = productOverrides ?? {};
  return attached.some((p) => {
    const match = p.partnerPrograms.find((pp) => programFilterId(pp) === key);
    const c = current[p.id];
    if (!c) return false;
    return (match?.commissionRate ?? null) !== c.commissionRate || (match?.amenities ?? "") !== c.amenities;
  });
}

function termsSignature(program: DirectoryPartnerProgram | undefined): string {
  if (!program) return "::";
  return `${program.commissionRate ?? ""}::${(program.amenities ?? "").trim()}`;
}

function productMatchesPartnerAttachSearch(product: DirectoryProduct, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  const blob = [
    product.name,
    product.location,
    product.city,
    product.country,
    product.region,
    directoryCategoryLabel(product.type),
    product.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return blob.includes(q);
}

function daysFromProgramExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const end = new Date(expiryDate);
  if (Number.isNaN(end.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

type ExpiryUrgency = "none" | "active" | "soon" | "ended";

function programExpiryUrgency(bookable: boolean, expiryDate: string | null): ExpiryUrgency {
  if (!bookable) return "ended";
  const d = daysFromProgramExpiry(expiryDate);
  if (d == null) return "none";
  if (d < 0) return "ended";
  if (d <= 60) return "soon";
  return "active";
}

type PartnerPortalExpiryFilter = "all" | "soon" | "active" | "ended" | "no_date";

const PARTNER_PORTAL_EXPIRY_FILTER_OPTIONS: { id: PartnerPortalExpiryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "soon", label: "Renewal soon" },
  { id: "active", label: "Active" },
  { id: "ended", label: "Ended" },
  { id: "no_date", label: "No date" },
];

function programMatchesPortalExpiryFilter(
  program: DirectoryPartnerProgram,
  filter: PartnerPortalExpiryFilter
): boolean {
  if (filter === "all") return true;
  const bookable = isProgramBookable(program);
  const urgency = programExpiryUrgency(bookable, program.expiryDate ?? null);
  if (filter === "soon") return urgency === "soon";
  if (filter === "active") return urgency === "active";
  if (filter === "ended") return urgency === "ended";
  if (filter === "no_date") return urgency === "none";
  return true;
}

function PortalSectionTitle({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(201,169,110,0.14)] text-2xs font-bold tabular-nums text-brand-cta"
        aria-hidden
      >
        {step}
      </span>
      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{children}</h4>
    </div>
  );
}

function newPartnerPortalIncentive(baseCommission: number | null): DirectoryProductPromotion {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const bookEnd = new Date(now);
  bookEnd.setMonth(bookEnd.getMonth() + 3);
  const travelEnd = new Date(now);
  travelEnd.setMonth(travelEnd.getMonth() + 6);
  const rate =
    baseCommission != null && Number.isFinite(baseCommission) && baseCommission >= 0 ? baseCommission : 0;
  return {
    id: `incentive-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    effectiveRate: rate,
    bookingStart: `${start}T00:00:00.000Z`,
    bookingEnd: `${bookEnd.toISOString().slice(0, 10)}T00:00:00.000Z`,
    travelStart: `${start}T00:00:00.000Z`,
    travelEnd: `${travelEnd.toISOString().slice(0, 10)}T00:00:00.000Z`,
    title: "",
    details: "",
  };
}

function partnerProgramCardDomId(programKey: string) {
  return `partner-program-${programKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

type PartnerPortalTabProps = {
  products: DirectoryProduct[];
  teams: Team[];
  canViewCommissions: boolean;
  isAdmin?: boolean;
  onSelectProduct: (productId: string) => void;
  onAdminSaveProgram?: (programKey: string, payload: PartnerPortalAdminSavePayload) => boolean;
  /** Fired when unsaved partner-program edit state changes (for tab guards). */
  onDirtyChange?: (dirty: boolean) => void;
};

export function ProductDirectoryPartnerPortalTab({
  products,
  teams,
  canViewCommissions,
  isAdmin = false,
  onSelectProduct,
  onAdminSaveProgram,
  onDirtyChange,
}: PartnerPortalTabProps) {
  const searchParams = useSearchParams();
  const rows = buildPartnerPortalRows(products);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DirectoryPartnerProgram>>({});
  const [attachedDraftIds, setAttachedDraftIds] = useState<Record<string, string[]>>({});
  const [useProductSpecificTerms, setUseProductSpecificTerms] = useState<Record<string, boolean>>({});
  const [productOverrides, setProductOverrides] = useState<
    Record<string, Record<string, { commissionRate: number | null; amenities: string }>>
  >({});
  const [attachProductSearchQuery, setAttachProductSearchQuery] = useState("");
  const [portalSearchQuery, setPortalSearchQuery] = useState("");
  const [portalExpiryFilter, setPortalExpiryFilter] = useState<PartnerPortalExpiryFilter>("all");
  const [brokenProductImages, setBrokenProductImages] = useState<Record<string, boolean>>({});

  const filteredRows = useMemo(() => {
    const q = portalSearchQuery.trim().toLowerCase();
    const matches = rows.filter(({ key, program, products: attached }) => {
      const effective = drafts[key] ?? program;
      if (!programMatchesPortalExpiryFilter(effective, portalExpiryFilter)) return false;
      if (!q) return true;
      if (programDisplayName(effective).toLowerCase().includes(q)) return true;
      return attached.some((p) => p.name.toLowerCase().includes(q));
    });
    if (!editingKey) return matches;
    const editingRow = rows.find((r) => r.key === editingKey);
    if (!editingRow || matches.some((r) => r.key === editingKey)) return matches;
    return [editingRow, ...matches];
  }, [rows, portalSearchQuery, portalExpiryFilter, editingKey, drafts]);

  const [discardDialog, setDiscardDialog] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    setAttachProductSearchQuery("");
  }, [editingKey]);

  const requestEndEditing = useCallback((dirty: boolean) => {
    if (!dirty) {
      setEditingKey(null);
      return;
    }
    setDiscardDialog({
      title: "Discard changes?",
      description: "Your edits to this program will be lost. This cannot be undone.",
      confirmLabel: "Discard changes",
      onConfirm: () => {
        setEditingKey(null);
        setDiscardDialog(null);
      },
    });
  }, []);

  const isCurrentEditDirty = useCallback((): boolean => {
    if (!editingKey) return false;
    const row = rows.find((r) => r.key === editingKey);
    if (!row) return false;
    const display = drafts[editingKey] ?? row.program;
    const attachedDraft = attachedDraftIds[editingKey] ?? row.products.map((p) => p.id);
    return partnerPortalEditIsDirty({
      key: editingKey,
      savedProgram: row.program,
      draftProgram: display,
      attached: row.products,
      attachedDraftIds: attachedDraft,
      productOverrides: productOverrides[editingKey],
      useProductSpecificTerms: useProductSpecificTerms[editingKey],
    });
  }, [editingKey, rows, drafts, attachedDraftIds, productOverrides, useProductSpecificTerms]);

  useEffect(() => {
    if (!editingKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!rows.some((r) => r.key === editingKey)) {
        setEditingKey(null);
        return;
      }
      requestEndEditing(isCurrentEditDirty());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingKey, rows, requestEndEditing, isCurrentEditDirty]);

  const applyBeginEdit = useCallback(
    (key: string, program: DirectoryPartnerProgram, attached: DirectoryProduct[]) => {
      const attachedIds = attached.map((p) => p.id);
      const overrides: Record<string, { commissionRate: number | null; amenities: string }> = {};
      attached.forEach((p) => {
        const match = p.partnerPrograms.find((pp) => programFilterId(pp) === key);
        overrides[p.id] = {
          commissionRate: match?.commissionRate ?? null,
          amenities: match?.amenities ?? "",
        };
      });
      const hasVariance =
        new Set(Object.values(overrides).map((x) => String(x.commissionRate ?? ""))).size > 1 ||
        new Set(Object.values(overrides).map((x) => x.amenities.trim())).size > 1;

      setDrafts((prev) => ({
        ...prev,
        [key]: {
          ...program,
          activePromotions: program.activePromotions.map((x) => ({ ...x })),
          amenityTags: program.amenityTags ? [...program.amenityTags] : [],
        },
      }));
      setAttachedDraftIds((prev) => ({ ...prev, [key]: attachedIds }));
      setProductOverrides((prev) => ({ ...prev, [key]: overrides }));
      setUseProductSpecificTerms((prev) => ({ ...prev, [key]: hasVariance }));
      setEditingKey(key);
    },
    []
  );

  const beginEdit = useCallback(
    (key: string, program: DirectoryPartnerProgram, attached: DirectoryProduct[]) => {
      if (editingKey && editingKey !== key && isCurrentEditDirty()) {
        setDiscardDialog({
          title: "Switch programs?",
          description:
            "You have unsaved changes in the program you’re editing. Discard them and open this program instead?",
          confirmLabel: "Discard and switch",
          onConfirm: () => {
            setDiscardDialog(null);
            applyBeginEdit(key, program, attached);
          },
        });
        return;
      }
      applyBeginEdit(key, program, attached);
    },
    [editingKey, isCurrentEditDirty, applyBeginEdit]
  );

  const dirtyRef = useRef(false);
  useLayoutEffect(() => {
    if (!editingKey) {
      dirtyRef.current = false;
      return;
    }
    const row = rows.find((r) => r.key === editingKey);
    if (!row) {
      dirtyRef.current = false;
      return;
    }
    const display = drafts[editingKey] ?? row.program;
    const attachedDraft = attachedDraftIds[editingKey] ?? row.products.map((p) => p.id);
    dirtyRef.current = partnerPortalEditIsDirty({
      key: editingKey,
      savedProgram: row.program,
      draftProgram: display,
      attached: row.products,
      attachedDraftIds: attachedDraft,
      productOverrides: productOverrides[editingKey],
      useProductSpecificTerms: useProductSpecificTerms[editingKey],
    });
  }, [
    editingKey,
    rows,
    drafts,
    attachedDraftIds,
    productOverrides,
    useProductSpecificTerms,
  ]);

  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, []);

  useEffect(() => {
    if (!onDirtyChange) return;
    if (!editingKey) {
      onDirtyChange(false);
      return;
    }
    const row = rows.find((r) => r.key === editingKey);
    if (!row) {
      onDirtyChange(false);
      return;
    }
    const display = drafts[editingKey] ?? row.program;
    const attachedDraft = attachedDraftIds[editingKey] ?? row.products.map((p) => p.id);
    const dirty = partnerPortalEditIsDirty({
      key: editingKey,
      savedProgram: row.program,
      draftProgram: display,
      attached: row.products,
      attachedDraftIds: attachedDraft,
      productOverrides: productOverrides[editingKey],
      useProductSpecificTerms: useProductSpecificTerms[editingKey],
    });
    onDirtyChange(dirty);
  }, [
    onDirtyChange,
    editingKey,
    rows,
    drafts,
    attachedDraftIds,
    productOverrides,
    useProductSpecificTerms,
  ]);

  const programScrollKey = searchParams.get("program");
  useEffect(() => {
    if (!programScrollKey) return;
    const id = partnerProgramCardDomId(programScrollKey);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [programScrollKey, filteredRows.length]);

  const discardDialogEl = (
    <Dialog
      open={!!discardDialog}
      onOpenChange={(open) => {
        if (!open) setDiscardDialog(null);
      }}
    >
      <DialogContent className="border-input bg-popover sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-foreground">{discardDialog?.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{discardDialog?.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setDiscardDialog(null)}>
            Stay
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => discardDialog?.onConfirm()}
          >
            {discardDialog?.confirmLabel ?? "Discard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (rows.length === 0) {
    return (
      <>
        <div className="rounded-xl border border-border bg-white/[0.02] px-6 py-12 text-center">
          <Award className="mx-auto mb-3 h-8 w-8 text-muted-foreground/65" aria-hidden />
          <p className="text-compact font-medium text-foreground">No partner programs yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Programs show up here when at least one product lists that partner agreement. Add or edit partner programs from
            each product’s detail panel under Partner programs.
          </p>
        </div>
        {discardDialogEl}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <p className="inline-flex w-fit max-w-full items-center gap-2 rounded-lg border border-border bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0 text-[#5C5852]" aria-hidden />
          Read-only for advisors. Ask an agency admin to update programs.
        </p>
      )}
      <div className="flex flex-col gap-3">
        <PageSearchField
          value={portalSearchQuery}
          onChange={setPortalSearchQuery}
          placeholder="Search partner programs…"
          aria-label="Search partner programs or linked properties"
        />
        <div className="-mx-1 flex w-full min-w-0 items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {PARTNER_PORTAL_EXPIRY_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPortalExpiryFilter(opt.id)}
              className={cn(
                "flex shrink-0 items-center rounded-full border px-2.5 py-1 text-2xs whitespace-nowrap transition-colors",
                portalExpiryFilter === opt.id
                  ? "border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
                  : "border-transparent text-muted-foreground hover:text-muted-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-input bg-white/[0.02] px-6 py-12 text-center">
          <p className="text-compact font-medium text-foreground">No programs match</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try another search, or adjust the expiry filter to see more programs.
          </p>
          <button
            type="button"
            onClick={() => {
              setPortalSearchQuery("");
              setPortalExpiryFilter("all");
            }}
            className="mt-4 text-xs font-semibold text-brand-cta transition-colors hover:text-[#d4b47e]"
          >
            Clear search and expiry filter
          </button>
        </div>
      ) : (
        <div className="space-y-5">
      {filteredRows.map(({ key, program, products: attached }) => {
        const display = editingKey === key ? drafts[key] ?? program : program;
        const bookable = isProgramBookable(display);
        const displayRate = programDisplayCommissionRate(display);
        const isEditing = editingKey === key;
        const attachedProgramMatches = attached
          .map((p) => p.partnerPrograms.find((pp) => programFilterId(pp) === key))
          .filter((x): x is DirectoryPartnerProgram => Boolean(x));
        const sigCounts = new Map<string, number>();
        attachedProgramMatches.forEach((pp) => {
          const sig = termsSignature(pp);
          sigCounts.set(sig, (sigCounts.get(sig) ?? 0) + 1);
        });
        const hasProductVariance = sigCounts.size > 1;
        const baselineSig =
          Array.from(sigCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? termsSignature(program);
        const attachedDraft = attachedDraftIds[key] ?? attached.map((p) => p.id);
        const varianceNow = useProductSpecificTerms[key] ?? false;
        const hasUnsaved = isEditing
          ? partnerPortalEditIsDirty({
              key,
              savedProgram: program,
              draftProgram: display,
              attached,
              attachedDraftIds: attachedDraft,
              productOverrides: productOverrides[key],
              useProductSpecificTerms: useProductSpecificTerms[key],
            })
          : false;
        const urgency = programExpiryUrgency(bookable, display.expiryDate ?? null);
        const urgencyPill =
          urgency === "none"
            ? null
            : urgency === "active"
              ? { label: "Agreement active", className: "bg-[rgba(91,138,110,0.12)] text-[#5B8A6E]" }
              : urgency === "soon"
                ? { label: "Renewal soon", className: "bg-[rgba(184,151,110,0.12)] text-[#B8976E]" }
                : { label: "Inactive or ended", className: "bg-[rgba(166,107,107,0.12)] text-[#A66B6B]" };

        return (
          <div
            key={key}
            id={partnerProgramCardDomId(key)}
            className={cn(
              "scroll-mt-4 overflow-hidden rounded-2xl border bg-popover transition-all duration-200",
              isEditing
                ? "border-[rgba(201,169,110,0.28)] shadow-xl shadow-black/50 ring-1 ring-[rgba(201,169,110,0.14)]"
                : "border-border hover:border-white/[0.10] hover:shadow-lg hover:shadow-black/25"
            )}
          >
            <div className="border-b border-white/[0.05] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Award className="h-4 w-4 shrink-0 text-brand-cta" aria-hidden />
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {programDisplayName(display)}
                    </h3>
                    {urgencyPill ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wide",
                          urgencyPill.className
                        )}
                      >
                        {urgencyPill.label}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-border bg-white/[0.03] px-2 py-0.5 text-[9px] font-medium tabular-nums text-muted-foreground">
                      {attached.length} propert{attached.length === 1 ? "y" : "ies"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs text-muted-foreground">
                    {display.scope === "enable" ? (
                      <span className="rounded bg-[rgba(91,138,110,0.12)] px-1.5 py-0.5 text-[8px] text-[#5B8A6E]">
                        Enable
                      </span>
                    ) : display.scope ? (
                      <ScopeBadge scope={display.scope} teams={teams} />
                    ) : null}
                    {canViewCommissions && displayRate != null ? (
                      <span className="font-semibold text-[#B8976E]">Up to {displayRate}%</span>
                    ) : null}
                    {display.expiryDate ? (
                      <span className="text-muted-foreground">
                        Until{" "}
                        {new Date(display.expiryDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    ) : null}
                    {display.contact ? <span className="text-muted-foreground">· {display.contact}</span> : null}
                    {hasProductVariance ? (
                      <span className="text-[8px] font-normal normal-case tracking-normal text-muted-foreground">
                        · terms vary by product
                      </span>
                    ) : null}
                  </div>
                  {display.amenities ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{display.amenities}</p>
                  ) : null}
                  {(display.lastEditedAt || display.lastEditedByName) ? (
                    <p className="mt-1 text-[9px] text-muted-foreground">
                      Last edited{" "}
                      {display.lastEditedByName ? `by ${display.lastEditedByName}` : ""}
                      {display.lastEditedAt
                        ? ` · ${new Date(display.lastEditedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                {isAdmin ? (
                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:ml-auto sm:items-end">
                    {!isEditing ? (
                      <button
                        type="button"
                        className="rounded-lg border border-brand-cta/35 bg-[rgba(201,169,110,0.08)] px-3 py-1.5 text-xs font-medium text-brand-cta transition-colors hover:bg-[rgba(201,169,110,0.14)]"
                        onClick={() => beginEdit(key, program, attached)}
                      >
                        Edit program
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {hasUnsaved ? (
                          <span className="order-last w-full text-right text-2xs text-amber-200/90 sm:order-none sm:w-auto sm:text-left">
                            Unsaved changes — Save or Cancel to leave
                          </span>
                        ) : (
                          <span className="order-last w-full text-right text-2xs text-muted-foreground sm:order-none sm:w-auto sm:text-left">
                            No changes yet
                          </span>
                        )}
                        <button
                          type="button"
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                            hasUnsaved
                              ? "bg-brand-cta text-[#08080c] shadow-sm hover:bg-[#d4b47e]"
                              : "cursor-not-allowed bg-white/[0.04] text-muted-foreground/65 opacity-50"
                          )}
                          onClick={() => {
                            if (!onAdminSaveProgram) return;
                            const ok = onAdminSaveProgram(key, {
                              program: drafts[key] ?? program,
                              attachedProductIds: attachedDraft,
                              useProductSpecificTerms: varianceNow,
                              productOverrides: productOverrides[key] ?? {},
                            });
                            if (ok) setEditingKey(null);
                          }}
                          disabled={!hasUnsaved}
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-input bg-transparent px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-foreground"
                          onClick={() => requestEndEditing(hasUnsaved)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {isEditing ? (
                <div className="mt-5 space-y-6 rounded-xl border border-[rgba(201,169,110,0.22)] bg-[rgba(201,169,110,0.06)] p-4 sm:p-5">
                  <PortalSectionTitle step={1}>Program details</PortalSectionTitle>
                  <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-2xs font-medium text-muted-foreground">Program name</span>
                    <input
                      value={drafts[key]?.programName ?? drafts[key]?.name ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], programName: e.target.value, name: e.target.value },
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-inset px-3 text-sm text-foreground outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-2xs font-medium text-muted-foreground">Commission %</span>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={drafts[key]?.commissionRate ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], commissionRate: e.target.value === "" ? null : Number(e.target.value) },
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-inset px-3 text-sm text-foreground outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-2xs font-medium text-muted-foreground">Status</span>
                    <select
                      value={drafts[key]?.status ?? "active"}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], status: e.target.value as "active" | "inactive" },
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-inset px-3 text-sm text-foreground outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-2xs font-medium text-muted-foreground">Scope</span>
                    <select
                      value={drafts[key]?.scope === "enable" ? "enable" : (drafts[key]?.scope ?? "enable")}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], scope: e.target.value === "enable" ? "enable" : e.target.value },
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-inset px-3 text-sm text-foreground outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    >
                      <option value="enable">Enable</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-2xs font-medium text-muted-foreground">Expiry</span>
                    <input
                      type="date"
                      value={(drafts[key]?.expiryDate ?? "").slice(0, 10)}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], expiryDate: e.target.value ? `${e.target.value}T12:00:00.000Z` : null },
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-inset px-3 text-sm text-foreground outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-2xs font-medium text-muted-foreground">Contact</span>
                    <input
                      value={drafts[key]?.contact ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], contact: e.target.value } }))
                      }
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-inset px-3 text-sm text-foreground outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-2xs font-medium text-muted-foreground">Amenities</span>
                    <textarea
                      rows={2}
                      value={drafts[key]?.amenities ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], amenities: e.target.value } }))
                      }
                      className="w-full resize-none rounded-lg border border-white/[0.14] bg-inset px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    />
                  </label>
                  </div>

                  <PortalSectionTitle step={2}>Linked properties</PortalSectionTitle>
                  <div className="rounded-lg border border-border bg-inset/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-foreground">Products on this program</p>
                      <label className="flex items-center gap-2 text-2xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={useProductSpecificTerms[key] ?? false}
                          onChange={(e) =>
                            setUseProductSpecificTerms((prev) => ({ ...prev, [key]: e.target.checked }))
                          }
                          className="checkbox-on-dark"
                        />
                        Commission & amenities per product
                      </label>
                    </div>
                    {(useProductSpecificTerms[key] ?? false) ? (
                      <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
                        Each attached product can have its own commission and amenities; global fields above stay as defaults.
                      </p>
                    ) : (
                      <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
                        Turn on when commission or amenities differ between properties on this program.
                      </p>
                    )}
                    <div className="mt-2">
                      <PageSearchField
                        variant="compact"
                        value={attachProductSearchQuery}
                        onChange={setAttachProductSearchQuery}
                        placeholder="Search products to attach…"
                        aria-label="Search products to attach to this program"
                      />
                    </div>
                    <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto pr-1">
                      {(() => {
                        const draftIdsForAttach = attachedDraftIds[key] ?? attached.map((x) => x.id);
                        const attachListProducts = [...products]
                          .filter(
                            (p) =>
                              draftIdsForAttach.includes(p.id) ||
                              productMatchesPartnerAttachSearch(p, attachProductSearchQuery)
                          )
                          .sort((a, b) => {
                            const ca = draftIdsForAttach.includes(a.id) ? 0 : 1;
                            const cb = draftIdsForAttach.includes(b.id) ? 0 : 1;
                            if (ca !== cb) return ca - cb;
                            return a.name.localeCompare(b.name);
                          });
                        if (attachListProducts.length === 0) {
                          return (
                            <p className="py-3 text-center text-2xs text-muted-foreground">
                              No products match this search.
                            </p>
                          );
                        }
                        return attachListProducts.map((p) => {
                        const on = (attachedDraftIds[key] ?? attached.map((x) => x.id)).includes(p.id);
                        const override = productOverrides[key]?.[p.id] ?? {
                          commissionRate: display.commissionRate ?? null,
                          amenities: display.amenities ?? "",
                        };
                        const matchedProgram = p.partnerPrograms.find((pp) => programFilterId(pp) === key);
                        const isCustomInView = termsSignature(matchedProgram) !== baselineSig;
                        return (
                          <div key={p.id} className="rounded-md border border-border bg-inset p-2">
                            <div className="flex items-center justify-between gap-2">
                              <label className="flex min-w-0 items-center gap-2 text-2xs text-[#C8C0B8]">
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={(e) =>
                                    setAttachedDraftIds((prev) => {
                                      const base = prev[key] ?? attached.map((x) => x.id);
                                      return {
                                        ...prev,
                                        [key]: e.target.checked
                                          ? Array.from(new Set([...base, p.id]))
                                          : base.filter((id) => id !== p.id),
                                      };
                                    })
                                  }
                                  className="checkbox-on-dark"
                                />
                                <span className="truncate">{p.name}</span>
                              </label>
                              <div className="flex items-center gap-1.5">
                                {on && (useProductSpecificTerms[key] ?? false) ? (
                                  <span
                                    className="text-[7px] font-medium uppercase tracking-[0.14em] text-[#A38F6E]"
                                    title="Per-product overrides enabled"
                                  >
                                    per product
                                  </span>
                                ) : isCustomInView && on ? (
                                  <span
                                    className="text-[7px] font-medium uppercase tracking-[0.14em] text-[#A38F6E]"
                                    title="Terms differ from program default"
                                  >
                                    varies
                                  </span>
                                ) : null}
                                <span className="text-[9px] text-muted-foreground">{directoryCategoryLabel(p.type)}</span>
                              </div>
                            </div>
                            {on && (useProductSpecificTerms[key] ?? false) ? (
                              <div className="mt-2 grid grid-cols-2 gap-1.5">
                                <p className="col-span-2 border-l border-brand-cta/20 pl-2 text-[9px] leading-snug text-muted-foreground">
                                  Only for this property in the program.
                                </p>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.1"
                                  value={override.commissionRate ?? ""}
                                  onChange={(e) =>
                                    setProductOverrides((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...(prev[key] ?? {}),
                                        [p.id]: {
                                          ...(prev[key]?.[p.id] ?? { amenities: display.amenities ?? "" }),
                                          commissionRate: e.target.value === "" ? null : Number(e.target.value),
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="Commission %"
                                  className="h-8 rounded border border-border bg-inset px-2 text-2xs text-foreground outline-none"
                                />
                                <input
                                  value={override.amenities}
                                  onChange={(e) =>
                                    setProductOverrides((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...(prev[key] ?? {}),
                                        [p.id]: {
                                          ...(prev[key]?.[p.id] ?? {
                                            commissionRate: display.commissionRate ?? null,
                                          }),
                                          amenities: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="Amenities override"
                                  className="h-8 rounded border border-border bg-inset px-2 text-2xs text-foreground outline-none"
                                />
                              </div>
                            ) : null}
                          </div>
                        );
                      });
                      })()}
                    </div>
                  </div>
                  <PortalSectionTitle step={3}>Time-bound incentives</PortalSectionTitle>
                  <div className="rounded-lg border border-amber-400/25 bg-amber-400/[0.07] p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="max-w-md text-2xs leading-relaxed text-muted-foreground">
                        Optional bonuses or rate lifts. Windows should fall on or before the program expiry above.
                      </p>
                      <button
                        type="button"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-400/35 bg-amber-400/10 px-2.5 py-1.5 text-2xs font-medium text-amber-200 transition-colors hover:bg-amber-400/15"
                        onClick={() =>
                          setDrafts((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              activePromotions: [
                                ...(prev[key]?.activePromotions ?? []),
                                newPartnerPortalIncentive(prev[key]?.commissionRate ?? null),
                              ],
                            },
                          }))
                        }
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        Add incentive
                      </button>
                    </div>
                    {(display.activePromotions?.length ?? 0) === 0 ? (
                      <p className="rounded-md border border-dashed border-border bg-inset/50 px-3 py-3 text-center text-2xs text-muted-foreground">
                        No incentives yet. Use Add incentive to capture title, details, effective %, and date windows.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {display.activePromotions.map((pr) => (
                          <div
                            key={pr.id}
                            className="rounded-md border border-border bg-inset px-2.5 py-2"
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                                Incentive
                              </span>
                              <button
                                type="button"
                                className="rounded-md border border-border p-1 text-muted-foreground transition-colors hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
                                aria-label="Remove incentive"
                                onClick={() =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [key]: {
                                      ...prev[key],
                                      activePromotions: (prev[key]?.activePromotions ?? []).filter((x) => x.id !== pr.id),
                                    },
                                  }))
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            </div>
                            <label className="mb-2 block">
                              <span className="mb-0.5 block text-[9px] text-muted-foreground">Title (optional)</span>
                              <input
                                value={pr.title ?? ""}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [key]: {
                                      ...prev[key],
                                      activePromotions: (prev[key]?.activePromotions ?? []).map((x) =>
                                        x.id === pr.id ? { ...x, title: e.target.value } : x
                                      ),
                                    },
                                  }))
                                }
                                placeholder="e.g. Q2 booking bonus"
                                className="h-8 w-full rounded border border-border bg-inset px-2 text-xs text-foreground outline-none placeholder:text-muted-foreground/65"
                              />
                            </label>
                            <label className="mb-2 block">
                              <span className="mb-0.5 block text-[9px] text-muted-foreground">Details</span>
                              <textarea
                                rows={2}
                                value={pr.details ?? ""}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [key]: {
                                      ...prev[key],
                                      activePromotions: (prev[key]?.activePromotions ?? []).map((x) =>
                                        x.id === pr.id ? { ...x, details: e.target.value } : x
                                      ),
                                    },
                                  }))
                                }
                                placeholder="Stacking rules, eligible room types, advisor notes…"
                                className="w-full resize-none rounded border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/65"
                              />
                            </label>
                            <div className="grid gap-2 sm:grid-cols-3">
                              <label className="flex items-center gap-1 text-2xs text-muted-foreground">
                                Effective rate
                                <input
                                  type="number"
                                  min={0}
                                  step="0.1"
                                  value={pr.effectiveRate}
                                  onChange={(e) =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...prev[key],
                                        activePromotions: (prev[key]?.activePromotions ?? []).map((x) =>
                                          x.id === pr.id
                                            ? { ...x, effectiveRate: Math.max(0, Number(e.target.value) || 0) }
                                            : x
                                        ),
                                      },
                                    }))
                                  }
                                  className="w-16 rounded border border-border bg-inset px-1 py-0.5 text-2xs text-foreground outline-none"
                                />
                                %
                              </label>
                              <label className="text-[9px] text-muted-foreground">
                                Booking window
                                <div className="mt-0.5 flex items-center gap-1">
                                  <input
                                    type="date"
                                    value={pr.bookingStart.slice(0, 10)}
                                    onChange={(e) =>
                                      setDrafts((prev) => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          activePromotions: (prev[key]?.activePromotions ?? []).map((x) =>
                                            x.id === pr.id ? { ...x, bookingStart: `${e.target.value}T00:00:00.000Z` } : x
                                          ),
                                        },
                                      }))
                                    }
                                    className="h-7 w-full rounded border border-border bg-inset px-1.5 text-2xs text-foreground outline-none"
                                  />
                                  <span>→</span>
                                  <input
                                    type="date"
                                    value={pr.bookingEnd.slice(0, 10)}
                                    onChange={(e) =>
                                      setDrafts((prev) => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          activePromotions: (prev[key]?.activePromotions ?? []).map((x) =>
                                            x.id === pr.id ? { ...x, bookingEnd: `${e.target.value}T00:00:00.000Z` } : x
                                          ),
                                        },
                                      }))
                                    }
                                    className="h-7 w-full rounded border border-border bg-inset px-1.5 text-2xs text-foreground outline-none"
                                  />
                                </div>
                              </label>
                              <label className="text-[9px] text-muted-foreground">
                                Travel window
                                <div className="mt-0.5 flex items-center gap-1">
                                  <input
                                    type="date"
                                    value={pr.travelStart.slice(0, 10)}
                                    onChange={(e) =>
                                      setDrafts((prev) => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          activePromotions: (prev[key]?.activePromotions ?? []).map((x) =>
                                            x.id === pr.id ? { ...x, travelStart: `${e.target.value}T00:00:00.000Z` } : x
                                          ),
                                        },
                                      }))
                                    }
                                    className="h-7 w-full rounded border border-border bg-inset px-1.5 text-2xs text-foreground outline-none"
                                  />
                                  <span>→</span>
                                  <input
                                    type="date"
                                    value={pr.travelEnd.slice(0, 10)}
                                    onChange={(e) =>
                                      setDrafts((prev) => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          activePromotions: (prev[key]?.activePromotions ?? []).map((x) =>
                                            x.id === pr.id ? { ...x, travelEnd: `${e.target.value}T00:00:00.000Z` } : x
                                          ),
                                        },
                                      }))
                                    }
                                    className="h-7 w-full rounded border border-border bg-inset px-1.5 text-2xs text-foreground outline-none"
                                  />
                                </div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {(display.activePromotions?.length ?? 0) > 0 ? (
                <div className="mt-3 rounded-xl border border-[rgba(201,169,110,0.12)] bg-[rgba(201,169,110,0.04)] p-3">
                  <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-[#B8976E]">
                    Temporary incentives
                  </p>
                  <ul className="space-y-3">
                    {display.activePromotions.map((pr) => (
                      <li
                        key={pr.id}
                        className="border-b border-white/[0.04] pb-3 text-2xs last:border-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold text-brand-cta">{pr.effectiveRate}% effective</span>
                          <span className="text-muted-foreground">
                            Book {new Date(pr.bookingStart).toLocaleDateString()} –{" "}
                            {new Date(pr.bookingEnd).toLocaleDateString()} · Travel{" "}
                            {new Date(pr.travelStart).toLocaleDateString()} –{" "}
                            {new Date(pr.travelEnd).toLocaleDateString()}
                          </span>
                        </div>
                        {pr.title?.trim() ? (
                          <p className="mt-1 text-xs font-medium text-foreground">{pr.title.trim()}</p>
                        ) : null}
                        {pr.details?.trim() ? (
                          <p className="mt-1 whitespace-pre-wrap text-2xs leading-relaxed text-muted-foreground">
                            {pr.details.trim()}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="border-t border-white/[0.05] bg-inset/35 px-4 py-4 sm:px-5">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground/65">
                    Properties on this program
                  </p>
                  <p className="mt-0.5 text-2xs text-muted-foreground">Select a card to open full product details</p>
                </div>
                <span className="text-2xs font-medium tabular-nums text-muted-foreground">{attached.length} linked</span>
              </div>
              {attached.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                  No products linked yet. Admins can attach them while editing this program.
                </p>
              ) : (
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15">
                {attached.map((p) => (
                  (() => {
                    const match = p.partnerPrograms.find((pp) => programFilterId(pp) === key);
                    const isCustom = termsSignature(match) !== baselineSig;
                    const placeLine =
                      p.city && p.country ? `${p.city}, ${p.country}` : p.location;
                    return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectProduct(p.id)}
                    aria-label={`Open ${p.name} in product directory`}
                    className={cn(
                      "group flex h-[164px] w-[118px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-inset text-left transition-all duration-200",
                      isCustom
                        ? "border-[rgba(201,169,110,0.22)] ring-1 ring-inset ring-[rgba(201,169,110,0.12)]"
                        : "border-white/[0.07]",
                      "hover:-translate-y-0.5 hover:border-brand-cta/35 hover:shadow-md hover:shadow-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,169,110,0.45)]"
                    )}
                  >
                    {/* Fixed 118×76 image box — img fills edge-to-edge, no letterboxing */}
                    <div className="relative h-[76px] w-full shrink-0 overflow-hidden bg-[#14141c]">
                      {brokenProductImages[p.id] ? (
                        <div className="flex h-full w-full items-center justify-center bg-[#1a1a22] px-1 text-center text-[8px] font-medium leading-tight text-muted-foreground/65">
                          Image unavailable
                        </div>
                      ) : (
                        <>
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
                            loading="lazy"
                            onError={() =>
                              setBrokenProductImages((prev) => (prev[p.id] ? prev : { ...prev, [p.id]: true }))
                            }
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08080c]/70 via-transparent to-transparent opacity-80" />
                        </>
                      )}
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col gap-0.5 p-2 pt-1.5">
                      <p className="line-clamp-2 text-2xs font-medium leading-snug text-foreground">{p.name}</p>
                      {placeLine ? (
                        <p className="line-clamp-1 text-[8px] leading-tight text-muted-foreground">{placeLine}</p>
                      ) : null}
                      <div className="mt-auto flex flex-wrap items-center gap-x-1 gap-y-0.5">
                        <span className="text-[8px] text-muted-foreground">{directoryCategoryLabel(p.type)}</span>
                        {isCustom ? (
                          <span className="rounded-sm bg-[rgba(201,169,110,0.1)] px-1 py-px text-[7px] font-semibold uppercase tracking-wide text-[#B8976E]">
                            Custom
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                    );
                  })()
                ))}
              </div>
              )}
            </div>
          </div>
        );
      })}
        </div>
      )}
      {discardDialogEl}
    </div>
  );
}
