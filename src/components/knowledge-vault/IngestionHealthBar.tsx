"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { IngestionHealth } from "@/types/knowledge-vault";

type Props = {
  health: IngestionHealth;
  onFilterFailed: () => void;
};

export default function IngestionHealthBar({ health, onFilterFailed }: Props) {
  const [expanded, setExpanded] = useState(false);
  const total = health.total_documents || 1;
  const pct = (n: number) => (n / total) * 100;

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#161616] p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-[#F5F5F5]">Ingestion Health</span>
        <div className="flex-1 h-3 rounded-full overflow-hidden flex bg-white/5">
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
        {expanded ? "Hide" : "Show"} details
      </button>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-white/10 text-xs text-[rgba(245,245,245,0.6)] space-y-1">
          <p>Avg freshness: {health.avg_freshness_days} days</p>
          <p>Last full sync: {new Date(health.last_full_sync).toLocaleString()}</p>
          <p>Stale documents: {health.stale}</p>
        </div>
      )}
    </div>
  );
}
