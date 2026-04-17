"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Award, Check, ChevronDown, Flame, Lock, Plus, Share2, Trash2 } from "lucide-react";
import type {
  DirectoryAmenityTag,
  DirectoryCollectionOption,
  DirectoryPartnerProgram,
  DirectoryProduct,
  DirectoryProductIncentive,
} from "@/types/product-directory";
import { directoryProductTypeShortLabel } from "@/components/products/directoryProductTypeHelpers";
import ProductDirectoryAmenitiesDropdown from "./ProductDirectoryAmenitiesDropdown";
import { AMENITY_LABELS } from "./productDirectoryFilterConfig";
import type { Team } from "@/types/teams";
import { cn } from "@/lib/utils";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import {
  getActiveIncentiveOfferCount,
  isProgramBookable,
  programDisplayCommissionRate,
  programDisplayName,
  programFilterId,
} from "./productDirectoryCommission";
import type { PartnerProgramsAdminSavePayload } from "./productDirectoryLogic";
import { productMatchesPartnerAttachSearch } from "./productDirectoryLogic";
import type { VolumeMetric } from "@/types/partner-programs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/contexts/ToastContext";

type PartnerProgramsProductOverrideRow = {
  commissionRate: number | null;
  amenities: string;
  amenityTags: DirectoryAmenityTag[];
};

function amenityTagsSig(tags: DirectoryAmenityTag[] | undefined): string {
  return [...(tags ?? [])].sort().join(",");
}

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
  isAdmin: boolean;
  canDeleteCollection: (c: DirectoryCollectionOption) => boolean;
  onShareCollectionWithTeam: (collectionId: string, teamId: string) => void;
  onDeleteCollection: (collectionId: string) => void;
  onOpenCollection: (collectionId: string) => void;
  onNewCollection: () => void;
};

