"use client";

import type { IngestionStatus, Freshness } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────
   Pill anatomy — uses muted-state token pairs from globals.css.
   tinted bg + deeper text + low-opacity border + solid colored dot.
   ──────────────────────────────────────────────── */

const PILL_BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-medium leading-none";
const DOT = "w-1.5 h-1.5 rounded-full shrink-0";

/* ──────────── Ingestion status (indexed / processing / not_indexed) ──────────── */

const INGESTION_COPY: Record<IngestionStatus, string> = {
  indexed: "Indexed",
  processing: "Processing",
  not_indexed: "Not indexed",
};

const INGESTION_STYLE: Record<
  IngestionStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  indexed: {
    bg: "var(--muted-success-bg)",
    text: "var(--muted-success-text)",
    border: "var(--muted-success-border)",
    dot: "var(--color-success)",
  },
  processing: {
    bg: "var(--muted-amber-bg)",
    text: "var(--muted-amber-text)",
    border: "var(--muted-amber-border)",
    dot: "var(--brand-accent)",
  },
  not_indexed: {
    bg: "rgba(40, 48, 42, 0.06)",
    text: "var(--text-tertiary)",
    border: "var(--border-default)",
    dot: "var(--text-disabled)",
  },
};

export function IngestionStatusBadge({
  status,
  className,
}: {
  status: IngestionStatus;
  className?: string;
}) {
  const style = INGESTION_STYLE[status];
  return (
    <span
      className={cn(PILL_BASE, className)}
      style={{
        background: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      <span className={DOT} style={{ background: style.dot }} aria-hidden />
      {INGESTION_COPY[status]}
    </span>
  );
}

/* ──────────── Freshness (fresh / recent / aging / stale) ──────────── */

const FRESHNESS_COPY: Record<Freshness, string> = {
  fresh: "Fresh",
  recent: "Recent",
  aging: "Aging",
  stale: "Stale",
};

const FRESHNESS_STYLE: Record<
  Freshness,
  { bg: string; text: string; border: string; dot: string }
> = {
  fresh: {
    bg: "var(--muted-success-bg)",
    text: "var(--muted-success-text)",
    border: "var(--muted-success-border)",
    dot: "var(--color-success)",
  },
  recent: {
    bg: "rgba(40, 48, 42, 0.05)",
    text: "var(--text-secondary)",
    border: "var(--border-default)",
    dot: "var(--text-tertiary)",
  },
  aging: {
    bg: "var(--muted-amber-bg)",
    text: "var(--muted-amber-text)",
    border: "var(--muted-amber-border)",
    dot: "var(--brand-accent)",
  },
  stale: {
    bg: "var(--muted-warning-bg)",
    text: "var(--muted-warning-text)",
    border: "var(--muted-warning-border)",
    dot: "var(--color-warning)",
  },
};

export function FreshnessBadge({
  freshness,
  className,
}: {
  freshness: Freshness;
  className?: string;
}) {
  const style = FRESHNESS_STYLE[freshness];
  return (
    <span
      className={cn(PILL_BASE, className)}
      style={{
        background: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      <span className={DOT} style={{ background: style.dot }} aria-hidden />
      {FRESHNESS_COPY[freshness]}
    </span>
  );
}

