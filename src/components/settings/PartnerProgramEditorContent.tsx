"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { DirectoryEditorSectionNav } from "@/components/products/DirectoryEditorSectionNav";
import { Plus } from "lucide-react";
import ProductDirectoryAmenitiesDropdown from "@/components/products/ProductDirectoryAmenitiesDropdown";
import { directoryProductTypeShortLabel } from "@/components/products/directoryProductTypeHelpers";
import { productMatchesPartnerAttachSearch } from "@/components/products/productDirectoryLogic";
import type { DirectoryAmenityTag, DirectoryProduct } from "@/types/product-directory";
import { PARTNER_PROGRAMS_REFERENCE_ISO } from "@/lib/partnerProgramsSeed";
import { parseRateNumber } from "@/lib/partnerProgramMerge";
import { PP_EDITOR_SECTION_IDS } from "@/lib/partnerProgramDraftSections";
import { cn } from "@/lib/utils";
import { PartnerProgramIncentiveCardEditor } from "@/components/settings/PartnerProgramIncentiveCardEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageSearchField } from "@/components/ui/page-search-field";
import type {
  CommissionKind,
  Incentive,
  LinkCommissionStatus,
  PartnerProgramType,
  ProductProgramLink,
  Program,
} from "@/types/partner-programs";

const REF = new Date(PARTNER_PROGRAMS_REFERENCE_ISO);

export const PROGRAM_TYPE_OPTIONS: { id: PartnerProgramType; label: string }[] = [
  { id: "preferred_partner", label: "Preferred partner" },
  { id: "consortium", label: "Consortium" },
  { id: "direct", label: "Direct" },
  { id: "wholesaler", label: "Wholesaler" },
  { id: "other", label: "Other" },
];

export const COMMISSION_KIND_OPTIONS: { id: CommissionKind; label: string }[] = [
  { id: "percentage", label: "Percentage" },
  { id: "flat", label: "Flat" },
  { id: "tiered", label: "Tiered" },
  { id: "variable", label: "Variable" },
];

/** Sentinel anchor when there are no linked products — program-wide incentives only. */
export const ANCHOR_PROGRAM_WIDE = "__program_wide__";

export function incentiveAppliesToProduct(inc: Incentive, productId: string): boolean {
  return inc.productIds === "all" || (Array.isArray(inc.productIds) && inc.productIds.includes(productId));
}

/** Matches rep-firms directory editor field chrome (`RepFirmsDirectoryTab`). */
export const PP_EDITOR_INPUT_CLASS =
  "h-9 w-full rounded-lg border border-white/[0.14] bg-inset px-3 text-sm text-foreground outline-none transition-colors focus:border-[rgba(176,122,91,0.45)] focus:ring-1 focus:ring-[rgba(176,122,91,0.28)]";

export const PP_EDITOR_TEXTAREA_CLASS =
  "w-full resize-none rounded-lg border border-white/[0.14] bg-inset px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[rgba(176,122,91,0.45)] focus:ring-1 focus:ring-[rgba(176,122,91,0.28)]";

export const PP_EDITOR_SELECT_CLASS =
  "h-9 w-full rounded-lg border border-white/[0.14] bg-inset px-2 text-sm text-foreground outline-none transition-colors focus:border-[rgba(176,122,91,0.45)] focus:ring-1 focus:ring-[rgba(176,122,91,0.28)]";

/** Dense fields (linked product cards) — same as rep firm contact row inputs. */
const PP_EDITOR_INPUT_COMPACT_CLASS =
  "h-8 w-full min-w-0 rounded-md border border-border bg-inset px-2 text-xs text-foreground outline-none transition-colors focus:border-[rgba(176,122,91,0.45)] focus:ring-1 focus:ring-[rgba(176,122,91,0.28)]";

export function PartnerProgramEditorSectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{children}</h3>
  );
}

export function PartnerProgramEditorSectionNav({
  className,
  onBackToTop,
  scrollContainerRef,
}: {
  className?: string;
  onBackToTop?: () => void;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <DirectoryEditorSectionNav
      ariaLabel="Jump to program section"
      sections={[
        { id: PP_EDITOR_SECTION_IDS.basics, label: "Basics" },
        { id: PP_EDITOR_SECTION_IDS.terms, label: "Terms & contacts" },
        { id: PP_EDITOR_SECTION_IDS.links, label: "Links & incentives" },
      ]}
      scrollContainerRef={scrollContainerRef}
      onBackToTop={onBackToTop}
      className={className}
    />
  );
}