export function ProductDirectoryCollectionsTab({
  collections,
  products,
  teams,
  isAdmin,
  canDeleteCollection,
  onShareCollectionWithTeam,
  onDeleteCollection,
  onOpenCollection,
  onNewCollection,
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
        <p className="mt-1 text-2xs text-muted-foreground">Create a collection to organise products, or ask your admin.</p>
        <Button type="button" variant="toolbarAccent" size="sm" className="mt-4" onClick={onNewCollection}>
          <Plus className="h-3.5 w-3.5" />
          Add collection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 basis-[min(100%,20rem)]">
          <PageSearchField
            value={collectionSearchQuery}
            onChange={setCollectionSearchQuery}
            placeholder="Search collections…"
            aria-label="Search collections by name or description"
          />
        </div>
        <Button
          type="button"
          variant="toolbarAccent"
          size="sm"
          className="shrink-0"
          onClick={onNewCollection}
        >
          <Plus className="h-3.5 w-3.5" />
          Add collection
        </Button>
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
        const shareTargets = teams.filter((t) => !t.isDefault);
        const showShare = isAdmin && !col.isSystem;
        const showDelete = canDeleteCollection(col);

        return (
          <div
            key={col.id}
            className="group relative overflow-hidden rounded-xl border border-border bg-popover text-left transition-colors hover:border-brand-cta/20 hover:bg-[#101018]"
          >
            <button
              type="button"
              onClick={() => onOpenCollection(col.id)}
              className="w-full text-left"
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
            {(showShare || showDelete) && (
              <div
                className="absolute right-1.5 top-1.5 z-[1] flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {showShare && shareTargets.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-7 items-center gap-0.5 rounded-md border border-border bg-popover/95 px-1.5 text-[9px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm hover:text-foreground"
                        title="Share with team"
                      >
                        <Share2 className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                        <span className="hidden sm:inline">Share</span>
                        <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-60" aria-hidden />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[10rem]">
                      {shareTargets.map((t) => (
                        <DropdownMenuItem
                          key={t.id}
                          className="text-xs"
                          onClick={() => onShareCollectionWithTeam(col.id, t.id)}
                        >
                          {t.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
                {showDelete ? (
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-popover/95 text-muted-foreground shadow-sm backdrop-blur-sm hover:text-[#A66B6B]"
                    title="Delete collection"
                    aria-label={`Delete collection ${col.name}`}
                    onClick={() => onDeleteCollection(col.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
        </div>
      )}
    </div>
  );
}

export type PartnerProgramsRow = {
  key: string;
  program: DirectoryPartnerProgram;
  products: DirectoryProduct[];
};

export function buildPartnerProgramsRows(products: DirectoryProduct[]): PartnerProgramsRow[] {
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
    activeIncentives: (p.activeIncentives ?? []).map((x) => ({ ...x })),
    amenityTags: p.amenityTags ? [...p.amenityTags] : [],
  };
}

function programChanged(a: DirectoryPartnerProgram, b: DirectoryPartnerProgram): boolean {
  return JSON.stringify(normalizeProgramForCompare(a)) !== JSON.stringify(normalizeProgramForCompare(b));
}

/** True when the in-memory draft differs from saved program + attachment state. */
function partnerProgramsEditIsDirty(args: {
  key: string;
  savedProgram: DirectoryPartnerProgram;
  draftProgram: DirectoryPartnerProgram;
  attached: DirectoryProduct[];
  attachedDraftIds: string[];
  productOverrides: Record<string, PartnerProgramsProductOverrideRow> | undefined;
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
        return `${match?.commissionRate ?? ""}::${match?.amenities ?? ""}::${amenityTagsSig(match?.amenityTags)}`;
      })
    ).size > 1;
  if ((varianceNow ?? false) !== varianceInitial) return true;
  const current = productOverrides ?? {};
  return attached.some((p) => {
    const match = p.partnerPrograms.find((pp) => programFilterId(pp) === key);
    const c = current[p.id];
    if (!c) return false;
    return (
      (match?.commissionRate ?? null) !== c.commissionRate ||
      (match?.amenities ?? "") !== c.amenities ||
      amenityTagsSig(match?.amenityTags) !== amenityTagsSig(c.amenityTags)
    );
  });
}

function termsSignature(program: DirectoryPartnerProgram | undefined): string {
  if (!program) return ":::";
  return `${program.commissionRate ?? ""}::${(program.amenities ?? "").trim()}::${amenityTagsSig(program.amenityTags)}`;
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

type PartnerProgramsExpiryFilter = "all" | "soon" | "active" | "ended" | "no_date";

const PARTNER_PROGRAMS_EXPIRY_FILTER_OPTIONS: { id: PartnerProgramsExpiryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "soon", label: "Renewal soon" },
  { id: "active", label: "Active" },
  { id: "ended", label: "Ended" },
  { id: "no_date", label: "No date" },
];

function programMatchesPartnerProgramsExpiryFilter(
  program: DirectoryPartnerProgram,
  filter: PartnerProgramsExpiryFilter
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

function PartnerProgramsStepTitle({ step, children }: { step: number; children: React.ReactNode }) {
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

function newPartnerProgramsIncentive(baseCommission: number | null): DirectoryProductIncentive {
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
    rateType: "percentage",
    stacksWithBase: true,
    volumeThreshold: null,
    volumeRetroactive: false,
  };
}

function partnerProgramCardDomId(programKey: string) {
  return `partner-program-${programKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

const PARTNER_PROGRAMS_FORM_INPUT_CLASS =
  "h-9 w-full rounded-lg border border-white/[0.14] bg-inset px-3 text-sm text-foreground outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]";

const PARTNER_PROGRAMS_FORM_TEXTAREA_CLASS =
  "w-full resize-none rounded-lg border border-white/[0.14] bg-inset px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]";

type PartnerProgramAddFormState = {
  programName: string;
  /** Registry id (e.g. prog-example). Empty on submit = generated from name. */
  programIdDraft: string;
  commissionRate: string;
  expiryDate: string;
  contact: string;
  amenities: string;
  amenityTags: DirectoryAmenityTag[];
  scope: "enable" | string;
};

function emptyPartnerProgramAddForm(): PartnerProgramAddFormState {
  return {
    programName: "",
    programIdDraft: "",
    commissionRate: "",
    expiryDate: "",
    contact: "",
    amenities: "",
    amenityTags: [],
    scope: "enable",
  };
}

function suggestedPartnerProgramRegistryId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base ? `prog-${base}` : "";
}

type PartnerProgramsTabProps = {
  products: DirectoryProduct[];
  teams: Team[];
  canViewCommissions: boolean;
  isAdmin?: boolean;
  onSelectProduct: (productId: string) => void;
  onAdminSaveProgram?: (programKey: string, payload: PartnerProgramsAdminSavePayload) => boolean;
  /** Fired when unsaved partner-program edit state changes (for tab guards). */
  onDirtyChange?: (dirty: boolean) => void;
};

export function ProductDirectoryPartnerProgramsTab({
  products,
  teams,
  canViewCommissions,
  isAdmin = false,
  onSelectProduct,
  onAdminSaveProgram,
  onDirtyChange,
}: PartnerProgramsTabProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const rows = buildPartnerProgramsRows(products);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DirectoryPartnerProgram>>({});
  const [attachedDraftIds, setAttachedDraftIds] = useState<Record<string, string[]>>({});
  const [useProductSpecificTerms, setUseProductSpecificTerms] = useState<Record<string, boolean>>({});
  const [productOverrides, setProductOverrides] = useState<
    Record<string, Record<string, PartnerProgramsProductOverrideRow>>
  >({});
  const [attachProductSearchQuery, setAttachProductSearchQuery] = useState("");
  const [partnerProgramsSearchQuery, setPartnerProgramsSearchQuery] = useState("");
  const [partnerProgramsExpiryFilter, setPartnerProgramsExpiryFilter] = useState<PartnerProgramsExpiryFilter>("all");
  const [brokenProductImages, setBrokenProductImages] = useState<Record<string, boolean>>({});
  const [showAddProgramForm, setShowAddProgramForm] = useState(false);
  const [addProgramForm, setAddProgramForm] = useState<PartnerProgramAddFormState>(() => emptyPartnerProgramAddForm());
  const [addProgramAttachSearch, setAddProgramAttachSearch] = useState("");
  const [addProgramAttachIds, setAddProgramAttachIds] = useState<string[]>([]);

  const existingProgramKeys = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) {
      for (const pp of p.partnerPrograms ?? []) {
        s.add(programFilterId(pp));
      }
    }
    return s;
  }, [products]);

  const catalogProductsForProgramAttach = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredRows = useMemo(() => {
    const q = partnerProgramsSearchQuery.trim().toLowerCase();
    const matches = rows.filter(({ key, program, products: attached }) => {
      const effective = drafts[key] ?? program;
      if (!programMatchesPartnerProgramsExpiryFilter(effective, partnerProgramsExpiryFilter)) return false;
      if (!q) return true;
      if (programDisplayName(effective).toLowerCase().includes(q)) return true;
      return attached.some((p) => p.name.toLowerCase().includes(q));
    });
    if (!editingKey) return matches;
    const editingRow = rows.find((r) => r.key === editingKey);
    if (!editingRow || matches.some((r) => r.key === editingKey)) return matches;
    return [editingRow, ...matches];
  }, [rows, partnerProgramsSearchQuery, partnerProgramsExpiryFilter, editingKey, drafts]);

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
    return partnerProgramsEditIsDirty({
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
      const overrides: Record<string, PartnerProgramsProductOverrideRow> = {};
      attached.forEach((p) => {
        const match = p.partnerPrograms.find((pp) => programFilterId(pp) === key);
        overrides[p.id] = {
          commissionRate: match?.commissionRate ?? null,
          amenities: match?.amenities ?? "",
          amenityTags: match?.amenityTags ? [...match.amenityTags] : [],
        };
      });
      const hasVariance =
        new Set(Object.values(overrides).map((x) => String(x.commissionRate ?? ""))).size > 1 ||
        new Set(Object.values(overrides).map((x) => x.amenities.trim())).size > 1 ||
        new Set(Object.values(overrides).map((x) => amenityTagsSig(x.amenityTags))).size > 1;

      setDrafts((prev) => ({
        ...prev,
        [key]: {
          ...program,
          activeIncentives: program.activeIncentives.map((x) => ({ ...x })),
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
    dirtyRef.current = partnerProgramsEditIsDirty({
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
    const dirty = partnerProgramsEditIsDirty({
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

  return (
    <div className="space-y-6">
      {discardDialogEl}
      {!isAdmin && (
        <p className="inline-flex w-fit max-w-full items-center gap-2 rounded-lg border border-border bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0 text-[#5C5852]" aria-hidden />
          View only — commission details are hidden. Ask an admin to edit programs.
        </p>
      )}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {rows.length > 0 ? (
            <div className="min-w-0 flex-1 basis-[min(100%,20rem)]">
              <PageSearchField
                value={partnerProgramsSearchQuery}
                onChange={setPartnerProgramsSearchQuery}
                placeholder="Search partner programs…"
                aria-label="Search partner programs or linked properties"
              />
            </div>
          ) : null}
          {isAdmin ? (
            <Button
              type="button"
              variant="toolbarAccent"
              size="sm"
              onClick={() => setShowAddProgramForm((prev) => !prev)}
              className="shrink-0"
            >
              {showAddProgramForm ? (
                "Hide add form"
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add partner program
                </>
              )}
            </Button>
          ) : null}
        </div>
        {rows.length > 0 ? (
          <div className="-mx-1 flex w-full min-w-0 items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {PARTNER_PROGRAMS_EXPIRY_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPartnerProgramsExpiryFilter(opt.id)}
                className={cn(
                  "flex shrink-0 items-center rounded-full border px-2.5 py-1 text-2xs whitespace-nowrap transition-colors",
                  partnerProgramsExpiryFilter === opt.id
                    ? "border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.08)] text-brand-cta"
                    : "border-transparent text-muted-foreground hover:text-muted-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {showAddProgramForm && isAdmin ? (
        <div className="rounded-2xl border border-[rgba(201,169,110,0.22)] bg-[rgba(201,169,110,0.06)] p-4 sm:p-5">
          <PartnerProgramsStepTitle step={1}>New partner program — registry details</PartnerProgramsStepTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-2xs font-medium text-muted-foreground">Program name</span>
              <input
                value={addProgramForm.programName}
                onChange={(e) => setAddProgramForm((prev) => ({ ...prev, programName: e.target.value }))}
                placeholder="Required"
                className={PARTNER_PROGRAMS_FORM_INPUT_CLASS}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-2xs font-medium text-muted-foreground">
                Registry id{" "}
                <span className="font-normal text-muted-foreground/80">(optional — defaults from name, e.g. prog-luxury-collection)</span>
              </span>
              <input
                value={addProgramForm.programIdDraft}
                onChange={(e) => setAddProgramForm((prev) => ({ ...prev, programIdDraft: e.target.value }))}
                placeholder={suggestedPartnerProgramRegistryId(addProgramForm.programName) || "prog-…"}
                className={PARTNER_PROGRAMS_FORM_INPUT_CLASS}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-2xs font-medium text-muted-foreground">Commission %</span>
              <input
                type="number"
                min={0}
                step="0.1"
                value={addProgramForm.commissionRate}
                onChange={(e) => setAddProgramForm((prev) => ({ ...prev, commissionRate: e.target.value }))}
                className={PARTNER_PROGRAMS_FORM_INPUT_CLASS}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-2xs font-medium text-muted-foreground">Expiry</span>
              <input
                type="date"
                value={addProgramForm.expiryDate}
                onChange={(e) => setAddProgramForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                className={PARTNER_PROGRAMS_FORM_INPUT_CLASS}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-2xs font-medium text-muted-foreground">Scope</span>
              <select
                value={addProgramForm.scope === "enable" ? "enable" : addProgramForm.scope}
                onChange={(e) =>
                  setAddProgramForm((prev) => ({
                    ...prev,
                    scope: e.target.value === "enable" ? "enable" : e.target.value,
                  }))
                }
                className={PARTNER_PROGRAMS_FORM_INPUT_CLASS}
              >
                <option value="enable">Enable</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-2xs font-medium text-muted-foreground">Contact</span>
              <input
                value={addProgramForm.contact}
                onChange={(e) => setAddProgramForm((prev) => ({ ...prev, contact: e.target.value }))}
                className={PARTNER_PROGRAMS_FORM_INPUT_CLASS}
              />
            </label>
            <div className="block sm:col-span-2">
              <span className="mb-1 block text-2xs font-medium text-muted-foreground">Amenity tags</span>
              <ProductDirectoryAmenitiesDropdown
                embedStyle="partnerPanel"
                selected={addProgramForm.amenityTags}
                onChange={(tags) => setAddProgramForm((prev) => ({ ...prev, amenityTags: tags }))}
                triggerClassName="max-w-none w-full min-h-9"
              />
            </div>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-2xs font-medium text-muted-foreground">
                Extra notes / exceptions
              </span>
              <textarea
                rows={2}
                value={addProgramForm.amenities}
                onChange={(e) => setAddProgramForm((prev) => ({ ...prev, amenities: e.target.value }))}
                placeholder="Optional — not used for structured filters"
                className={PARTNER_PROGRAMS_FORM_TEXTAREA_CLASS}
              />
            </label>
          </div>

          <PartnerProgramsStepTitle step={2}>Link catalog properties</PartnerProgramsStepTitle>
          <p className="mb-2 text-2xs leading-relaxed text-muted-foreground">
            Select at least one product. The program appears in partner programs once it is attached.
          </p>
          <div className="rounded-lg border border-border bg-inset/70 p-3">
            <PageSearchField
              variant="compact"
              value={addProgramAttachSearch}
              onChange={setAddProgramAttachSearch}
              placeholder="Search products…"
              aria-label="Search products to attach to new program"
            />
            <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto pr-1">
              {catalogProductsForProgramAttach.filter((p) => productMatchesPartnerAttachSearch(p, addProgramAttachSearch))
                .length === 0 ? (
                <p className="py-3 text-center text-2xs text-muted-foreground">No products match this search.</p>
              ) : (
                catalogProductsForProgramAttach
                  .filter((p) => productMatchesPartnerAttachSearch(p, addProgramAttachSearch))
                  .map((p) => (
                    <label
                      key={p.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-inset px-2 py-1.5 text-2xs text-[#C8C0B8]"
                    >
                      <input
                        type="checkbox"
                        checked={addProgramAttachIds.includes(p.id)}
                        onChange={(e) =>
                          setAddProgramAttachIds((prev) =>
                            e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                          )
                        }
                        className="checkbox-on-dark"
                      />
                      <span className="min-w-0 truncate">{p.name}</span>
                    </label>
                  ))
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={
                !addProgramForm.programName.trim() ||
                addProgramAttachIds.length === 0 ||
                !onAdminSaveProgram
              }
              onClick={() => {
                if (!onAdminSaveProgram || !addProgramForm.programName.trim() || addProgramAttachIds.length === 0) return;
                const name = addProgramForm.programName.trim();
                const rawId = addProgramForm.programIdDraft.trim();
                const generated = suggestedPartnerProgramRegistryId(name);
                const programKey = rawId || generated || `prog-${Date.now()}`;
                if (existingProgramKeys.has(programKey)) {
                  toast({
                    title: "A program with this registry id already exists. Use a different id.",
                    tone: "destructive",
                  });
                  return;
                }
                const cr = addProgramForm.commissionRate.trim();
                const commissionRate = cr === "" ? null : Number(cr);
                if (commissionRate != null && (Number.isNaN(commissionRate) || commissionRate < 0)) {
                  toast({ title: "Commission cannot be negative.", tone: "destructive" });
                  return;
                }

                const program: DirectoryPartnerProgram = {
                  id: `${programKey}-new`,
                  name,
                  programName: name,
                  programId: programKey,
                  commissionRate,
                  expiryDate: addProgramForm.expiryDate ? `${addProgramForm.expiryDate}T12:00:00.000Z` : null,
                  contact: addProgramForm.contact.trim() || undefined,
                  amenities:
                    addProgramForm.amenities.trim() || `${name} partner rate and amenities apply.`,
                  activeIncentives: [],
                  amenityTags: [...addProgramForm.amenityTags],
                  commissionType: "percentage",
                  scope: addProgramForm.scope === "enable" ? "enable" : addProgramForm.scope,
                  status: "active",
                };

                const ok = onAdminSaveProgram(programKey, {
                  program,
                  attachedProductIds: addProgramAttachIds,
                  useProductSpecificTerms: false,
                  productOverrides: {},
                });
                if (ok) {
                  setShowAddProgramForm(false);
                  setAddProgramForm(emptyPartnerProgramAddForm());
                  setAddProgramAttachIds([]);
                  setAddProgramAttachSearch("");
                }
              }}
              className="rounded-lg bg-[rgba(201,169,110,0.20)] px-3 py-1.5 text-xs font-semibold text-brand-cta disabled:opacity-40"
            >
              Save program
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddProgramForm(false);
                setAddProgramForm(emptyPartnerProgramAddForm());
                setAddProgramAttachIds([]);
                setAddProgramAttachSearch("");
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/[0.04]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {rows.length === 0 && !showAddProgramForm ? (
        <div className="rounded-xl border border-border bg-white/[0.02] px-6 py-12 text-center">
          <Award className="mx-auto mb-3 h-8 w-8 text-muted-foreground/65" aria-hidden />
          <p className="text-compact font-medium text-foreground">No partner programs yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isAdmin
              ? "Use Add partner program above to create a registry entry and link catalog properties."
              : "Programs show up here when at least one product lists that partner agreement."}
          </p>
        </div>
      ) : null}

      {rows.length > 0 && filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-input bg-white/[0.02] px-6 py-12 text-center">
          <p className="text-compact font-medium text-foreground">No programs match</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try another search, or adjust the expiry filter to see more programs.
          </p>
          <button
            type="button"
            onClick={() => {
              setPartnerProgramsSearchQuery("");
              setPartnerProgramsExpiryFilter("all");
            }}
            className="mt-4 text-xs font-semibold text-brand-cta transition-colors hover:text-[#d4b47e]"
          >
            Clear search and expiry filter
          </button>
        </div>
      ) : rows.length > 0 ? (
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
          ? partnerProgramsEditIsDirty({
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
        const activeProgramAdvisories = attached
          .flatMap((p) => p.commissionAdvisories ?? [])
          .filter(
            (advisory) =>
              advisory.status === "active" &&
              advisory.programId === display.id &&
              advisory.incentiveType !== "tier_upgrade"
          );
        const topProgramAdvisory = activeProgramAdvisories[0];
        const topProgramAdvisoryValue =
          topProgramAdvisory == null
            ? null
            : topProgramAdvisory.incentiveType === "bonus_flat"
              ? `+$${topProgramAdvisory.incentiveValue ?? 0}`
              : `+${topProgramAdvisory.incentiveValue ?? 0}%`;
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
                    {display.registryStatus ? (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[8px] font-medium capitalize text-muted-foreground">
                        {display.registryStatus.replace(/-/g, " ")}
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
                      <span className="font-semibold text-[#B8976E]">
                        Up to {display.commissionType === "flat" ? `$${displayRate}` : `${displayRate}%`}
                      </span>
                    ) : null}
                    {canViewCommissions && topProgramAdvisoryValue ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-400">
                        <Flame className="h-3 w-3" aria-hidden />
                        Incentive {topProgramAdvisoryValue}
                      </span>
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
                    {canViewCommissions && display.contact ? (
                      <span className="text-muted-foreground">· {display.contact}</span>
                    ) : null}
                    {hasProductVariance ? (
                      <span className="text-[8px] font-normal normal-case tracking-normal text-muted-foreground">
                        · terms vary by product
                      </span>
                    ) : null}
                  </div>
                  {(display.amenityTags?.length ?? 0) > 0 ? (
                    <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
                      {(display.amenityTags ?? []).map((t) => AMENITY_LABELS[t]).join(" · ")}
                    </p>
                  ) : null}
                  {display.amenities?.trim() ? (
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
                  <PartnerProgramsStepTitle step={1}>Program details</PartnerProgramsStepTitle>
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
                  <div className="block sm:col-span-2">
                    <span className="mb-1 block text-2xs font-medium text-muted-foreground">Amenity tags</span>
                    <p className="mb-2 text-2xs text-muted-foreground/80">
                      Select normalized benefits for filtering. Use notes below for one-off exceptions.
                    </p>
                    <ProductDirectoryAmenitiesDropdown
                      embedStyle="partnerPanel"
                      selected={drafts[key]?.amenityTags ?? []}
                      onChange={(tags) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], amenityTags: tags },
                        }))
                      }
                      triggerClassName="max-w-none w-full min-h-9"
                    />
                  </div>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-2xs font-medium text-muted-foreground">
                      Extra notes / exceptions
                    </span>
                    <textarea
                      rows={2}
                      value={drafts[key]?.amenities ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], amenities: e.target.value } }))
                      }
                      placeholder="Optional free text — not used for structured filters"
                      className="w-full resize-none rounded-lg border border-white/[0.14] bg-inset px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    />
                  </label>
                  </div>

                  <PartnerProgramsStepTitle step={2}>Linked properties</PartnerProgramsStepTitle>
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
                        const matchedProgram = p.partnerPrograms.find((pp) => programFilterId(pp) === key);
                        const override = productOverrides[key]?.[p.id] ?? {
                          commissionRate: matchedProgram?.commissionRate ?? display.commissionRate ?? null,
                          amenities: matchedProgram?.amenities ?? display.amenities ?? "",
                          amenityTags: [...(matchedProgram?.amenityTags ?? display.amenityTags ?? [])],
                        };
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
                                <span className="text-[9px] text-muted-foreground">
                                  {directoryProductTypeShortLabel(p)}
                                </span>
                              </div>
                            </div>
                            {on && (useProductSpecificTerms[key] ?? false) ? (
                              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                                <p className="border-l border-brand-cta/20 pl-2 text-[9px] leading-snug text-muted-foreground sm:col-span-2">
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
                                          ...(prev[key]?.[p.id] ?? {
                                            amenities: display.amenities ?? "",
                                            amenityTags: [...(display.amenityTags ?? [])],
                                          }),
                                          commissionRate: e.target.value === "" ? null : Number(e.target.value),
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="Commission %"
                                  className="h-8 rounded border border-border bg-inset px-2 text-2xs text-foreground outline-none"
                                />
                                <div className="sm:col-span-2">
                                  <ProductDirectoryAmenitiesDropdown
                                    embedStyle="partnerPanel"
                                    selected={override.amenityTags}
                                    onChange={(tags) =>
                                      setProductOverrides((prev) => ({
                                        ...prev,
                                        [key]: {
                                          ...(prev[key] ?? {}),
                                          [p.id]: {
                                            ...(prev[key]?.[p.id] ?? {
                                              commissionRate: display.commissionRate ?? null,
                                              amenities: display.amenities ?? "",
                                            }),
                                            amenityTags: tags,
                                          },
                                        },
                                      }))
                                    }
                                    triggerClassName="max-w-none w-full min-h-8"
                                  />
                                </div>
                                <textarea
                                  value={override.amenities}
                                  onChange={(e) =>
                                    setProductOverrides((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...(prev[key] ?? {}),
                                        [p.id]: {
                                          ...(prev[key]?.[p.id] ?? {
                                            commissionRate: display.commissionRate ?? null,
                                            amenityTags: [...(display.amenityTags ?? [])],
                                          }),
                                          amenities: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="Per-property notes / exceptions"
                                  rows={2}
                                  className="min-h-[3.5rem] resize-none rounded border border-border bg-inset px-2 py-1.5 text-2xs text-foreground outline-none sm:col-span-2"
                                />
                              </div>
                            ) : null}
                          </div>
                        );
                      });
                      })()}
                    </div>
                  </div>
                  <PartnerProgramsStepTitle step={3}>Temporary incentives</PartnerProgramsStepTitle>
                  <div className="rounded-lg border border-amber-400/25 bg-amber-400/[0.07] p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="max-w-md text-2xs leading-relaxed text-muted-foreground">
                        Same fields as Settings → Partner programs → Temporary incentives: rate type, stacking, optional
                        volume metric, threshold, retroactive flag, and booking / travel windows. Windows should fall on
                        or before the program expiry above.
                      </p>
                      <button
                        type="button"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-400/35 bg-amber-400/10 px-2.5 py-1.5 text-2xs font-medium text-amber-200 transition-colors hover:bg-amber-400/15"
                        onClick={() =>
                          setDrafts((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              activeIncentives: [
                                ...(prev[key]?.activeIncentives ?? []),
                                newPartnerProgramsIncentive(prev[key]?.commissionRate ?? null),
                              ],
                            },
                          }))
                        }
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        Add incentive
                      </button>
                    </div>
                    {(display.activeIncentives?.length ?? 0) === 0 ? (
                      <p className="rounded-md border border-dashed border-border bg-inset/50 px-3 py-3 text-center text-2xs text-muted-foreground">
                        No incentives yet. Add title, details, rate type, stacking, optional volume metric, and booking /
                        travel windows.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {display.activeIncentives.map((pr) => (
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
                                      activeIncentives: (prev[key]?.activeIncentives ?? []).filter((x) => x.id !== pr.id),
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
                                      activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
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
                                      activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
                                        x.id === pr.id ? { ...x, details: e.target.value } : x
                                      ),
                                    },
                                  }))
                                }
                                placeholder="Stacking rules, eligible room types, advisor notes…"
                                className="w-full resize-none rounded border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/65"
                              />
                            </label>
                            <div className="mb-2 grid gap-2 sm:grid-cols-2">
                              <label className="block">
                                <span className="mb-0.5 block text-[9px] text-muted-foreground">Rate type</span>
                                <select
                                  value={pr.rateType ?? "percentage"}
                                  onChange={(e) =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...prev[key],
                                        activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
                                          x.id === pr.id
                                            ? { ...x, rateType: e.target.value as "percentage" | "flat" }
                                            : x
                                        ),
                                      },
                                    }))
                                  }
                                  className="h-8 w-full rounded border border-border bg-inset px-2 text-2xs text-foreground outline-none"
                                >
                                  <option value="percentage">Percentage</option>
                                  <option value="flat">Flat</option>
                                </select>
                              </label>
                              <label className="block">
                                <span className="mb-0.5 block text-[9px] text-muted-foreground">
                                  {(pr.rateType ?? "percentage") === "flat" ? "Flat amount" : "Effective rate"}
                                </span>
                                <span className="flex items-center gap-1">
                                  {(pr.rateType ?? "percentage") === "flat" ? (
                                    <span className="text-2xs text-muted-foreground">$</span>
                                  ) : null}
                                  <input
                                    type="number"
                                    min={0}
                                    step={(pr.rateType ?? "percentage") === "flat" ? 1 : 0.1}
                                    value={pr.effectiveRate}
                                    onChange={(e) =>
                                      setDrafts((prev) => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
                                            x.id === pr.id
                                              ? { ...x, effectiveRate: Math.max(0, Number(e.target.value) || 0) }
                                              : x
                                          ),
                                        },
                                      }))
                                    }
                                    className="min-w-0 flex-1 rounded border border-border bg-inset px-1 py-0.5 text-2xs text-foreground outline-none"
                                  />
                                  {(pr.rateType ?? "percentage") === "flat" ? null : (
                                    <span className="text-2xs text-muted-foreground">%</span>
                                  )}
                                </span>
                              </label>
                            </div>
                            <label className="mb-2 flex items-start gap-2 text-2xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={pr.stacksWithBase ?? true}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [key]: {
                                      ...prev[key],
                                      activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
                                        x.id === pr.id ? { ...x, stacksWithBase: e.target.checked } : x
                                      ),
                                    },
                                  }))
                                }
                                className="mt-0.5 rounded border-border"
                              />
                              <span>Stacks with base commission (off = override / seasonal-style)</span>
                            </label>
                            <div className="mb-2 space-y-2 rounded-md border border-border bg-white/[0.03] p-2">
                              <p className="text-[9px] font-medium uppercase text-muted-foreground">
                                Volume incentive (optional)
                              </p>
                              <p className="text-[9px] leading-snug text-muted-foreground">
                                Choose a metric to mark this as a volume incentive. Threshold is optional.
                              </p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <label className="block">
                                  <span className="mb-0.5 block text-[9px] text-muted-foreground">Volume metric</span>
                                  <select
                                    value={pr.volumeMetric ?? ""}
                                    onChange={(e) => {
                                      const v = e.target.value as VolumeMetric | "";
                                      setDrafts((prev) => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
                                            x.id === pr.id
                                              ? {
                                                  ...x,
                                                  volumeMetric: v === "" ? undefined : v,
                                                  volumeThreshold: v === "" ? null : x.volumeThreshold,
                                                  volumeRetroactive: v === "" ? false : x.volumeRetroactive,
                                                }
                                              : x
                                          ),
                                        },
                                      }));
                                    }}
                                    className="h-8 w-full rounded border border-border bg-inset px-2 text-2xs text-foreground outline-none"
                                  >
                                    <option value="">None (not volume)</option>
                                    <option value="room_nights">Room nights</option>
                                    <option value="bookings">Bookings</option>
                                    <option value="revenue">Revenue</option>
                                  </select>
                                </label>
                                <label className="block">
                                  <span className="mb-0.5 block text-[9px] text-muted-foreground">
                                    Threshold (optional)
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    disabled={!pr.volumeMetric}
                                    value={
                                      pr.volumeThreshold != null && Number.isFinite(pr.volumeThreshold)
                                        ? pr.volumeThreshold
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      setDrafts((prev) => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
                                            x.id === pr.id
                                              ? {
                                                  ...x,
                                                  volumeThreshold: raw === "" ? null : Math.max(0, Number(raw) || 0),
                                                }
                                              : x
                                          ),
                                        },
                                      }));
                                    }}
                                    className="h-8 w-full rounded border border-border bg-inset px-2 text-2xs text-foreground outline-none disabled:opacity-50"
                                    placeholder="e.g. 10"
                                  />
                                </label>
                              </div>
                              <label className="flex items-start gap-2 text-[9px] leading-snug text-muted-foreground">
                                <input
                                  type="checkbox"
                                  disabled={!pr.volumeMetric}
                                  checked={pr.volumeRetroactive ?? false}
                                  onChange={(e) =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...prev[key],
                                        activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
                                          x.id === pr.id
                                            ? { ...x, volumeRetroactive: e.target.checked }
                                            : x
                                        ),
                                      },
                                    }))
                                  }
                                  className="mt-0.5 rounded border-border disabled:opacity-50"
                                />
                                <span>
                                  Retroactive in window — informational (whether past bookings in the window count).
                                </span>
                              </label>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
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
                                          activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
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
                                          activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
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
                                          activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
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
                                          activeIncentives: (prev[key]?.activeIncentives ?? []).map((x) =>
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

              {(display.activeIncentives?.length ?? 0) > 0 ? (
                <div className="mt-3 rounded-xl border border-[rgba(201,169,110,0.12)] bg-[rgba(201,169,110,0.04)] p-3">
                  <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-[#B8976E]">Preview</p>
                  <ul className="space-y-3">
                    {display.activeIncentives.map((pr) => (
                      <li
                        key={pr.id}
                        className="border-b border-white/[0.04] pb-3 text-2xs last:border-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold text-brand-cta">
                            {(pr.rateType ?? "percentage") === "flat"
                              ? `$${pr.effectiveRate}`
                              : `${pr.effectiveRate}%`}{" "}
                            effective
                          </span>
                          <span className="text-muted-foreground">
                            Book {new Date(pr.bookingStart).toLocaleDateString()} –{" "}
                            {new Date(pr.bookingEnd).toLocaleDateString()} · Travel{" "}
                            {new Date(pr.travelStart).toLocaleDateString()} –{" "}
                            {new Date(pr.travelEnd).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                          {(pr.stacksWithBase ?? true) ? "Stacks with base" : "Does not stack (override / seasonal-style)"}
                          {pr.volumeMetric != null ? (
                            <>
                              {" · "}
                              Volume: {pr.volumeThreshold ?? "—"} {pr.volumeMetric.replace("_", " ")}
                              {pr.volumeRetroactive ? " · retroactive (info)" : ""}
                            </>
                          ) : null}
                        </p>
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
                    const matchingAdvisory = (p.commissionAdvisories ?? []).find(
                      (advisory) =>
                        advisory.status === "active" &&
                        advisory.productId === p.id &&
                        advisory.programId === (match?.id ?? "")
                    );
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
                        <span className="text-[8px] text-muted-foreground">{directoryProductTypeShortLabel(p)}</span>
                        {matchingAdvisory ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-400">
                            <Flame className="h-2 w-2" aria-hidden />
                            +{matchingAdvisory.incentiveValue ?? 0}
                            {matchingAdvisory.incentiveType === "bonus_flat" ? "$" : "%"}
                          </span>
                        ) : null}
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
      ) : null}
    </div>
  );
}

export { ProductDirectoryRepFirmsTab } from "./rep-firms/RepFirmsDirectoryTab";
