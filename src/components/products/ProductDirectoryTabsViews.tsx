"use client";

import { useEffect, useState } from "react";
import { Award, ChevronRight, Search } from "lucide-react";
import type {
  DirectoryCollectionOption,
  DirectoryPartnerProgram,
  DirectoryProduct,
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
  if (collections.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">
        <p className="text-[13px] font-medium text-[#F5F0EB]">No collections yet</p>
        <p className="mt-1 text-[11px] text-[#6B6560]">Create a collection from a product or ask your admin.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {collections.map((col) => {
        const members = productsInDirectoryCollection(col, products);
        const preview = members.slice(0, 4);
        const placeholders = 4 - preview.length;

        return (
          <button
            key={col.id}
            type="button"
            onClick={() => onOpenCollection(col.id)}
            className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0c12] text-left transition-colors hover:border-[rgba(201,169,110,0.2)] hover:bg-[#101018]"
          >
            <div className="grid aspect-[4/3] grid-cols-2 gap-0.5 bg-[#08080c] p-0.5">
              {preview.map((p) => (
                <div key={p.id} className="relative min-h-0 overflow-hidden bg-[#14141c]">
                  <img src={p.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
              {placeholders > 0
                ? Array.from({ length: placeholders }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex min-h-[3.5rem] items-center justify-center bg-[#0e0e14] text-[9px] text-[#3a3632]"
                    >
                      Empty
                    </div>
                  ))
                : null}
            </div>
            <div className="flex items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[#F5F0EB]">{col.name}</p>
                {col.description ? (
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#6B6560]">{col.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-[#9B9590]">
                    {members.length} product{members.length !== 1 ? "s" : ""}
                  </span>
                  <ScopeBadge scope={collectionScopeForBadge(col)} teams={teams} />
                </div>
              </div>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#4A4540] transition-colors group-hover:text-[#C9A96E]" />
            </div>
          </button>
        );
      })}
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

type PartnerPortalTabProps = {
  products: DirectoryProduct[];
  teams: Team[];
  canViewCommissions: boolean;
  isAdmin?: boolean;
  onSelectProduct: (productId: string) => void;
  onAdminSaveProgram?: (programKey: string, payload: PartnerPortalAdminSavePayload) => boolean;
};

export function ProductDirectoryPartnerPortalTab({
  products,
  teams,
  canViewCommissions,
  isAdmin = false,
  onSelectProduct,
  onAdminSaveProgram,
}: PartnerPortalTabProps) {
  const rows = buildPartnerPortalRows(products);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DirectoryPartnerProgram>>({});
  const [attachedDraftIds, setAttachedDraftIds] = useState<Record<string, string[]>>({});
  const [useProductSpecificTerms, setUseProductSpecificTerms] = useState<Record<string, boolean>>({});
  const [productOverrides, setProductOverrides] = useState<
    Record<string, Record<string, { commissionRate: number | null; amenities: string }>>
  >({});
  const [attachProductSearchQuery, setAttachProductSearchQuery] = useState("");

  useEffect(() => {
    setAttachProductSearchQuery("");
  }, [editingKey]);

  const beginEdit = (key: string, program: DirectoryPartnerProgram, attached: DirectoryProduct[]) => {
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
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">
        <Award className="mx-auto mb-3 h-8 w-8 text-[#4A4540]" aria-hidden />
        <p className="text-[13px] font-medium text-[#F5F0EB]">No partner programs</p>
        <p className="mt-1 text-[11px] text-[#6B6560]">Programs appear here when products are linked to a partner program.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map(({ key, program, products: attached }) => {
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
        const attachedChanged =
          attachedDraft.length !== attached.length || attached.some((p) => !attachedDraft.includes(p.id));
        const overridesChanged = (() => {
          if (!isEditing) return false;
          const current = productOverrides[key] ?? {};
          return attached.some((p) => {
            const match = p.partnerPrograms.find((pp) => programFilterId(pp) === key);
            const c = current[p.id];
            if (!c) return false;
            return (match?.commissionRate ?? null) !== c.commissionRate || (match?.amenities ?? "") !== c.amenities;
          });
        })();
        const varianceNow = useProductSpecificTerms[key] ?? false;
        const varianceInitial =
          new Set(
            attached.map((p) => {
              const match = p.partnerPrograms.find((pp) => programFilterId(pp) === key);
              return `${match?.commissionRate ?? ""}::${match?.amenities ?? ""}`;
            })
          ).size > 1;
        const hasUnsaved = isEditing
          ? programChanged(program, display) ||
            attachedChanged ||
            overridesChanged ||
            varianceNow !== varianceInitial
          : false;

        return (
          <div
            key={key}
            className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c0c12]"
          >
            <div className="border-b border-white/[0.05] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Award className="h-4 w-4 shrink-0 text-[#C9A96E]" />
                    <h3 className="text-[14px] font-semibold text-[#F5F0EB]">{programDisplayName(display)}</h3>
                    {!bookable ? (
                      <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[8px] uppercase text-[#6B6560]">
                        Inactive / expired
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#9B9590]">
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
                      <span className="text-[#6B6560]">
                        Until{" "}
                        {new Date(display.expiryDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    ) : null}
                    {display.contact ? <span className="text-[#6B6560]">· {display.contact}</span> : null}
                    {hasProductVariance ? (
                      <span className="text-[8px] font-normal normal-case tracking-normal text-[#6B6560]">
                        · terms vary by product
                      </span>
                    ) : null}
                  </div>
                  {display.amenities ? (
                    <p className="mt-2 text-[11px] leading-relaxed text-[#9B9590]">{display.amenities}</p>
                  ) : null}
                  {(display.lastEditedAt || display.lastEditedByName) ? (
                    <p className="mt-1 text-[9px] text-[#6B6560]">
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
                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    {!isEditing ? (
                      <button
                        type="button"
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] text-[#F5F0EB] transition-colors hover:bg-white/[0.08]"
                        onClick={() => beginEdit(key, program, attached)}
                      >
                        Edit
                      </button>
                    ) : (
                      <>
                        {hasUnsaved ? (
                          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-medium text-amber-300">
                            Unsaved changes
                          </span>
                        ) : (
                          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9px] text-[#6B6560]">
                            No changes
                          </span>
                        )}
                        <button
                          type="button"
                          className="rounded-lg border border-[#C9A96E]/50 bg-[rgba(201,169,110,0.12)] px-2.5 py-1 text-[10px] text-[#C9A96E]"
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
                          Save
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] text-[#9B9590]"
                          onClick={() => setEditingKey(null)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {isEditing ? (
                <div className="mt-3 space-y-3 rounded-xl border border-[rgba(201,169,110,0.2)] bg-[rgba(201,169,110,0.05)] p-3">
                  <p className="text-[9px] uppercase tracking-wider text-[#B8976E]">Edit program details</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-medium text-[#9B9590]">Program name</span>
                    <input
                      value={drafts[key]?.programName ?? drafts[key]?.name ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], programName: e.target.value, name: e.target.value },
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-[#0a0a0f] px-3 text-[12px] text-[#F5F0EB] outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-medium text-[#9B9590]">Commission %</span>
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
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-[#0a0a0f] px-3 text-[12px] text-[#F5F0EB] outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-medium text-[#9B9590]">Status</span>
                    <select
                      value={drafts[key]?.status ?? "active"}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], status: e.target.value as "active" | "inactive" },
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-[#0a0a0f] px-3 text-[12px] text-[#F5F0EB] outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-medium text-[#9B9590]">Scope</span>
                    <select
                      value={drafts[key]?.scope === "enable" ? "enable" : (drafts[key]?.scope ?? "enable")}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], scope: e.target.value === "enable" ? "enable" : e.target.value },
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-[#0a0a0f] px-3 text-[12px] text-[#F5F0EB] outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
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
                    <span className="mb-1 block text-[10px] font-medium text-[#9B9590]">Expiry</span>
                    <input
                      type="date"
                      value={(drafts[key]?.expiryDate ?? "").slice(0, 10)}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], expiryDate: e.target.value ? `${e.target.value}T12:00:00.000Z` : null },
                        }))
                      }
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-[#0a0a0f] px-3 text-[12px] text-[#F5F0EB] outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-medium text-[#9B9590]">Contact</span>
                    <input
                      value={drafts[key]?.contact ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], contact: e.target.value } }))
                      }
                      className="h-9 w-full rounded-lg border border-white/[0.14] bg-[#0a0a0f] px-3 text-[12px] text-[#F5F0EB] outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-[10px] font-medium text-[#9B9590]">Amenities</span>
                    <textarea
                      rows={2}
                      value={drafts[key]?.amenities ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], amenities: e.target.value } }))
                      }
                      className="w-full resize-none rounded-lg border border-white/[0.14] bg-[#0a0a0f] px-3 py-2 text-[12px] text-[#F5F0EB] outline-none transition-colors focus:border-[rgba(201,169,110,0.45)] focus:ring-1 focus:ring-[rgba(201,169,110,0.28)]"
                    />
                  </label>
                  </div>

                  <div className="rounded-lg border border-white/[0.08] bg-[#0a0a0f]/70 p-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-medium text-[#9B9590]">Attached products</p>
                      <label className="flex items-center gap-2 text-[10px] text-[#9B9590]">
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
                      <p className="mt-1 text-[10px] leading-relaxed text-[#6B6560]">
                        Each attached product can have its own commission and amenities; global fields above stay as defaults.
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] leading-relaxed text-[#6B6560]">
                        Turn on when commission or amenities differ between properties on this program.
                      </p>
                    )}
                    <div className="relative mt-2">
                      <Search
                        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#4A4540]"
                        aria-hidden
                      />
                      <input
                        type="search"
                        value={attachProductSearchQuery}
                        onChange={(e) => setAttachProductSearchQuery(e.target.value)}
                        placeholder="Search products to attach…"
                        className="h-8 w-full rounded-lg border border-white/[0.10] bg-[#08080c] py-1.5 pl-8 pr-2 text-[11px] text-[#F5F0EB] outline-none placeholder:text-[#5C5852] transition-colors focus:border-[rgba(201,169,110,0.35)] focus:ring-1 focus:ring-[rgba(201,169,110,0.2)]"
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
                            <p className="py-3 text-center text-[10px] text-[#6B6560]">
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
                          <div key={p.id} className="rounded-md border border-white/[0.06] bg-[#08080c] p-2">
                            <div className="flex items-center justify-between gap-2">
                              <label className="flex min-w-0 items-center gap-2 text-[10px] text-[#C8C0B8]">
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
                                <span className="text-[9px] text-[#6B6560]">{directoryCategoryLabel(p.type)}</span>
                              </div>
                            </div>
                            {on && (useProductSpecificTerms[key] ?? false) ? (
                              <div className="mt-2 grid grid-cols-2 gap-1.5">
                                <p className="col-span-2 border-l border-[#C9A96E]/20 pl-2 text-[9px] leading-snug text-[#6B6560]">
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
                                  className="h-8 rounded border border-white/[0.08] bg-[#0a0a0f] px-2 text-[10px] text-[#F5F0EB] outline-none"
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
                                  className="h-8 rounded border border-white/[0.08] bg-[#0a0a0f] px-2 text-[10px] text-[#F5F0EB] outline-none"
                                />
                              </div>
                            ) : null}
                          </div>
                        );
                      });
                      })()}
                    </div>
                  </div>
                  {(display.activePromotions?.length ?? 0) > 0 ? (
                    <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-2.5">
                      <p className="mb-2 text-[9px] uppercase tracking-wider text-amber-300">Temporary offers</p>
                      <div className="space-y-2">
                        {display.activePromotions.map((pr) => (
                          <div
                            key={pr.id}
                            className="rounded-md border border-white/[0.06] bg-[#0a0a0f] px-2 py-1.5"
                          >
                            <div className="grid gap-1.5 sm:grid-cols-3">
                              <label className="flex items-center gap-1 text-[10px] text-[#9B9590]">
                                Rate
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
                                          x.id === pr.id ? { ...x, effectiveRate: Math.max(0, Number(e.target.value) || 0) } : x
                                        ),
                                      },
                                    }))
                                  }
                                  className="w-16 rounded border border-white/[0.08] bg-[#08080c] px-1 py-0.5 text-[10px] text-[#F5F0EB] outline-none"
                                />
                                %
                              </label>
                              <label className="text-[9px] text-[#6B6560]">
                                Booking
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
                                    className="h-7 w-full rounded border border-white/[0.08] bg-[#08080c] px-1.5 text-[10px] text-[#F5F0EB] outline-none"
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
                                    className="h-7 w-full rounded border border-white/[0.08] bg-[#08080c] px-1.5 text-[10px] text-[#F5F0EB] outline-none"
                                  />
                                </div>
                              </label>
                              <label className="text-[9px] text-[#6B6560]">
                                Travel
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
                                    className="h-7 w-full rounded border border-white/[0.08] bg-[#08080c] px-1.5 text-[10px] text-[#F5F0EB] outline-none"
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
                                    className="h-7 w-full rounded border border-white/[0.08] bg-[#08080c] px-1.5 text-[10px] text-[#F5F0EB] outline-none"
                                  />
                                </div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {(display.activePromotions?.length ?? 0) > 0 ? (
                <div className="mt-3 rounded-xl border border-[rgba(201,169,110,0.12)] bg-[rgba(201,169,110,0.04)] p-3">
                  <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-[#B8976E]">
                    Temporary offers & promotions
                  </p>
                  <ul className="space-y-2">
                    {display.activePromotions.map((pr) => (
                      <li
                        key={pr.id}
                        className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.04] pb-2 text-[10px] last:border-0 last:pb-0"
                      >
                        <span className="font-semibold text-[#C9A96E]">{pr.effectiveRate}% effective</span>
                        <span className="text-[#6B6560]">
                          Book {new Date(pr.bookingStart).toLocaleDateString()} –{" "}
                          {new Date(pr.bookingEnd).toLocaleDateString()} · Travel{" "}
                          {new Date(pr.travelStart).toLocaleDateString()} –{" "}
                          {new Date(pr.travelEnd).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="p-3">
              <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-[#4A4540]">
                Attached products ({attached.length})
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/12">
                {attached.map((p) => (
                  (() => {
                    const match = p.partnerPrograms.find((pp) => programFilterId(pp) === key);
                    const isCustom = termsSignature(match) !== baselineSig;
                    return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectProduct(p.id)}
                    className={cn(
                      "w-[100px] shrink-0 overflow-hidden rounded-xl border bg-[#08080c] text-left transition-colors",
                      isCustom
                        ? "border-white/[0.06] ring-1 ring-inset ring-[rgba(201,169,110,0.14)]"
                        : "border-white/[0.06]",
                      "hover:border-[rgba(201,169,110,0.22)]"
                    )}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-[#14141c]">
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-1.5">
                      <p className="line-clamp-2 text-[9px] font-medium leading-tight text-[#F5F0EB]">{p.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                        <p className="text-[8px] text-[#6B6560]">{directoryCategoryLabel(p.type)}</p>
                        {isCustom ? (
                          <span className="text-[7px] font-medium text-[#A38F6E]">· custom terms</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                    );
                  })()
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
