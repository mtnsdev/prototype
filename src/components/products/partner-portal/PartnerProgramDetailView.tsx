"use client";

import { useMemo } from "react";
import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatDateShort,
  incentiveDisplayPhase,
  incentiveWindowParts,
  INCENTIVE_REFERENCE_ISO,
} from "@/lib/incentiveUi";
import { directoryCategoryColors } from "@/components/products/productDirectoryVisual";
import {
  directoryProductTypeShortLabel,
  getPrimaryDirectoryType,
} from "@/components/products/directoryProductTypeHelpers";
import type { Incentive, Program, ProductProgramLink } from "@/types/partner-programs";
import type { DirectoryProduct } from "@/types/product-directory";
import { AMENITY_LABELS } from "@/components/products/productDirectoryFilterConfig";

function agreementStatusLabel(program: Program): { label: string; className: string } {
  const s = program.status;
  if (s === "paused") {
    return { label: "Agreement paused", className: "border-border bg-white/[0.06] text-muted-foreground" };
  }
  if (s === "archived") {
    return { label: "Archived", className: "border-border bg-white/[0.06] text-muted-foreground" };
  }
  if (s === "expired") {
    return { label: "Agreement ended", className: "border-[rgba(180,130,130,0.35)] bg-[rgba(180,130,130,0.15)] text-foreground/90" };
  }
  if (s === "expiring") {
    return { label: "Agreement expiring soon", className: "border-[rgba(200,160,90,0.35)] bg-[rgba(200,160,90,0.12)] text-foreground/90" };
  }
  return { label: "Agreement active", className: "border-[rgba(130,160,130,0.35)] bg-[rgba(130,160,130,0.12)] text-foreground/90" };
}

function commissionHeadline(program: Program, canViewCommissions: boolean): string | null {
  if (!canViewCommissions) return null;
  const raw = program.agencyNegotiatedRate?.trim() || program.commissionRate;
  if (!raw) return null;
  if (program.commissionType === "percentage" || raw.includes("%")) {
    const n = raw.replace(/%/g, "").trim();
    return `Up to ${n}%`;
  }
  return raw;
}

function linkHasCustomTerms(program: Program, link: ProductProgramLink): boolean {
  if (!program.hasPropertyLevelOverrides) return false;
  if (link.commissionRate != null && link.commissionRate.trim() !== "") return true;
  if (link.amenities != null && link.amenities.length > 0) return true;
  if (link.notes != null && link.notes.trim() !== "") return true;
  return false;
}

export type PartnerProgramDetailViewProps = {
  program: Program;
  links: ProductProgramLink[];
  incentives: Incentive[];
  productById: Map<string, DirectoryProduct>;
  canViewCommissions: boolean;
  onEditProgram: () => void;
  onSelectProduct: (productId: string) => void;
  /** Broken image ids for tiles */
  brokenImages: Record<string, boolean>;
  onImageError: (productId: string) => void;
};

