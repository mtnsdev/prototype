"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { DataSource, IngestionHealth, IngestionStatus } from "@/types/knowledge-vault";

type Props = {
  health: IngestionHealth;
  sources: DataSource[];
  activeIngestionFilter?: IngestionStatus | null;
  /** When true, ingestion filter applies only to the vault list — hide shortcut row cues. */
  documentFiltersUnavailable?: boolean;
};

export default function IngestionHealthBar({
  health,
  sources,
  activeIngestionFilter,
  documentFiltersUnavailable,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = health.total_documents || 1;
  const pct = (n: number) => (n / total) * 100;

  const orderedSources = [...sources].sort((a, b) => {
    const order = [
      "src-gdrive-admin",
      "src-gdrive-personal",
      "src-claro-docs",
      "src-claro-pages",
      "src-email",
    ];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm font-medium text-[#F5F5F5]">Ingestion Health</span>
        <div className="flex-1 h-3 rounded-full overflow-hidden flex bg-white/5 min-w-[120px]">
          <div
            className="bg-[color-mix(in_srgb,var(--color-success)_52%,transparent)] transition-all"
            style={{ width: pct(health.indexed) + "%" }}
            title="Indexed"
          />
          <div
            className="bg-[color-mix(in_srgb,var(--color-warning)_48%,transparent)] transition-all"
            style={{ width: pct(health.processing) + "%" }}
            title="Processing"
          />
          <div
            className="bg-white/[0.18] transition-all"
            style={{ width: pct(health.not_indexed) + "%" }}
            title="Not indexed"
          />
        </div>
        <div className="text-xs text-[var(--text-secondary)] shrink-0 flex flex-wrap gap-x-2 gap-y-1">
          <span className="text-[var(--color-success)]">{health.indexed} indexed</span>
          <span className="text-white/30">·</span>
          <span className="text-[var(--color-warning)]">{health.processing} processing</span>
          <span className="text-white/30">·</span>
          <span className="text-[var(--text-tertiary)]">{health.not_indexed} not indexed</span>
        </div>
      </div>
      {activeIngestionFilter != null && !documentFiltersUnavailable && (
        <p className="text-xs text-[rgba(245,245,245,0.55)] mt-2">
          Document list filtered by availability. Clear in{" "}
          <span className="font-medium text-[rgba(245,245,245,0.85)]">Document filters</span> below.
        </p>
      )}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 mt-2 text-xs text-[rgba(245,245,245,0.5)] hover:text-[rgba(245,245,245,0.8)]"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {expanded ? "Hide" : "Show"} per-source breakdown
      </button>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5 text-xs">
          {orderedSources.map((s) => (
            <div key={s.id} className="flex items-center gap-3 flex-wrap">
              <span className="text-[rgba(245,245,245,0.85)] w-[200px] shrink-0 truncate" title={s.name}>
                {s.name}
              </span>
              <span className="text-[rgba(245,245,245,0.5)] shrink-0 tabular-nums">
                {s.indexed_document_count != null ? `${s.indexed_document_count} / ${s.document_count}` : s.document_count}{" "}
                indexed
              </span>
              <span className="text-[rgba(245,245,245,0.35)]">|</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden min-w-[60px]">
                {s.status === "disconnected" ? (
                  <div className="h-full w-0" />
                ) : (
                  <div
                    className={
                      s.health_score >= 80
                        ? "h-full bg-[color-mix(in_srgb,var(--color-success)_45%,transparent)]"
                        : s.health_score >= 50
                          ? "h-full bg-[color-mix(in_srgb,var(--color-warning)_42%,transparent)]"
                          : "h-full bg-white/26"
                    }
                    style={{ width: `${Math.max(2, s.health_score)}%` }}
                  />
                )}
              </div>
              <span className="w-10 shrink-0 text-right text-[rgba(245,245,245,0.6)] tabular-nums">
                {s.status === "disconnected" ? "—" : `${s.health_score}%`}
              </span>
              {s.status === "disconnected" && (
                <span className="text-[rgba(245,245,245,0.45)] shrink-0">(disconnected)</span>
              )}
            </div>
          ))}
          <p className="text-[rgba(245,245,245,0.45)] pt-2 border-t border-white/5">
            Last full sync: {new Date(health.last_full_sync).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
