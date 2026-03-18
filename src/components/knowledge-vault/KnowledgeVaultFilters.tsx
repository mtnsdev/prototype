"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DataSource } from "@/types/knowledge-vault";
import type { DataLayer, IngestionStatus } from "@/types/knowledge-vault";
import { DataSourceType } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";

const DATA_LAYER_LABELS: Record<DataLayer, string> = {
  enable: "Enable",
  agency: "Agency",
  advisor: "Advisor",
};

const DATA_LAYER_COLORS: Record<DataLayer, string> = {
  enable: "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border-[var(--muted-info-border)]",
  agency: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  advisor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

function sourceDataLayerLabel(sourceType: DataSourceType): "Agency" | "Advisor" | "Enable" {
  const m: Partial<Record<DataSourceType, "Agency" | "Advisor" | "Enable">> = {
    [DataSourceType.GoogleDriveAdmin]: "Agency",
    [DataSourceType.GoogleDrivePersonal]: "Advisor",
    [DataSourceType.ClaromentisDocuments]: "Agency",
    [DataSourceType.ClaromentisPages]: "Agency",
    [DataSourceType.ManualUpload]: "Advisor",
    [DataSourceType.Virtuoso]: "Agency",
    [DataSourceType.WebScrape]: "Advisor",
    [DataSourceType.EmailTemplate]: "Agency",
    [DataSourceType.Email]: "Agency",
    [DataSourceType.APIStream]: "Agency",
  };
  return m[sourceType] ?? "Agency";
}

export type KnowledgeVaultFiltersState = {
  source_ids?: string[];
  data_layer?: DataLayer;
  ingestion_status?: IngestionStatus;
  tags?: string[];
};

type TagFacet = { name: string; count: number };

type Props = {
  sources: DataSource[];
  filters: KnowledgeVaultFiltersState;
  onFiltersChange: (f: KnowledgeVaultFiltersState) => void;
  onConnectSource: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  tagFacets: TagFacet[];
};

export default function KnowledgeVaultFilters({
  sources,
  filters,
  onFiltersChange,
  onConnectSource,
  hasActiveFilters,
  onClearFilters,
  tagFacets,
}: Props) {
  const selected = filters.source_ids ?? [];

  const toggleFilter = <K extends keyof KnowledgeVaultFiltersState>(
    key: K,
    value: KnowledgeVaultFiltersState[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: filters[key] === value ? undefined : value,
    });
  };

  const toggleSourceId = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    onFiltersChange({
      ...filters,
      source_ids: next.length ? next : undefined,
    });
  };

  const toggleTagFilter = (tag: string) => {
    const current = filters.tags ?? [];
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    onFiltersChange({ ...filters, tags: next.length ? next : undefined });
  };

  return (
    <div className="p-4 space-y-6">
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-xs text-[rgba(245,245,245,0.7)] hover:text-[#F5F5F5] hover:underline"
        >
          Clear all filters
        </button>
      )}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">
          Data sources
        </h3>
        <ul className="space-y-1">
          {sources.map((s) => {
            const connected = s.status === "connected";
            const active = selected.includes(s.id);
            const layer = sourceDataLayerLabel(s.source_type);
            const layerCls =
              layer === "Agency"
                ? "text-blue-400/90"
                : layer === "Advisor"
                  ? "text-violet-400/90"
                  : "text-emerald-400/90";
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!connected}
                  onClick={() => connected && toggleSourceId(s.id)}
                  className={cn(
                    "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm",
                    !connected && "opacity-45 cursor-not-allowed",
                    connected && active && "bg-white/10 text-[#F5F5F5]",
                    connected && !active && "text-[rgba(245,245,245,0.8)] hover:bg-white/5"
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      !connected && "bg-[rgba(255,255,255,0.25)]",
                      connected && s.health_score >= 80 && "bg-[var(--muted-success-text)]",
                      connected &&
                        s.health_score >= 50 &&
                        s.health_score < 80 &&
                        "bg-[var(--muted-amber-text)]",
                      connected && s.health_score < 50 && s.health_score > 0 && "bg-[var(--muted-error-text)]",
                      connected && s.health_score === 0 && "bg-[rgba(255,255,255,0.3)]",
                      s.source_type === DataSourceType.WebScrape && connected && "bg-blue-400"
                    )}
                  />
                  <span className="truncate flex-1 min-w-0">{s.name}</span>
                  {s.document_visible_count != null &&
                  (s.source_type === DataSourceType.ClaromentisDocuments ||
                    s.source_type === DataSourceType.ClaromentisPages) ? (
                    <span className="text-xs shrink-0 tabular-nums">
                      <span className="text-[rgba(245,245,245,0.5)]">{s.document_visible_count}</span>
                      <span className="text-gray-600">/{s.document_count}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-[rgba(245,245,245,0.5)] shrink-0 tabular-nums">
                      {s.document_count}
                    </span>
                  )}
                  <span className={cn("text-[10px] shrink-0 font-medium", layerCls)}>{layer}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 mt-1 text-[rgba(245,245,245,0.7)]"
          onClick={onConnectSource}
        >
          <Plus size={14} /> Connect Source
        </Button>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">
          Data layer
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {(["enable", "agency", "advisor"] as const).map((layer) => (
            <button
              key={layer}
              type="button"
              onClick={() => toggleFilter("data_layer", layer)}
              className={cn(
                "text-xs px-2 py-1 rounded border",
                filters.data_layer === layer
                  ? DATA_LAYER_COLORS[layer]
                  : "border-white/10 text-[rgba(245,245,245,0.6)] hover:bg-white/5"
              )}
            >
              {DATA_LAYER_LABELS[layer]}
            </button>
          ))}
        </div>
      </section>

      {tagFacets.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mb-2">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {tagFacets.map((tag) => (
              <button
                key={tag.name}
                type="button"
                onClick={() => toggleTagFilter(tag.name)}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full transition-all border",
                  filters.tags?.includes(tag.name)
                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                    : "bg-white/5 text-gray-500 border-white/[0.06] hover:border-white/10"
                )}
              >
                {tag.name}
                <span className="ml-1 text-gray-600">{tag.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">
          Ingestion status
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {(["indexed", "pending", "processing", "failed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleFilter("ingestion_status", s)}
              className={cn(
                "text-xs px-2 py-1 rounded border",
                filters.ingestion_status === s
                  ? s === "failed"
                    ? "bg-[var(--muted-error-bg)] text-[var(--muted-error-text)] border-[var(--muted-error-border)]"
                    : "bg-white/10 border-white/20 text-[#F5F5F5]"
                  : "border-white/10 text-[rgba(245,245,245,0.6)] hover:bg-white/5"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