export function PartnerProgramDetailView({
  program,
  links,
  incentives,
  productById,
  canViewCommissions,
  onEditProgram,
  onSelectProduct,
  brokenImages,
  onImageError,
}: PartnerProgramDetailViewProps) {
  const ref = useMemo(() => new Date(INCENTIVE_REFERENCE_ISO), []);
  const agreement = agreementStatusLabel(program);
  const commissionLine = commissionHeadline(program, canViewCommissions);
  const expiryLine = program.renewalDate
    ? `Until ${formatDateShort(program.renewalDate)}`
    : "No renewal date on file";
  const contactLine = program.agencyContact.email?.trim() || program.agencyContact.phone?.trim() || "—";
  const termsNote = program.hasPropertyLevelOverrides ? "Terms vary by product" : null;

  const sortedIncentives = useMemo(() => {
    const list = [...incentives];
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [incentives]);

  const sortedLinks = useMemo(() => {
    const list = [...links];
    const name = (id: string) => productById.get(id)?.name ?? id;
    list.sort((a, b) => name(a.productId).localeCompare(name(b.productId)));
    return list;
  }, [links, productById]);

  return (
    <div className="space-y-8">
      <div className="relative border-b border-border pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Award className="h-5 w-5 shrink-0 text-brand-cta" aria-hidden />
              <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{program.name}</h1>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                  agreement.className
                )}
              >
                {agreement.label}
              </span>
              <span className="rounded-full border border-border bg-white/[0.06] px-2.5 py-0.5 text-[10px] text-muted-foreground">
                {links.length} propert{links.length !== 1 ? "ies" : "y"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {commissionLine ? (
                <span className="font-medium text-brand-cta">{commissionLine}</span>
              ) : null}
              <span className="text-muted-foreground">{expiryLine}</span>
              <span className="break-all text-muted-foreground">{contactLine}</span>
              {termsNote ? <span className="text-muted-foreground">{termsNote}</span> : null}
            </div>
            {program.termsSummary ? (
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{program.termsSummary}</p>
            ) : null}
            {(program.amenities.length > 0 || program.customAmenities.length > 0) ? (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                  Amenities
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
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
                      key={`c-${i}-${label}`}
                      className="rounded-md border border-border bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-foreground/90"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="mt-3 text-[10px] text-muted-foreground">
              Last updated {formatDateShort(program.updatedAt)}
              {program.createdBy ? ` · ${program.createdBy}` : null}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-brand-cta/40 text-brand-cta hover:bg-[rgba(201,169,110,0.08)]"
            onClick={onEditProgram}
          >
            Edit program
          </Button>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Preview</p>
        <div className="mt-2 rounded-2xl border border-border bg-card/80 p-4">
          {sortedIncentives.length === 0 ? (
            <p className="text-xs text-muted-foreground">No time-bound incentives on this program.</p>
          ) : (
            <ul className="space-y-4">
              {sortedIncentives.map((pr) => {
                const phase = incentiveDisplayPhase(pr, ref);
                const stacks = pr.stacksWithBase;
                const windows = incentiveWindowParts(pr);
                return (
                  <li
                    key={pr.id}
                    className={cn(
                      "flex flex-col gap-2 border-b border-border/60 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
                      phase === "expired" && "opacity-60"
                    )}
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-brand-cta">
                        {pr.rateValue} effective
                        {canViewCommissions && pr.rateType === "flat" ? (
                          <span className="font-normal text-muted-foreground"> (flat)</span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {stacks ? "Stacks with base" : "Does not stack (override)"}
                      </p>
                      <p className="text-xs font-medium text-foreground">{pr.name}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-0.5 text-[11px] leading-snug text-muted-foreground sm:max-w-[min(100%,22rem)] sm:text-right">
                      {!windows.bookLine && !windows.travelLine ? (
                        <p>Open-ended windows</p>
                      ) : null}
                      {windows.bookLine ? <p>{windows.bookLine}</p> : null}
                      {windows.travelLine ? <p>{windows.travelLine}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              Properties on this program
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Select a card to open full product details.</p>
          </div>
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{sortedLinks.length} linked</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedLinks.map((link) => {
            const p = productById.get(link.productId);
            const custom = linkHasCustomTerms(program, link);
            if (!p) {
              return (
                <div
                  key={link.id}
                  className="overflow-hidden rounded-xl border border-border bg-inset p-4 text-[11px] text-muted-foreground"
                >
                  Unknown product <span className="font-mono">{link.productId}</span>
                </div>
              );
            }
            const primaryType = getPrimaryDirectoryType(p);
            const cat = directoryCategoryColors(primaryType);
            const typeLabel = directoryProductTypeShortLabel(p);
            const placeLine =
              p.city && p.country ? `${p.city}, ${p.country}` : p.location || "";
            const broken = !!brokenImages[p.id];

            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onSelectProduct(p.id)}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-popover text-left shadow-sm transition-colors hover:border-brand-cta/35"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.04]">
                  {p.imageUrl && !broken ? (
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      onError={() => onImageError(p.id)}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08080c]/70 via-transparent to-transparent" />
                  <span
                    className="absolute bottom-2 left-2 rounded-full border px-2 py-px text-[9px] backdrop-blur-sm"
                    style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}
                  >
                    {typeLabel}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{p.name}</p>
                  {placeLine ? (
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">{placeLine}</p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-[10px] text-muted-foreground">{typeLabel}</span>
                    {custom ? (
                      <span className="rounded border border-brand-cta/35 bg-[rgba(201,169,110,0.12)] px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-brand-cta">
                        Custom
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
