"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/types/vic-profile";
import { formatCurrency } from "@/lib/vic-profile-helpers";

export function RelationshipCard({ rel, className }: { rel: Relationship; className?: string }) {
  const auth =
    rel.type === "assistant" && rel.authorityLevel
      ? rel.authorityLevel === "none"
        ? "View only"
        : rel.authorityLevel === "limited" && rel.authorityLimit != null
          ? `Can approve up to ${formatCurrency(rel.authorityLimit)}`
          : rel.authorityLevel === "full"
            ? "Full booking authority"
            : null
      : null;

  const inner = (
    <div
      className={cn(
        "rounded-xl border border-border bg-background p-4 text-sm transition-colors",
        rel.relatedVicId && "hover:bg-muted/25",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">{rel.relatedPersonName}</p>
          <p className="text-xs capitalize text-muted-foreground">{rel.type.replace(/_/g, " ")}</p>
        </div>
        {rel.relatedVicId ? (
          <span className="text-2xs text-[var(--brand-cta)]">Open profile →</span>
        ) : null}
      </div>
      {auth ? <p className="mt-2 text-xs text-amber-300/90">{auth}</p> : null}
      {rel.tripsTogetherCount != null ? (
        <p className="mt-1 text-xs text-muted-foreground">{rel.tripsTogetherCount} trips together</p>
      ) : null}
      {(rel.sharedPreferences?.length ?? 0) > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Shared: {rel.sharedPreferences!.join("; ")}</p>
      ) : null}
      {(rel.differingPreferences?.length ?? 0) > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">Differs: {rel.differingPreferences!.join("; ")}</p>
      ) : null}
    </div>
  );

  if (rel.relatedVicId) {
    return (
      <Link href={`/dashboard/vics/${rel.relatedVicId}/advisor-profile`} className="block">
        {inner}
      </Link>
    );
  }

  return inner;
}
