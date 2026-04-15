"use client";

import { useId, useState } from "react";
import { ChevronRight, ExternalLink, Star } from "lucide-react";
import type { DMCPartner } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { destCardClass, destMuted, destMuted2 } from "./destinationStyles";

type Props = {
  partner: DMCPartner;
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

export function DMCPartnerCard({ partner }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div
      className={cn(
        destCardClass("overflow-hidden"),
        partner.preferred && "border-brand-cta/25",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{partner.name}</span>
            {partner.preferred ? (
              <span className="inline-flex items-center gap-0.5 rounded border border-[rgba(201,169,110,0.22)] bg-[rgba(201,169,110,0.08)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-cta">
                <Star className="size-3 fill-brand-cta text-brand-cta" aria-hidden />
                Preferred
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
      {open ? (
        <div id={panelId} className="border-t border-border px-4 py-4">
          {partner.notes ? (
            <p className={cn("mb-4 text-sm italic", destMuted)}>{partner.notes}</p>
          ) : null}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {partner.website ? (
              <div className="min-w-0 sm:col-span-2">
                <dt className={cn("text-xs font-medium uppercase tracking-wide", destMuted2)}>Website</dt>
                <dd className="mt-0.5">
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
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
            <Row label="Pricing model" value={partner.pricing} />
            <Row label="Payment process" value={partner.paymentProcess} />
            <Row label="Commission process" value={partner.commissionProcess} />
            <Row label="After hours" value={partner.afterHours} />
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
