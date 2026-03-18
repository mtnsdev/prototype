"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { DataSource, IngestionHealth } from "@/types/knowledge-vault";

type Props = {
  health: IngestionHealth;
  sources: DataSource[];
  onFilterFailed: () => void;
};

export default function IngestionHealthBar({ health, sources, onFilterFailed }: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = health.total_documents || 1;
  const pct = (n: number) => (n / total) * 100;

  const orderedSources = [...sources].sort((a, b) => {
    const order = [
      "src-gdrive-admin",
      "src-gdrive-personal",
      "src-claro-docs",
      "src-claro-pages",
      "src-manual",
      "src-virtuoso",
      "src-web",
      "src-email",
    ];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-[#F5F5F5]">Ingestion Health</span>
        <div className="flex-1 h-3 rounded-full overflow-hidden flex bg-white/5 min-w-[80px]">
          <div
            className="bg-[var(--muted-success-text)] transition-all"
            style={{ width: pct(health.indexed) + "%" }}
          />
          <div
            className="bg-[var(--muted-info-text)] transition-all"
            style={{ width: pct(health.processing) + "%" }}
          />
          <div
            className="bg-[rgba(255,255,255,0.2)] transition-all"
            style={{ width: pct(health.pending) + "%" }}
          />
          <div
            className="bg-[var(--muted-error-text)] transition-all"
            style={{ width: pct(health.failed) + "%" }}
          />
        </div>
        <div className="text-xs text-[rgba(245,245,245,0.7)] shrink-0">
          <span className="text-[var(--muted-success-text)]">{health.indexed} indexed</span>
          {" · "}
          <span className="text-[var(--muted-info-text)]">{health.processing} processing</span>
          {" · "}
          <span className="text-[rgba(245,245,245,0.5)]">{health.pending} pending</span>
          {" · "}
          <button
            type="button"
            onClick={onFilterFailed}
            className="text-[var(--muted-error-text)] hover:underline"
          >
            {health.failed} failed
          </button>
        </div>
      </div>
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
            <div key={s.id} className="flex items-center gap-3">
              <span className="text-[rgba(245,245,245,0.85)] w-[200px] shrink-0 truncate" title={s.name}>
                {s.name}
              </span>
              <span className="text-[rgba(245,245,245,0.5)] w-16 shrink-0 tabular-nums">
                {s.document_count} docs
              </span>
              <span className="text-[rgba(245,245,245,0.35)]">|</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden min-w-[60px]">
                {s.status === "disconnected" ? (
                  <div className="h-full w-0" />
                ) : (
                  <div
                    className={
                      s.health_score >= 80
                        ? "h-full bg-[var(--muted-success-text)]"
                        : s.health_score >= 50
                          ? "h-full bg-[var(--muted-amber-text)]"
                          : "h-full bg-[var(--muted-error-text)]"
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
            Last full sync: {new Date(health.last_full_sync).toLocaleString()} · Needs attention (vault-wide):{" "}
            {health.stale}
          </p>
        </div>
      )}
    </div>
  );
}
