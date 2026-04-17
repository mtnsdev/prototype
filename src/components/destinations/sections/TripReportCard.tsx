"use client";

import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { DestinationTripReport } from "@/data/destinations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { destCardClass, destMuted } from "@/components/destinations/destinationStyles";

type Props = {
  report: DestinationTripReport;
};

function formatRange(start: string, end: string): string {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${a.toLocaleDateString(undefined, opts)}–${b.toLocaleDateString(undefined, opts)}`;
}

export function TripReportCard({ report }: Props) {
  const [voted, setVoted] = useState(false);

  return (
    <article id={`item-${report.id}`} className={cn(destCardClass(), "scroll-mt-28 p-4")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-xs font-semibold text-foreground"
            aria-hidden
          >
            {report.advisorName
              .split(/\s+/)
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{report.advisorName}</p>
            <p className={cn("text-xs", destMuted)}>Advisor field report</p>
          </div>
        </div>
        <p className={cn("shrink-0 text-xs tabular-nums", destMuted)}>
          {formatRange(report.travelDates.start, report.travelDates.end)}
        </p>
      </div>
      {report.subRegionsVisited.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {report.subRegionsVisited.map((r) => (
            <span
              key={r}
              className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {r}
            </span>
          ))}
        </div>
      ) : null}
      {report.productReferences.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {report.productReferences.map((pr) => (
            <Link
              key={pr.productId}
              href={`/dashboard/products/${pr.productId}`}
              className="rounded-full border border-brand-cta/30 bg-brand-cta/10 px-2.5 py-0.5 text-[10px] font-medium text-brand-cta hover:bg-brand-cta/15"
            >
              {pr.label}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="prose prose-invert prose-sm mt-3 max-w-none text-foreground [&_p]:leading-relaxed">
        <ReactMarkdown>{report.content}</ReactMarkdown>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant={voted ? "toolbarAccent" : "outline"}
          size="sm"
          className="gap-1.5"
          onClick={() => setVoted((v) => !v)}
        >
          <ThumbsUp className="size-3.5" aria-hidden />
          Helpful · <span className="tabular-nums">{report.helpfulCount + (voted ? 1 : 0)}</span>
        </Button>
        <span className={cn("text-[10px]", destMuted)}>Local mock — sync in Drop 2.</span>
      </div>
    </article>
  );
}