function daysFromRef(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - REF.getTime()) / 86_400_000);
}

function linkRowExpiringSoon(expiresAt: string | null): boolean {
  const d = daysFromRef(expiresAt);
  return d != null && d > 0 && d <= 30;
}

export function LinkDetailCard({
  row,
  productName,
  upsertLink,
  removeLink,
  compact = false,
  onAddProductIncentive,
}: {
  row: ProductProgramLink;
  productName: string;
  upsertLink: (l: ProductProgramLink) => void;
  removeLink: (id: string) => void;
  /** When true, only name + remove; use program defaults (no per-property fields). */
  compact?: boolean;
  /** Creates an incentive scoped to this linked product (shown in the program incentives list below). */
  onAddProductIncentive?: () => void;
}) {
  const expiring = linkRowExpiringSoon(row.expiresAt);
  const patch = (partial: Partial<ProductProgramLink>) =>
    upsertLink({ ...row, ...partial, updatedAt: new Date().toISOString() });

  if (compact) {
    return (
      <div className="rounded-xl border border-white/[0.12] bg-white/[0.02] p-3 text-xs">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{productName}</p>
            <p className="mt-0.5 text-2xs text-muted-foreground">
              Uses program default commission and amenities. Turn on property-level overrides above to edit per property.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {onAddProductIncentive ? (
              <button
                type="button"
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-amber-400/35 bg-amber-400/10 px-2 text-2xs font-medium text-amber-200 transition-colors hover:bg-amber-400/15"
                onClick={onAddProductIncentive}
              >
                <Plus className="h-3 w-3" aria-hidden />
                Incentive
              </button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 text-[#A66B6B]/90"
              onClick={() => removeLink(row.id)}
            >
              Remove link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.12] bg-white/[0.02] p-3 text-xs",
        expiring && "bg-[rgba(180,130,130,0.12)]"
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{productName}</p>
          <p className="text-[10px] text-muted-foreground">
            Product <span className="font-mono">{row.productId}</span> · Link <span className="font-mono">{row.id}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {onAddProductIncentive ? (
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-amber-400/35 bg-amber-400/10 px-2 text-2xs font-medium text-amber-200 transition-colors hover:bg-amber-400/15"
              onClick={onAddProductIncentive}
            >
              <Plus className="h-3 w-3" aria-hidden />
              Add incentive
            </button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 text-[#A66B6B]/90"
            onClick={() => removeLink(row.id)}
          >
            Remove link
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1">
          <span className="mb-0.5 block text-2xs font-medium text-muted-foreground">Commission rate (override)</span>
          <Input
            defaultValue={row.commissionRate ?? ""}
            placeholder="e.g. 10%, €150 flat — empty = program default"
            className={PP_EDITOR_INPUT_COMPACT_CLASS}
            onBlur={(e) => patch({ commissionRate: e.target.value.trim() === "" ? null : e.target.value.trim() })}
          />
        </label>
        <label className="space-y-1">
          <span className="mb-0.5 block text-2xs font-medium text-muted-foreground">Commission type</span>
          <select
            className={PP_EDITOR_INPUT_COMPACT_CLASS}
            value={row.commissionType ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              patch({
                commissionType: v === "" ? null : (v as CommissionKind),
              });
            }}
          >
            <option value="">Use program default</option>
            <option value="percentage">Percentage</option>
            <option value="flat">Flat</option>
            <option value="tiered">Tiered</option>
            <option value="variable">Variable</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="mb-0.5 block text-2xs font-medium text-muted-foreground">Effective from</span>
          <Input
            type="date"
            defaultValue={row.effectiveFrom ? row.effectiveFrom.slice(0, 10) : ""}
            className={PP_EDITOR_INPUT_COMPACT_CLASS}
            onBlur={(e) => {
              const v = e.target.value;
              patch({ effectiveFrom: v ? `${v}T12:00:00.000Z` : row.effectiveFrom });
            }}
          />
        </label>
        <label className="space-y-1">
          <span className="mb-0.5 block text-2xs font-medium text-muted-foreground">Expires</span>
          <Input
            type="date"
            defaultValue={row.expiresAt ? row.expiresAt.slice(0, 10) : ""}
            className={PP_EDITOR_INPUT_COMPACT_CLASS}
            onBlur={(e) => {
              const v = e.target.value;
              patch({ expiresAt: v ? `${v}T12:00:00.000Z` : null });
            }}
          />
        </label>
        <label className="space-y-1">
          <span className="mb-0.5 block text-2xs font-medium text-muted-foreground">Link status</span>
          <select
            className={PP_EDITOR_INPUT_COMPACT_CLASS}
            value={row.status}
            onChange={(e) => patch({ status: e.target.value as LinkCommissionStatus })}
          >
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
        </label>
        <label className="space-y-1 sm:col-span-2 lg:col-span-1">
          <span className="mb-0.5 block text-2xs font-medium text-muted-foreground">Contact name (product-specific)</span>
          <Input
            defaultValue={row.contactName ?? ""}
            className={PP_EDITOR_INPUT_COMPACT_CLASS}
            onBlur={(e) => patch({ contactName: e.target.value.trim() || null })}
          />
        </label>
        <label className="space-y-1">
          <span className="mb-0.5 block text-2xs font-medium text-muted-foreground">Contact email</span>
          <Input
            defaultValue={row.contactEmail ?? ""}
            className={PP_EDITOR_INPUT_COMPACT_CLASS}
            onBlur={(e) => patch({ contactEmail: e.target.value.trim() || null })}
          />
        </label>
        <label className="space-y-1">
          <span className="mb-0.5 block text-2xs font-medium text-muted-foreground">Contact phone</span>
          <Input
            defaultValue={row.contactPhone ?? ""}
            className={PP_EDITOR_INPUT_COMPACT_CLASS}
            onBlur={(e) => patch({ contactPhone: e.target.value.trim() || null })}
          />
        </label>
        <label className="space-y-1 sm:col-span-2 lg:col-span-3">
          <span className="mb-0.5 block text-2xs font-medium text-muted-foreground">Notes</span>
          <textarea
            defaultValue={row.notes ?? ""}
            rows={2}
            placeholder="e.g. Only applies to suite categories"
            className={cn(PP_EDITOR_INPUT_COMPACT_CLASS, "min-h-[3rem] resize-y py-1.5")}
            onBlur={(e) => patch({ notes: e.target.value.trim() || null })}
          />
        </label>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-inset/35 p-3 sm:p-3">
        <p className="text-xs font-medium text-foreground">Amenity overrides</p>
        <p className="mt-0.5 text-2xs text-muted-foreground">
          Property-level tags when the program enables overrides.
        </p>
        <div className="mt-2">
          <ProductDirectoryAmenitiesDropdown
            embedStyle="partnerPanel"
            selected={row.amenities ?? []}
            onChange={(tags) => patch({ amenities: tags.length > 0 ? tags : null })}
          />
        </div>
      </div>

      {expiring ? (
        <p className="mt-2 text-[10px] text-[#A66B6B]/90">Expires within 30 days — renew or update terms.</p>
      ) : null}
    </div>
  );
}

export type PartnerProgramEditorContentProps = {
  programDraft: Program;
  patchProgramDraft: (patch: Partial<Program>) => void;
  sortedLinks: ProductProgramLink[];
  /** Full catalog products — same attach UX as rep firms (search + checkboxes). */
  linkCatalogProducts?: DirectoryProduct[];
  sortedIncentives: Incentive[];
  /** Persist incentives edited inline next to each linked product (or program-wide). */
  upsertIncentive: (i: Incentive) => void;
  onRemoveIncentive: (id: string) => void;
  upsertLink: (l: ProductProgramLink) => void;
  removeLink: (id: string) => void;
  productNameForId: (id: string) => string;
};

export function PartnerProgramEditorContent({
  programDraft,
  patchProgramDraft,
  sortedLinks,
  linkCatalogProducts,
  sortedIncentives,
  upsertIncentive,
  onRemoveIncentive,
  upsertLink,
  removeLink,
  productNameForId,
}: PartnerProgramEditorContentProps) {
  const [linkAttachSearch, setLinkAttachSearch] = useState("");
  const [highlightIncentiveId, setHighlightIncentiveId] = useState<string | null>(null);

  const linkByProductId = useMemo(() => {
    const m = new Map<string, ProductProgramLink>();
    for (const l of sortedLinks) m.set(l.productId, l);
    return m;
  }, [sortedLinks]);

  const attachCatalogSorted = useMemo(() => {
    if (!linkCatalogProducts?.length) return [];
    return [...linkCatalogProducts].sort((a, b) => a.name.localeCompare(b.name));
  }, [linkCatalogProducts]);

  const toggleProductLink = useCallback(
    (productId: string, checked: boolean) => {
      if (checked) {
        if (linkByProductId.has(productId)) return;
        const now = new Date().toISOString();
        upsertLink({
          id: `lnk-${Date.now()}`,
          programId: programDraft.id,
          productId,
          commissionRate: null,
          commissionType: null,
          currency: null,
          effectiveFrom: now,
          expiresAt: null,
          contactName: null,
          contactEmail: null,
          contactPhone: null,
          notes: null,
          amenities: null,
          status: "active",
          createdBy: "admin",
          createdAt: now,
          updatedAt: now,
        });
      } else {
        const row = linkByProductId.get(productId);
        if (row) removeLink(row.id);
      }
    },
    [linkByProductId, programDraft.id, removeLink, upsertLink]
  );

  const displayLinks = useMemo(() => {
    const list = [...sortedLinks];
    const nameOf = (row: ProductProgramLink) => productNameForId(row.productId).toLowerCase();
    list.sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
    return list;
  }, [sortedLinks, productNameForId]);

  const customAmenities = programDraft.customAmenities ?? [];

  const linkCardsCompact = !programDraft.hasPropertyLevelOverrides;

  const linkedProductIdsList = useMemo(() => sortedLinks.map((l) => l.productId), [sortedLinks]);

  useEffect(() => {
    if (!highlightIncentiveId) return;
    const scrollTid = window.setTimeout(() => {
      document.getElementById(`pp-incentive-${highlightIncentiveId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 0);
    const clearTid = window.setTimeout(() => setHighlightIncentiveId(null), 2600);
    return () => {
      window.clearTimeout(scrollTid);
      window.clearTimeout(clearTid);
    };
  }, [highlightIncentiveId]);

  const addIncentiveForAnchor = useCallback(
    (anchorProductId: string) => {
      const id = `promo-${Date.now()}`;
      const now = new Date().toISOString();
      const d = new Date();
      const start = d.toISOString().slice(0, 10);
      const bookEnd = new Date(d);
      bookEnd.setMonth(bookEnd.getMonth() + 3);
      const travelEnd = new Date(d);
      travelEnd.setMonth(travelEnd.getMonth() + 6);
      const base = parseRateNumber(programDraft.commissionRate) ?? 0;
      const programWide =
        anchorProductId === ANCHOR_PROGRAM_WIDE || linkedProductIdsList.length === 0;
      const productIds: string[] | "all" = programWide ? "all" : [anchorProductId];
      const name = programWide ? "" : `Incentive — ${productNameForId(anchorProductId)}`;
      upsertIncentive({
        id,
        programId: programDraft.id,
        productIds,
        name,
        rateValue: `${base}%`,
        rateType: "percentage",
        stacksWithBase: true,
        bookingWindowStart: `${start}T12:00:00.000Z`,
        bookingWindowEnd: `${bookEnd.toISOString().slice(0, 10)}T12:00:00.000Z`,
        travelWindowStart: `${start}T12:00:00.000Z`,
        travelWindowEnd: `${travelEnd.toISOString().slice(0, 10)}T12:00:00.000Z`,
        volumeThreshold: null,
        volumeMetric: null,
        volumeRetroactive: false,
        eligibilityNotes: null,
        createdBy: "admin",
        createdAt: now,
        updatedAt: now,
        updatedBy: "admin",
      });
      setHighlightIncentiveId(id);
    },
    [
      linkedProductIdsList,
      programDraft.commissionRate,
      programDraft.id,
      productNameForId,
      upsertIncentive,
    ]
  );

  const renderIncentivesBlock = (headingLabel: string) => {
    const list = sortedIncentives;
    return (
      <div className="rounded-lg border border-amber-400/25 bg-amber-400/[0.07] p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
              Temporary incentives
            </p>
            <p className="text-2xs text-muted-foreground">{headingLabel}</p>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-400/35 bg-amber-400/10 px-2.5 py-1.5 text-2xs font-medium text-amber-200 transition-colors hover:bg-amber-400/15"
            onClick={() => addIncentiveForAnchor(ANCHOR_PROGRAM_WIDE)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add incentive
          </button>
        </div>
        {list.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-inset/50 px-3 py-3 text-center text-2xs text-muted-foreground">
            No incentives yet. Add title, details, rate, optional volume metric, and booking / travel windows.
          </p>
        ) : (
          <div className="space-y-3">
            {list.map((inc) => (
              <PartnerProgramIncentiveCardEditor
                key={inc.id}
                incentive={inc}
                linkedProductIds={linkedProductIdsList}
                productNameForId={productNameForId}
                onCommit={upsertIncentive}
                onRemove={() => onRemoveIncentive(inc.id)}
                highlight={highlightIncentiveId === inc.id}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" key={programDraft.id}>
      <div id={PP_EDITOR_SECTION_IDS.basics}>
        <PartnerProgramEditorSectionHeading>Program details</PartnerProgramEditorSectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-2xs font-medium text-muted-foreground">Program name</span>
            <Input
              defaultValue={programDraft.name}
              onBlur={(e) => patchProgramDraft({ name: e.target.value })}
              className={PP_EDITOR_INPUT_CLASS}
            />
          </label>
          <label className="block min-w-0 sm:col-span-1">
            <span className="mb-1 block text-2xs font-medium text-muted-foreground">Rate</span>
            <Input
              defaultValue={programDraft.commissionRate}
              placeholder='e.g. "10%", "12.5%", "€150 flat"'
              onBlur={(e) =>
                patchProgramDraft({ commissionRate: e.target.value.trim() || programDraft.commissionRate })
              }
              className={PP_EDITOR_INPUT_CLASS}
            />
          </label>
          <label className="block min-w-0 sm:col-span-1">
            <span className="mb-1 block text-2xs font-medium text-muted-foreground">Commission type</span>
            <select
              className={PP_EDITOR_SELECT_CLASS}
              value={programDraft.commissionType}
              onChange={(e) => patchProgramDraft({ commissionType: e.target.value as CommissionKind })}
            >
              {COMMISSION_KIND_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div id={PP_EDITOR_SECTION_IDS.terms} className="space-y-4">
        <PartnerProgramEditorSectionHeading>Terms, amenities &amp; contacts</PartnerProgramEditorSectionHeading>
        <label className="flex items-start gap-2 rounded-lg border border-white/[0.12] bg-white/[0.02] p-3">
          <input
            type="checkbox"
            checked={programDraft.hasPropertyLevelOverrides}
            onChange={(e) => patchProgramDraft({ hasPropertyLevelOverrides: e.target.checked })}
            className="mt-0.5 rounded border-border"
          />
          <span className="text-xs leading-snug text-foreground">
            <span className="font-medium">Property-level overrides</span>
            <span className="block text-[11px] text-muted-foreground">
              When enabled, per-product links can override default commission and amenities; empty overrides fall back to
              these program defaults.
            </span>
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-2xs font-medium text-muted-foreground">Terms summary</span>
          <textarea
            defaultValue={programDraft.termsSummary ?? ""}
            onBlur={(e) => patchProgramDraft({ termsSummary: e.target.value || null })}
            rows={3}
            className={PP_EDITOR_TEXTAREA_CLASS}
          />
        </label>

        <div className="rounded-xl border border-border bg-inset/35 p-3 sm:p-4">
          <p className="text-xs font-medium text-foreground">Amenity tags</p>
          <p className="mt-0.5 text-2xs text-muted-foreground">
            Catalog tags and custom labels apply as program defaults for linked products.
          </p>
          <div className="mt-2">
            <ProductDirectoryAmenitiesDropdown
              embedStyle="partnerPanel"
              selected={programDraft.amenities}
              onChange={(next) => patchProgramDraft({ amenities: next })}
              customSelected={customAmenities}
              onCustomChange={(next) => patchProgramDraft({ customAmenities: next })}
            />
          </div>
        </div>

        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
          Agency contact (program)
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-2xs font-medium text-muted-foreground">Name</span>
            <Input
              defaultValue={programDraft.agencyContact.name ?? ""}
              onBlur={(e) =>
                patchProgramDraft({
                  agencyContact: {
                    ...programDraft.agencyContact,
                    name: e.target.value.trim() || null,
                  },
                })
              }
              className={PP_EDITOR_INPUT_CLASS}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-2xs font-medium text-muted-foreground">Email</span>
            <Input
              defaultValue={programDraft.agencyContact.email ?? ""}
              onBlur={(e) =>
                patchProgramDraft({
                  agencyContact: {
                    ...programDraft.agencyContact,
                    email: e.target.value.trim() || null,
                  },
                })
              }
              className={PP_EDITOR_INPUT_CLASS}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-2xs font-medium text-muted-foreground">Phone</span>
            <Input
              defaultValue={programDraft.agencyContact.phone ?? ""}
              onBlur={(e) =>
                patchProgramDraft({
                  agencyContact: {
                    ...programDraft.agencyContact,
                    phone: e.target.value.trim() || null,
                  },
                })
              }
              className={PP_EDITOR_INPUT_CLASS}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-2xs font-medium text-muted-foreground">Agreement start</span>
            <Input
              type="date"
              defaultValue={programDraft.agreementStart ? programDraft.agreementStart.slice(0, 10) : ""}
              onBlur={(e) => {
                const v = e.target.value;
                patchProgramDraft({ agreementStart: v ? `${v}T12:00:00.000Z` : null });
              }}
              className={PP_EDITOR_INPUT_CLASS}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-2xs font-medium text-muted-foreground">Renewal / expiry</span>
            <Input
              type="date"
              defaultValue={programDraft.renewalDate ? programDraft.renewalDate.slice(0, 10) : ""}
              onBlur={(e) => {
                const v = e.target.value;
                patchProgramDraft({ renewalDate: v ? `${v}T12:00:00.000Z` : null });
              }}
              className={PP_EDITOR_INPUT_CLASS}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-2xs font-medium text-muted-foreground">Agency-specific terms</span>
          <textarea
            defaultValue={programDraft.agencyTerms ?? ""}
            onBlur={(e) => patchProgramDraft({ agencyTerms: e.target.value.trim() || null })}
            rows={2}
            className={PP_EDITOR_TEXTAREA_CLASS}
          />
        </label>
      </div>

      <div id={PP_EDITOR_SECTION_IDS.links} className="space-y-3">
        <PartnerProgramEditorSectionHeading>Linked products</PartnerProgramEditorSectionHeading>
        <div className="rounded-xl border border-border bg-inset/35 p-3 sm:p-4">
          <p className="text-xs font-medium text-foreground">Attach products</p>
          {attachCatalogSorted.length > 0 ? (
            <>
              <div className="mt-2">
                <PageSearchField
                  variant="compact"
                  value={linkAttachSearch}
                  onChange={setLinkAttachSearch}
                  placeholder="Search products to attach…"
                  aria-label="Search products to attach to this program"
                />
              </div>
              <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {attachCatalogSorted
                  .filter(
                    (p) =>
                      linkByProductId.has(p.id) ||
                      productMatchesPartnerAttachSearch(p, linkAttachSearch)
                  )
                  .sort((a, b) => {
                    const ca = linkByProductId.has(a.id) ? 0 : 1;
                    const cb = linkByProductId.has(b.id) ? 0 : 1;
                    if (ca !== cb) return ca - cb;
                    return a.name.localeCompare(b.name);
                  })
                  .map((p) => {
                    const on = linkByProductId.has(p.id);
                    return (
                      <div key={p.id} className="rounded-md border border-border bg-inset p-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex min-w-0 items-center gap-2 text-2xs text-foreground">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={(e) => toggleProductLink(p.id, e.target.checked)}
                              className="checkbox-on-dark"
                            />
                            <span className="truncate">{p.name}</span>
                          </label>
                          <span className="shrink-0 text-[9px] text-muted-foreground">
                            {directoryProductTypeShortLabel(p)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : (
            <p className="mt-2 text-2xs text-muted-foreground">No product catalog on this screen.</p>
          )}
        </div>
        <div className="space-y-3">
          {sortedLinks.length === 0 ? (
            <p className="rounded-xl border border-white/[0.12] py-8 text-center text-xs text-muted-foreground">
              No products linked yet.
            </p>
          ) : (
            <div className="space-y-2">
              {displayLinks.map((row) => (
                <LinkDetailCard
                  key={row.id}
                  row={row}
                  productName={productNameForId(row.productId)}
                  upsertLink={upsertLink}
                  removeLink={removeLink}
                  compact={linkCardsCompact}
                  onAddProductIncentive={() => addIncentiveForAnchor(row.productId)}
                />
              ))}
            </div>
          )}
          {renderIncentivesBlock(
            sortedLinks.length === 0
              ? "Program-wide — link catalog products above to add property-scoped incentives."
              : "Add here for all linked products, or use Add incentive on a product card to start scoped to that property."
          )}
        </div>
      </div>
    </div>
  );
}
