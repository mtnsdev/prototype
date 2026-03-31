"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SourceConflict, ConflictValue } from "@/types/vic-profile";
import { formatShortDate } from "@/lib/vic-profile-helpers";
import { AlertTriangle, ChevronDown, ChevronUp, Database, Globe, Mail, Sparkles, User, Ship } from "lucide-react";

/** Icon + label for each source type */
const SOURCE_META: Record<string, { icon: typeof Database; label: string; color: string }> = {
  manual:   { icon: User,     label: "Manual entry",   color: "text-blue-400" },
  axus:     { icon: Database,  label: "Axus",           color: "text-emerald-400" },
  virtuoso: { icon: Globe,     label: "Virtuoso",       color: "text-purple-400" },
  acuity:   { icon: Sparkles,  label: "Acuity AI",      color: "text-amber-400" },
  email:    { icon: Mail,      label: "Email extract",  color: "text-cyan-400" },
  tripsuite:{ icon: Ship,      label: "TripSuite",      color: "text-rose-400" },
  import:   { icon: Database,  label: "CSV import",     color: "text-gray-400" },
};

function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence == null) return null;
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 80 ? "text-emerald-400 bg-emerald-400/10" :
    pct >= 50 ? "text-amber-400 bg-amber-400/10" :
               "text-red-400 bg-red-400/10";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-2xs font-medium", color)}>
      {pct}% confidence
    </span>
  );
}

function SourceValueCard({
  v,
  resolved,
  isKept,
  onResolve,
}: {
  v: ConflictValue;
  resolved: boolean;
  isKept: boolean;
  onResolve?: (value: string) => void;
}) {
  const [showExcerpt, setShowExcerpt] = useState(false);
  const meta = SOURCE_META[v.source_type] ?? SOURCE_META.manual;
  const Icon = meta.icon;

  return (
    <div className={cn(
      "rounded-lg border p-3 transition-colors",
      isKept ? "border-[#C9A96E]/40 bg-[rgba(201,169,110,0.06)]" : "border-border bg-muted/20",
    )}>
      <p className="font-medium text-foreground">{v.value}</p>

      {/* Source provenance row */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className={cn("inline-flex items-center gap-1 text-xs", meta.color)}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
        {v.provider && (
          <span className="text-2xs text-muted-foreground capitalize">via {v.provider}</span>
        )}
        <ConfidenceBadge confidence={v.confidence} />
      </div>

      {/* Date + context */}
      <p className="mt-1 text-2xs text-muted-foreground">{formatShortDate(v.date)}</p>
      {v.context && <p className="mt-1 text-xs text-muted-foreground/90">{v.context}</p>}

      {/* Raw excerpt toggle (traceability — March 31 decision) */}
      {v.raw_excerpt && (
        <button
          type="button"
          onClick={() => setShowExcerpt(!showExcerpt)}
          className="mt-2 flex items-center gap-1 text-2xs text-muted-foreground/75 hover:text-muted-foreground transition-colors"
        >
          {showExcerpt ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showExcerpt ? "Hide source excerpt" : "Show source excerpt"}
        </button>
      )}
      {showExcerpt && v.raw_excerpt && (
        <blockquote className="mt-1 border-l-2 border-border pl-2 text-2xs text-muted-foreground/80 italic">
          {v.raw_excerpt}
        </blockquote>
      )}

      {/* Resolve button */}
      {!resolved && onResolve && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="mt-3 w-full"
          onClick={() => onResolve(v.value)}
        >
          Use this value
        </Button>
      )}
    </div>
  );
}

/**
 * ConflictResolver — enhanced for Layer 2.
 *
 * March 31 decision: show all conflicting values with full provenance
 * (source type, AI provider, confidence, raw excerpt). Advisor resolves
 * manually — no auto-resolution.
 */
export function ConflictResolver({
  conflict,
  onResolve,
  className,
}: {
  conflict: SourceConflict;
  onResolve?: (id: string, value: string) => void;
  className?: string;
}) {
  const resolved = conflict.status === "resolved";

  return (
    <div className={cn("rounded-xl border border-border bg-background p-4 text-sm", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!resolved && <AlertTriangle className="h-4 w-4 text-amber-400" />}
          <p className="font-medium text-foreground capitalize">{conflict.field.replace(/_/g, " ")}</p>
        </div>
        {resolved ? (
          <span className="text-2xs text-muted-foreground">Resolved</span>
        ) : (
          <span className="text-2xs text-amber-300">{conflict.values.length} conflicting sources</span>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {conflict.values.map((v, i) => (
          <SourceValueCard
            key={i}
            v={v}
            resolved={resolved}
            isKept={resolved && conflict.resolvedValue === v.value}
            onResolve={onResolve ? (val) => onResolve(conflict.id, val) : undefined}
          />
        ))}
      </div>

      {resolved && conflict.resolvedValue && (
        <p className="mt-3 text-xs text-muted-foreground">
          Kept: <span className="text-foreground">{conflict.resolvedValue}</span>
          {conflict.resolvedBy && <span className="text-muted-foreground/75"> by {conflict.resolvedBy}</span>}
          {conflict.resolvedAt && <span className="text-muted-foreground/75"> on {formatShortDate(conflict.resolvedAt)}</span>}
        </p>
      )}
    </div>
  );
}
