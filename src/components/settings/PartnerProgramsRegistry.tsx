"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, ChevronLeft, Plus, Search, Sparkles } from "lucide-react";
import { usePartnerPrograms } from "@/contexts/PartnerProgramsContext";
import { usePermissions } from "@/hooks/usePermissions";
import { MOCK_DIRECTORY_PRODUCTS } from "@/components/products/productDirectoryMock";
import { AMENITY_GROUPS } from "@/components/products/productDirectoryFilterConfig";
import type { DirectoryAmenityTag } from "@/types/product-directory";
import { PARTNER_PROGRAMS_REFERENCE_ISO } from "@/lib/partnerProgramsSeed";
import {
  daysFromRefToDate,
  derivePromotionKind,
  formatDateShort,
  formatPromotionKindLabel,
  formatWindowLine,
  PROMOTION_REFERENCE_ISO,
  promotionDisplayPhase,
  promotionRecentlyExpired,
} from "@/lib/promotionUi";
import { parseRateNumber } from "@/lib/partnerProgramMerge";
import { validatePromotionForm } from "@/lib/promotionValidation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CommissionKind,
  LinkCommissionStatus,
  PartnerProgramType,
  Program,
  ProgramStatus,
  ProductProgramLink,
  Promotion,
  VolumeMetric,
} from "@/types/partner-programs";

const REF = new Date(PARTNER_PROGRAMS_REFERENCE_ISO);

const PROGRAM_TYPE_OPTIONS: { id: PartnerProgramType; label: string }[] = [
  { id: "preferred_partner", label: "Preferred partner" },
  { id: "consortium", label: "Consortium" },
  { id: "direct", label: "Direct" },
  { id: "wholesaler", label: "Wholesaler" },
  { id: "other", label: "Other" },
];

const COMMISSION_KIND_OPTIONS: { id: CommissionKind; label: string }[] = [
  { id: "percentage", label: "Percentage" },
  { id: "flat", label: "Flat" },
  { id: "tiered", label: "Tiered" },
  { id: "variable", label: "Variable" },
];

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

function linkRowExpiringSoon(expiresAt: string | null): boolean {
  const d = daysFromRef(expiresAt);
  return d != null && d > 0 && d <= 30;
}

