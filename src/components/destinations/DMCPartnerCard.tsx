"use client";

import { useId, useState } from "react";
import { ChevronRight, ExternalLink, Leaf, Star } from "lucide-react";
import type { DMCPartner } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { destCardClass, destCardRowHover, destMuted, destMuted2 } from "./destinationStyles";
import { QuickCopyButton } from "@/components/destinations/shared/QuickCopyButton";
import { EndorsementBadge } from "@/components/destinations/shared/EndorsementBadge";
import { FreshnessIndicator } from "@/components/destinations/shared/FreshnessIndicator";
import { formatPartnerContactBlock } from "@/lib/destinationClipboard";

type Props = {
  partner: DMCPartner;
  /** First card on the page is expanded by default (spec). */
  defaultOpen?: boolean;
  /** Stable anchor for `#item-{id}` deep links. */
  itemId: string;
  destinationSlug: string;
};

function Row({ label, value }: { label: string; value?: string }) {
  if (value == null || value === "") return null;
  return (
    <div className="min-w-0">
      <dt className={cn("text-xs font-medium uppercase tracking-wide", destMuted2)}>{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function PillRow({ label, values }: { label: string; values?: string[] }) {
  if (values == null || values.length === 0) return null;
  return (
    <div className="min-w-0 sm:col-span-2">
      <dt className={cn("text-xs font-medium uppercase tracking-wide", destMuted2)}>{label}</dt>
      <dd className="mt-2 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            {v}
          </span>
        ))}
      </dd>
    </div>
  );
}

export function DMCPartnerCard({ partner, defaultOpen = false, itemId, destinationSlug }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const { plain, html } = formatPartnerContactBlock(partner);

  return (
    <div
      id={`item-${itemId}`}
      className={cn(
        destCardClass("scroll-mt-28 overflow-hidden"),
        partner.preferred && "border-brand-cta/25",
      )}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className={cn("flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left", destCardRowHover)}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">{partner.name}</span>
              <FreshnessIndicator tone={partner.freshnessTone} />
              {partner.endorsementCount != null && partner.endorsementCount > 0 ? (
                <EndorsementBadge count={partner.endorsementCount} />
              ) : null}
              {partner.preferred ? (
                <span className="inline-flex items-center gap-0.5 rounded border border-[rgba(201,169,110,0.22)] bg-[rgba(201,169,110,0.08)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-cta">
                  <Star className="size-3 fill-brand-cta text-brand-cta" aria-hidden />
                  Preferred
                </span>
              ) : null}
              {partner.responsibleTourism ? (
                <span className="inline-flex items-center gap-0.5 rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400/95">
                  <Leaf className="size-3 text-emerald-400/90" aria-hidden />
                  Responsible tourism
                </span>
              ) : null}
            </div>
            {partner.reppedBy ? <p className={cn("mt-0.5 text-xs", destMuted)}>{partner.reppedBy}</p> : null}
          </div>
          <ChevronRight
            className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
            aria-hidden
          />
        </button>
        <QuickCopyButton
          plain={plain}
          html={html}
          itemId={itemId}
          destinationSlug={destinationSlug}
          className="mt-2 shrink-0"
        />
      </div>
      {open ? (
        <div id={panelId} className="border-t border-border px-4 py-4">
          {partner.notes ? (
            <p className={cn("mb-4 text-sm italic", destMuted)}>{partner.notes}</p>
          ) : null}
          <p className={cn("mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground")}>
            Operations
          </p>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {partner.website ? (
              <div className="min-w-0 sm:col-span-2">
                <dt className={cn("text-xs font-medium uppercase tracking-wide", destMuted2)}>Website</dt>
                <dd className="mt-0.5">
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-brand-cta underline-offset-4 hover:underline"
                  >
                    {partner.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  </a>
                </dd>
              </div>
            ) : null}
            <Row label="Key contact" value={partner.keyContact} />
            <Row label="General requests" value={partner.generalRequests} />
            <Row label="Social media" value={partner.socialMedia} />
            <Row label="Pricing model" value={partner.pricing} />
            <Row label="Payment process" value={partner.paymentProcess} />
            <Row label="Commission process" value={partner.commissionProcess} />
            <Row label="After hours / 24-7 support" value={partner.afterHours} />
            <Row label="Special amenity" value={partner.specialAmenity} />
            <Row label="Destinations served" value={partner.destinationsServed} />
            <Row label="Featured regions" value={partner.featuredRegions} />
          </dl>
          <p
            className={cn(
              "mb-3 mt-6 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
            )}
          >
            Capabilities
          </p>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PillRow label="Specializations" values={partner.specializations} />
            <PillRow label="Languages" values={partner.languages} />
            <Row label="Proposal turnaround" value={partner.proposalTurnaround} />
            <Row label="Minimum booking" value={partner.minimumBooking} />
            <PillRow label="Service options" values={partner.serviceOptions} />
            <PillRow label="Itinerary platforms" values={partner.itineraryPlatforms} />
          </dl>
          {partner.feedback ? (
            <div className="mt-4 rounded-lg border border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] px-3 py-2 text-sm text-foreground">
              <span className="font-medium text-brand-cta">Recent feedback · </span>
              {partner.feedback}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