function LinkDetailCard({
  row,
  productName,
  programCurrency,
  upsertLink,
  removeLink,
}: {
  row: ProductProgramLink;
  productName: string;
  programCurrency: string;
  upsertLink: (l: ProductProgramLink) => void;
  removeLink: (id: string) => void;
}) {
  const expiring = linkRowExpiringSoon(row.expiresAt);
  const patch = (partial: Partial<ProductProgramLink>) =>
    upsertLink({ ...row, ...partial, updatedAt: new Date().toISOString() });

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white/[0.02] p-3 text-xs",
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

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1">
          <span className="block text-[10px] text-muted-foreground">Commission rate (override)</span>
          <Input
            defaultValue={row.commissionRate ?? ""}
            placeholder="e.g. 10%, €150 flat — empty = program default"
            className="h-8 rounded-lg border-border bg-inset text-[11px]"
            onBlur={(e) => patch({ commissionRate: e.target.value.trim() === "" ? null : e.target.value.trim() })}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] text-muted-foreground">Commission type</span>
          <select
            className="h-8 w-full rounded-lg border border-border bg-inset px-2 text-[11px] text-foreground"
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
          <span className="block text-[10px] text-muted-foreground">Currency</span>
          <Input
            defaultValue={row.currency ?? programCurrency}
            placeholder={programCurrency}
            className="h-8 rounded-lg border-border bg-inset text-[11px]"
            onBlur={(e) => {
              const v = e.target.value.trim();
              patch({ currency: v === "" ? null : v.toUpperCase() });
            }}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] text-muted-foreground">Effective from</span>
          <Input
            type="date"
            defaultValue={row.effectiveFrom ? row.effectiveFrom.slice(0, 10) : ""}
            className="h-8 rounded-lg border-border bg-inset text-[11px]"
            onBlur={(e) => {
              const v = e.target.value;
              patch({ effectiveFrom: v ? `${v}T12:00:00.000Z` : row.effectiveFrom });
            }}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] text-muted-foreground">Expires</span>
          <Input
            type="date"
            defaultValue={row.expiresAt ? row.expiresAt.slice(0, 10) : ""}
            className="h-8 rounded-lg border-border bg-inset text-[11px]"
            onBlur={(e) => {
              const v = e.target.value;
              patch({ expiresAt: v ? `${v}T12:00:00.000Z` : null });
            }}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] text-muted-foreground">Link status</span>
          <select
            className="h-8 w-full rounded-lg border border-border bg-inset px-2 text-[11px] text-foreground"
            value={row.status}
            onChange={(e) => patch({ status: e.target.value as LinkCommissionStatus })}
          >
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
        </label>
        <label className="space-y-1 sm:col-span-2 lg:col-span-1">
          <span className="block text-[10px] text-muted-foreground">Contact name (product-specific)</span>
          <Input
            defaultValue={row.contactName ?? ""}
            className="h-8 rounded-lg border-border bg-inset text-[11px]"
            onBlur={(e) => patch({ contactName: e.target.value.trim() || null })}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] text-muted-foreground">Contact email</span>
          <Input
            defaultValue={row.contactEmail ?? ""}
            className="h-8 rounded-lg border-border bg-inset text-[11px]"
            onBlur={(e) => patch({ contactEmail: e.target.value.trim() || null })}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] text-muted-foreground">Contact phone</span>
          <Input
            defaultValue={row.contactPhone ?? ""}
            className="h-8 rounded-lg border-border bg-inset text-[11px]"
            onBlur={(e) => patch({ contactPhone: e.target.value.trim() || null })}
          />
        </label>
        <label className="space-y-1 sm:col-span-2 lg:col-span-3">
          <span className="block text-[10px] text-muted-foreground">Notes</span>
          <textarea
            defaultValue={row.notes ?? ""}
            rows={2}
            placeholder="e.g. Only applies to suite categories"
            className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-[11px] text-foreground outline-none"
            onBlur={(e) => patch({ notes: e.target.value.trim() || null })}
          />
        </label>
      </div>

      <div className="mt-3 space-y-3 border-t border-border pt-3">
        <span className="block text-[10px] text-muted-foreground">
          Amenity tags (property-level override when the program enables overrides)
        </span>
        {AMENITY_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground/80">{group.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.tags.map((t) => (
                <label
                  key={t.id}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-inset px-2 py-1 text-[10px] text-foreground has-[:checked]:border-brand-cta/45 has-[:checked]:bg-[rgba(201,169,110,0.08)]"
                >
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={(row.amenities ?? []).includes(t.id as DirectoryAmenityTag)}
                    onChange={(e) => {
                      const next = new Set(row.amenities ?? []);
                      if (e.target.checked) next.add(t.id as DirectoryAmenityTag);
                      else next.delete(t.id as DirectoryAmenityTag);
                      const arr = [...next];
                      patch({ amenities: arr.length > 0 ? arr : null });
                    }}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {expiring ? (
        <p className="mt-2 text-[10px] text-[#A66B6B]/90">Expires within 30 days — renew or update terms.</p>
      ) : null}
    </div>
  );
}

export default function PartnerProgramsRegistry() {
  const router = useRouter();
  const { isAdmin } = usePermissions();
  const { snapshot, upsertProgram, upsertLink, upsertPromotion, removeLink, removePromotion } =
    usePartnerPrograms();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoEditing, setPromoEditing] = useState<Promotion | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const selected = useMemo(
    () => snapshot.programs.find((p) => p.id === selectedId) ?? null,
    [snapshot.programs, selectedId]
  );

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

  const promosForSelected = useMemo(
    () => snapshot.promotions.filter((p) => p.programId === selectedId),
    [snapshot.promotions, selectedId]
  );

  const promoRefDate = useMemo(() => new Date(PROMOTION_REFERENCE_ISO), []);
  const sortedPromotions = useMemo(() => {
    const list = [...promosForSelected];
    const rank = (p: Promotion) => {
      const ph = promotionDisplayPhase(p, promoRefDate);
      if (ph === "active") return 0;
      if (ph === "upcoming") return 1;
      return 2;
    };
    list.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
    return list;
  }, [promosForSelected, promoRefDate]);

  const [sortKey, setSortKey] = useState<"product" | "rate" | "expiry">("product");
  const sortedLinks = useMemo(() => {
    const list = [...linksForSelected];
    const productName = (id: string) =>
      MOCK_DIRECTORY_PRODUCTS.find((p) => p.id === id)?.name ?? id;
    list.sort((a, b) => {
      if (sortKey === "product") return productName(a.productId).localeCompare(productName(b.productId));
      if (sortKey === "rate") {
        return (parseRateNumber(a.commissionRate ?? "") ?? 0) - (parseRateNumber(b.commissionRate ?? "") ?? 0);
      }
      const ae = a.expiresAt ?? "";
      const be = b.expiresAt ?? "";
      return ae.localeCompare(be);
    });
    return list;
  }, [linksForSelected, sortKey]);

  const onSaveProgramPatch = useCallback(
    (patch: Partial<Program>) => {
      if (!selected) return;
      upsertProgram({
        ...selected,
        ...patch,
        updatedAt: new Date().toISOString(),
      });
    },
    [selected, upsertProgram]
  );

  useEffect(() => {
    if (!isAdmin) router.replace("/dashboard/settings");
  }, [isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Settings
      </Link>

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
        <Button type="button" className="gap-1 rounded-xl" onClick={() => setAddOpen(true)}>
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

      <Dialog open={selectedId != null} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-border bg-background p-0">
          {selected ? (
            <>
              <DialogHeader className="border-b border-border px-6 py-4">
                <DialogTitle className="text-left text-lg">{selected.name}</DialogTitle>
                <p className="text-left text-xs text-muted-foreground">{selected.network ?? "Direct"}</p>
              </DialogHeader>
              <div className="max-h-[calc(90vh-8rem)] overflow-y-auto px-6 py-4">
                <div className="space-y-6" key={selected.id}>
                  <section className="space-y-4">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Program</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Name</span>
                        <Input
                          defaultValue={selected.name}
                          onBlur={(e) => onSaveProgramPatch({ name: e.target.value })}
                          className="rounded-lg border-border bg-inset"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Network</span>
                        <Input
                          defaultValue={selected.network ?? ""}
                          onBlur={(e) => onSaveProgramPatch({ network: e.target.value || null })}
                          className="rounded-lg border-border bg-inset"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Program type</span>
                        <select
                          className="h-10 w-full rounded-lg border border-border bg-inset px-2 text-sm text-foreground"
                          value={selected.type}
                          onChange={(e) => onSaveProgramPatch({ type: e.target.value as PartnerProgramType })}
                        >
                          {PROGRAM_TYPE_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Lifecycle status</span>
                        <select
                          className="h-10 w-full rounded-lg border border-border bg-inset px-2 text-sm text-foreground"
                          value={selected.status}
                          onChange={(e) => onSaveProgramPatch({ status: e.target.value as ProgramStatus })}
                        >
                          <option value="active">Active</option>
                          <option value="expiring">Expiring</option>
                          <option value="expired">Expired</option>
                          <option value="paused">Paused</option>
                          <option value="archived">Archived</option>
                        </select>
                      </label>
                    </div>

                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Default commission (program-wide)
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1 sm:col-span-2">
                        <span className="text-[11px] text-muted-foreground">Rate string</span>
                        <Input
                          defaultValue={selected.commissionRate}
                          placeholder='e.g. "10%", "12.5%", "€150 flat"'
                          onBlur={(e) => onSaveProgramPatch({ commissionRate: e.target.value.trim() || selected.commissionRate })}
                          className="rounded-lg border-border bg-inset"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Commission type</span>
                        <select
                          className="h-10 w-full rounded-lg border border-border bg-inset px-2 text-sm text-foreground"
                          value={selected.commissionType}
                          onChange={(e) => onSaveProgramPatch({ commissionType: e.target.value as CommissionKind })}
                        >
                          {COMMISSION_KIND_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Currency</span>
                        <Input
                          defaultValue={selected.commissionCurrency}
                          onBlur={(e) =>
                            onSaveProgramPatch({
                              commissionCurrency: e.target.value.trim().toUpperCase() || "EUR",
                            })
                          }
                          placeholder="EUR"
                          className="rounded-lg border-border bg-inset"
                        />
                      </label>
                    </div>

                    <label className="flex items-start gap-2 rounded-lg border border-border bg-white/[0.02] p-3">
                      <input
                        type="checkbox"
                        checked={selected.hasPropertyLevelOverrides}
                        onChange={(e) => onSaveProgramPatch({ hasPropertyLevelOverrides: e.target.checked })}
                        className="mt-0.5 rounded border-border"
                      />
                      <span className="text-xs leading-snug text-foreground">
                        <span className="font-medium">Property-level overrides</span>
                        <span className="block text-[11px] text-muted-foreground">
                          When enabled, per-product links can override default commission and amenities; empty overrides fall back to these program defaults.
                        </span>
                      </span>
                    </label>

                    <label className="space-y-1">
                      <span className="text-[11px] text-muted-foreground">Terms summary</span>
                      <textarea
                        defaultValue={selected.termsSummary ?? ""}
                        onBlur={(e) => onSaveProgramPatch({ termsSummary: e.target.value || null })}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-inset px-3 py-2 text-sm text-foreground outline-none"
                      />
                    </label>

                    <div className="space-y-2 border-t border-border pt-4">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Default amenities (program-wide)
                      </p>
                      {AMENITY_GROUPS.map((group) => (
                        <div key={group.label}>
                          <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground/80">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {group.tags.map((t) => (
                              <label
                                key={t.id}
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-inset px-2 py-1 text-[10px] text-foreground has-[:checked]:border-brand-cta/45 has-[:checked]:bg-[rgba(201,169,110,0.08)]"
                              >
                                <input
                                  type="checkbox"
                                  className="rounded border-border"
                                  checked={selected.amenities.includes(t.id as DirectoryAmenityTag)}
                                  onChange={(e) => {
                                    const next = new Set(selected.amenities);
                                    if (e.target.checked) next.add(t.id as DirectoryAmenityTag);
                                    else next.delete(t.id as DirectoryAmenityTag);
                                    onSaveProgramPatch({ amenities: [...next] });
                                  }}
                                />
                                {t.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Agency contact (program)
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Name</span>
                        <Input
                          defaultValue={selected.agencyContact.name ?? ""}
                          onBlur={(e) =>
                            onSaveProgramPatch({
                              agencyContact: {
                                ...selected.agencyContact,
                                name: e.target.value.trim() || null,
                              },
                            })
                          }
                          className="rounded-lg border-border bg-inset"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Email</span>
                        <Input
                          defaultValue={selected.agencyContact.email ?? ""}
                          onBlur={(e) =>
                            onSaveProgramPatch({
                              agencyContact: {
                                ...selected.agencyContact,
                                email: e.target.value.trim() || null,
                              },
                            })
                          }
                          className="rounded-lg border-border bg-inset"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Phone</span>
                        <Input
                          defaultValue={selected.agencyContact.phone ?? ""}
                          onBlur={(e) =>
                            onSaveProgramPatch({
                              agencyContact: {
                                ...selected.agencyContact,
                                phone: e.target.value.trim() || null,
                              },
                            })
                          }
                          className="rounded-lg border-border bg-inset"
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Agreement start</span>
                        <Input
                          type="date"
                          defaultValue={selected.agreementStart ? selected.agreementStart.slice(0, 10) : ""}
                          onBlur={(e) => {
                            const v = e.target.value;
                            onSaveProgramPatch({ agreementStart: v ? `${v}T12:00:00.000Z` : null });
                          }}
                          className="rounded-lg border-border bg-inset"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Renewal / expiry</span>
                        <Input
                          type="date"
                          defaultValue={selected.renewalDate ? selected.renewalDate.slice(0, 10) : ""}
                          onBlur={(e) => {
                            const v = e.target.value;
                            onSaveProgramPatch({ renewalDate: v ? `${v}T12:00:00.000Z` : null });
                          }}
                          className="rounded-lg border-border bg-inset"
                        />
                      </label>
                    </div>

                    <label className="space-y-1">
                      <span className="text-[11px] text-muted-foreground">Internal notes</span>
                      <textarea
                        defaultValue={selected.notes ?? ""}
                        onBlur={(e) => onSaveProgramPatch({ notes: e.target.value.trim() || null })}
                        rows={2}
                        className="w-full rounded-lg border border-border bg-inset px-3 py-2 text-sm text-foreground outline-none"
                      />
                    </label>

                    <p className="text-[10px] text-muted-foreground">
                      Agency ID <span className="font-mono text-foreground/80">{selected.agencyId}</span> · Created{" "}
                      {selected.createdAt.slice(0, 10)} · {selected.createdBy}
                    </p>
                  </section>

                  <section className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Linked products</h3>
                      <Button type="button" variant="secondary" size="sm" className="h-8 text-xs" onClick={() => setLinkOpen(true)}>
                        + Link product
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="uppercase tracking-wide">Sort:</span>
                      <button type="button" className="rounded-md border border-border px-2 py-1 hover:bg-white/[0.04]" onClick={() => setSortKey("product")}>
                        Product
                      </button>
                      <button type="button" className="rounded-md border border-border px-2 py-1 hover:bg-white/[0.04]" onClick={() => setSortKey("rate")}>
                        Rate
                      </button>
                      <button type="button" className="rounded-md border border-border px-2 py-1 hover:bg-white/[0.04]" onClick={() => setSortKey("expiry")}>
                        Expiry
                      </button>
                    </div>
                    <div className="space-y-3">
                      {sortedLinks.length === 0 ? (
                        <p className="rounded-xl border border-border py-8 text-center text-xs text-muted-foreground">
                          No products linked yet.
                        </p>
                      ) : (
                        sortedLinks.map((row) => {
                          const pname = MOCK_DIRECTORY_PRODUCTS.find((x) => x.id === row.productId)?.name ?? row.productId;
                          return (
                            <LinkDetailCard
                              key={row.id}
                              row={row}
                              productName={pname}
                              programCurrency={selected.commissionCurrency}
                              upsertLink={upsertLink}
                              removeLink={removeLink}
                            />
                          );
                        })
                      )}
                    </div>
                  </section>

                  <section className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Temporary incentives</h3>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Limited-time rates and bonuses (overrides, seasonal lifts, volume targets). Shown in the product
                          directory when active.
                        </p>
                        {linksForSelected.length === 0 ? (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Link products under “Linked properties” first if you want to limit an incentive to specific
                            hotels — the picker only lists products already on this program.
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setPromoEditing(null);
                          setPromoOpen(true);
                        }}
                      >
                        + Add incentive
                      </Button>
                    </div>
                    <ul className="space-y-2">
                      {sortedPromotions.map((pr) => {
                        const phase = promotionDisplayPhase(pr, promoRefDate);
                        const upcomingStart =
                          phase === "upcoming" ? pr.bookingWindowStart ?? pr.travelWindowStart : null;
                        const daysToStart = upcomingStart
                          ? daysFromRefToDate(promoRefDate, upcomingStart)
                          : null;
                        const dimExpired = promotionRecentlyExpired(pr, promoRefDate);
                        return (
                          <li
                            key={pr.id}
                            className={cn(
                              "rounded-xl border border-border bg-white/[0.02] px-3 py-2.5 text-xs",
                              dimExpired && "opacity-55"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                                  <Sparkles className="h-3 w-3 shrink-0 text-brand-cta" aria-hidden />
                                  <span className="truncate">{pr.name}</span>
                                  {phase === "active" ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(130,160,130,0.2)] px-1.5 py-0.5 text-[9px] font-medium text-foreground/90">
                                      <span className="relative flex h-1.5 w-1.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/80 opacity-75" />
                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                      </span>
                                      Active
                                    </span>
                                  ) : phase === "upcoming" ? (
                                    <span className="rounded-full bg-[rgba(200,160,90,0.2)] px-1.5 py-0.5 text-[9px] font-medium text-foreground/90">
                                      Upcoming
                                      {daysToStart != null && daysToStart > 0
                                        ? ` · starts in ${daysToStart}d`
                                        : null}
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                                      Ended
                                    </span>
                                  )}
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  {formatPromotionKindLabel(derivePromotionKind(pr))} · {pr.rateValue}
                                  {pr.rateType === "flat" ? " (flat)" : " (%)"}
                                  {pr.stacksWithBase ? " · stacks with base" : ""}
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground/90">
                                  {formatWindowLine("Book", pr.bookingWindowStart, pr.bookingWindowEnd)}
                                </p>
                                <p className="text-[10px] text-muted-foreground/90">
                                  {formatWindowLine("Travel", pr.travelWindowStart, pr.travelWindowEnd)}
                                </p>
                                {derivePromotionKind(pr) === "volume_incentive" ? (
                                  <p className="mt-1 text-[10px] text-muted-foreground">
                                    Volume: {pr.volumeThreshold ?? "—"}{" "}
                                    {pr.volumeMetric?.replace("_", " ") ?? ""}
                                    {pr.volumeRetroactive ? " · retroactive (info)" : ""}
                                  </p>
                                ) : null}
                                {pr.eligibilityNotes ? (
                                  <p className="mt-1 text-[10px] italic text-muted-foreground">{pr.eligibilityNotes}</p>
                                ) : null}
                                <p className="mt-1 text-[9px] text-muted-foreground/70">
                                  Applies to:{" "}
                                  {pr.productIds === "all"
                                    ? "All linked products"
                                    : `${pr.productIds.length} product(s)`}
                                </p>
                                <p className="mt-1 text-[9px] text-muted-foreground/60">
                                  Created {formatDateShort(pr.createdAt)} · {pr.createdBy}
                                </p>
                                <p className="mt-0.5 text-[9px] text-muted-foreground/60">
                                  Updated {formatDateShort(pr.updatedAt)} · {pr.updatedBy}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7"
                                  onClick={() => {
                                    setPromoEditing(pr);
                                    setPromoOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[#A66B6B]/90"
                                  onClick={() => removePromotion(pr.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                      {sortedPromotions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No temporary incentives for this program.</p>
                      ) : null}
                    </ul>
                  </section>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AddProgramDialog open={addOpen} onOpenChange={setAddOpen} upsertProgram={upsertProgram} />

      <LinkProductDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        programId={selectedId}
        defaultCurrency={selected?.commissionCurrency ?? "EUR"}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        upsertLink={upsertLink}
        existingProductIds={linkedProductIds}
      />

      <AddPromotionDialog
        open={promoOpen}
        onOpenChange={(v) => {
          setPromoOpen(v);
          if (!v) setPromoEditing(null);
        }}
        programId={selectedId}
        linkedProductIds={linkedProductIds}
        editingPromotion={promoEditing}
        upsertPromotion={upsertPromotion}
      />
    </div>
  );
}

function AddProgramDialog({
  open,
  onOpenChange,
  upsertProgram,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  upsertProgram: (p: Program) => void;
}) {
  const [name, setName] = useState("");
  const [network, setNetwork] = useState("");
  const [rate, setRate] = useState("10%");
  const [ptype, setPtype] = useState<PartnerProgramType>("preferred_partner");
  const [commKind, setCommKind] = useState<CommissionKind>("percentage");
  const [currency, setCurrency] = useState("EUR");

  const save = () => {
    const id = `reg-${Date.now()}`;
    const now = new Date().toISOString();
    upsertProgram({
      id,
      name: name.trim() || "New program",
      network: network.trim() || null,
      type: ptype,
      termsSummary: null,
      commissionRate: rate.trim() || "10%",
      commissionType: commKind,
      commissionCurrency: currency.trim().toUpperCase() || "EUR",
      amenities: [],
      hasPropertyLevelOverrides: false,
      agencyContact: { name: null, email: null, phone: null },
      agreementStart: null,
      renewalDate: null,
      status: "active",
      notes: null,
      agencyId: "tl-demo",
      createdBy: "admin",
      createdAt: now,
      updatedAt: now,
    });
    onOpenChange(false);
    setName("");
    setNetwork("");
    setRate("10%");
    setPtype("preferred_partner");
    setCommKind("percentage");
    setCurrency("EUR");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add program</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border-border bg-inset" />
          </div>
          <div className="space-y-1">
            <Label>Network</Label>
            <Input value={network} onChange={(e) => setNetwork(e.target.value)} className="rounded-lg border-border bg-inset" />
          </div>
          <div className="space-y-1">
            <Label>Program type</Label>
            <select
              value={ptype}
              onChange={(e) => setPtype(e.target.value as PartnerProgramType)}
              className="h-10 w-full rounded-lg border border-border bg-inset px-2 text-sm"
            >
              {PROGRAM_TYPE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Default commission (string)</Label>
            <Input value={rate} onChange={(e) => setRate(e.target.value)} className="rounded-lg border-border bg-inset" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Commission type</Label>
              <select
                value={commKind}
                onChange={(e) => setCommKind(e.target.value as CommissionKind)}
                className="h-10 w-full rounded-lg border border-border bg-inset px-2 text-sm"
              >
                {COMMISSION_KIND_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-lg border-border bg-inset" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={save}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LinkProductDialog({
  open,
  onOpenChange,
  programId,
  defaultCurrency,
  productSearch,
  setProductSearch,
  upsertLink,
  existingProductIds,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  programId: string | null;
  defaultCurrency: string;
  productSearch: string;
  setProductSearch: (v: string) => void;
  upsertLink: (l: ProductProgramLink) => void;
  existingProductIds: string[];
}) {
  const filtered = useMemo(() => {
    const qq = productSearch.trim().toLowerCase();
    return MOCK_DIRECTORY_PRODUCTS.filter((p) => {
      if (existingProductIds.includes(p.id)) return false;
      if (!qq) return true;
      return p.name.toLowerCase().includes(qq) || p.location.toLowerCase().includes(qq);
    }).slice(0, 12);
  }, [productSearch, existingProductIds]);

  const pick = (productId: string) => {
    if (!programId) return;
    const now = new Date().toISOString();
    upsertLink({
      id: `lnk-${Date.now()}`,
      programId,
      productId,
      commissionRate: null,
      commissionType: null,
      currency: defaultCurrency,
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
    onOpenChange(false);
    setProductSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link product</DialogTitle>
        </DialogHeader>
        <Input
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          placeholder="Search catalog…"
          className="rounded-lg border-border bg-inset"
        />
        <ul className="max-h-64 space-y-1 overflow-y-auto py-2">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => pick(p.id)}
                className="flex w-full flex-col rounded-lg border border-transparent px-2 py-1.5 text-left text-sm hover:border-border hover:bg-white/[0.04]"
              >
                <span className="font-medium text-foreground">{p.name}</span>
                <span className="text-[11px] text-muted-foreground">{p.location}</span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
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

function AddPromotionDialog({
  open,
  onOpenChange,
  programId,
  linkedProductIds,
  editingPromotion,
  upsertPromotion,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  programId: string | null;
  linkedProductIds: string[];
  editingPromotion: Promotion | null;
  upsertPromotion: (p: Promotion) => void;
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
  const [volumeThreshold, setVolumeThreshold] = useState("");
  const [volumeMetric, setVolumeMetric] = useState<VolumeMetric | "">("");
  const [volumeRetroactive, setVolumeRetroactive] = useState(false);
  const [eligibilityNotes, setEligibilityNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSaveError(null);
    const e = editingPromotion;
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
      setVolumeThreshold(
        e.volumeThreshold != null && Number.isFinite(e.volumeThreshold) ? String(e.volumeThreshold) : ""
      );
      setVolumeMetric(e.volumeMetric ?? "");
      setVolumeRetroactive(e.volumeRetroactive);
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
    setVolumeThreshold("");
    setVolumeMetric("");
    setVolumeRetroactive(false);
    setEligibilityNotes("");
  }, [open, editingPromotion, linkedProductIds]);

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = () => {
    if (!programId) return;
    const err = validatePromotionForm({
      bookingStart,
      bookingEnd,
      travelStart,
      travelEnd,
      volumeThreshold,
      volumeMetric,
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
    const isEdit = editingPromotion != null;
    const id = isEdit ? editingPromotion.id : `promo-${Date.now()}`;
    const volumeMetricParsed = volumeMetric !== "" ? volumeMetric : null;

    const productIds: string[] | "all" =
      scopeAll || linkedProductIds.length === 0 ? "all" : selectedProducts;

    upsertPromotion({
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
      volumeThreshold:
        volumeMetricParsed != null && volumeThreshold.trim() !== ""
          ? Number(volumeThreshold)
          : null,
      volumeMetric: volumeMetricParsed,
      volumeRetroactive: volumeMetricParsed != null ? volumeRetroactive : false,
      eligibilityNotes: eligibilityNotes.trim() || null,
      createdBy: isEdit ? editingPromotion.createdBy : "admin",
      createdAt: isEdit ? editingPromotion.createdAt : now,
      updatedAt: now,
      updatedBy: "admin",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingPromotion ? "Edit time-bound incentive" : "Add time-bound incentive"}</DialogTitle>
          <p className="text-[11px] text-muted-foreground">
            Active / upcoming / ended and promotion kind (override, bonus, seasonal, volume) are inferred from dates,
            stacking, volume metric, and travel windows — not stored as separate fields.
          </p>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border-border bg-inset" placeholder="Q1 booking bonus" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Rate value</Label>
              <Input
                value={rateValue}
                onChange={(e) => setRateValue(e.target.value)}
                className="rounded-lg border-border bg-inset"
                placeholder={rateType === "flat" ? "e.g. €150" : "15% or +2%"}
              />
            </div>
            <div className="space-y-1">
              <Label>Rate type</Label>
              <select
                value={rateType}
                onChange={(e) => setRateType(e.target.value as "percentage" | "flat")}
                className="h-10 w-full rounded-lg border border-border bg-inset px-2 text-sm"
              >
                <option value="percentage">Percentage</option>
                <option value="flat">Flat</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={stacksWithBase}
              onChange={(e) => setStacksWithBase(e.target.checked)}
              className="rounded border-border"
            />
            Stacks with base commission (bonus-style; off = override / seasonal-style)
          </label>
          <p className="text-[10px] text-muted-foreground">
            Seasonal vs rate override: when not stacking, travel window dates imply a seasonal shape; booking-only
            windows read as an override.
          </p>

          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Windows (optional)</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Book from</Label>
              <Input type="date" value={bookingStart} onChange={(e) => setBookingStart(e.target.value)} className="rounded-lg border-border bg-inset" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Book until</Label>
              <Input type="date" value={bookingEnd} onChange={(e) => setBookingEnd(e.target.value)} className="rounded-lg border-border bg-inset" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Travel from</Label>
              <Input type="date" value={travelStart} onChange={(e) => setTravelStart(e.target.value)} className="rounded-lg border-border bg-inset" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Travel until</Label>
              <Input type="date" value={travelEnd} onChange={(e) => setTravelEnd(e.target.value)} className="rounded-lg border-border bg-inset" />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-white/[0.02] p-3">
            <p className="text-[10px] font-medium uppercase text-muted-foreground">Volume incentive (optional)</p>
            <p className="text-[10px] text-muted-foreground">
              Choose a metric to mark this as a volume incentive. Threshold is optional; some programs have no minimum.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px]">Volume metric</Label>
                <select
                  value={volumeMetric}
                  onChange={(e) => setVolumeMetric(e.target.value as VolumeMetric | "")}
                  className="h-10 w-full rounded-lg border border-border bg-inset px-2 text-sm"
                >
                  <option value="">None (not a volume incentive)</option>
                  <option value="room_nights">Room nights</option>
                  <option value="bookings">Bookings</option>
                  <option value="revenue">Revenue</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Threshold (optional)</Label>
                <Input
                  value={volumeThreshold}
                  onChange={(e) => setVolumeThreshold(e.target.value)}
                  inputMode="numeric"
                  disabled={volumeMetric === ""}
                  className="rounded-lg border-border bg-inset disabled:opacity-50"
                  placeholder="e.g. 10"
                />
              </div>
            </div>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={volumeRetroactive}
                disabled={volumeMetric === ""}
                onChange={(e) => setVolumeRetroactive(e.target.checked)}
                className="mt-0.5 rounded border-border disabled:opacity-50"
              />
              <span>
                Retroactive in window — informational for advisors (whether past bookings in the window count toward
                the threshold). Does not change how booking windows are validated.
              </span>
            </label>
          </div>

          <div className="space-y-1">
            <Label>Eligibility notes</Label>
            <textarea
              value={eligibilityNotes}
              onChange={(e) => setEligibilityNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-sm"
              placeholder="Suite categories only, new bookings only…"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-white/[0.02] p-3">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="radio"
                checked={scopeAll}
                onChange={() => setScopeAll(true)}
                className="border-border"
              />
              All products linked to this program
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="radio"
                checked={!scopeAll}
                onChange={() => setScopeAll(false)}
                className="border-border"
                disabled={linkedProductIds.length === 0}
              />
              Specific linked products
            </label>
            {!scopeAll && linkedProductIds.length > 0 ? (
              <div className="ml-6 flex max-h-32 flex-col gap-1 overflow-y-auto">
                {linkedProductIds.map((pid) => {
                  const p = MOCK_DIRECTORY_PRODUCTS.find((x) => x.id === pid);
                  return (
                    <label key={pid} className="flex items-center gap-2 text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(pid)}
                        onChange={() => toggleProduct(pid)}
                        className="rounded border-border"
                      />
                      {p?.name ?? pid}
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
        {saveError ? (
          <p role="alert" className="rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {saveError}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={save}>
            {editingPromotion ? "Save changes" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
