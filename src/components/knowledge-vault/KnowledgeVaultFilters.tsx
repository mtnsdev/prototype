"use client";

import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DataSource } from "@/types/knowledge-vault";
import type { DataLayer, DocumentType, Freshness, IngestionStatus } from "@/types/knowledge-vault";
import { DocumentType as DocTypeEnum } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";

const DATA_LAYER_LABELS: Record<DataLayer, string> = {
  enable: "Enable",
  agency: "Agency",
  advisor: "Advisor",
};

const DATA_LAYER_COLORS: Record<DataLayer, string> = {
  enable: "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border-[var(--muted-info-border)]",
  agency: "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border-[var(--muted-success-border)]",
  advisor: "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border-[var(--muted-amber-border)]",
};

const FRESHNESS_LABELS: Record<Freshness, string> = {
  fresh: "Fresh (<7d)",
  recent: "Recent (7–30d)",
  aging: "Aging (30–90d)",
  stale: "Stale (>90d)",
};

const FRESHNESS_COLORS: Record<Freshness, string> = {
  fresh: "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)]",
  recent: "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)]",
  aging: "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)]",
  stale: "bg-[var(--muted-error-bg)] text-[var(--muted-error-text)]",
};

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  [DocTypeEnum.DestinationGuide]: "Destination Guide",
  [DocTypeEnum.PropertyProfile]: "Property Profile",
  [DocTypeEnum.RateSheet]: "Rate Sheet",
  [DocTypeEnum.Policy]: "Policy",
  [DocTypeEnum.Contract]: "Contract",
  [DocTypeEnum.TrainingMaterial]: "Training Material",
  [DocTypeEnum.Newsletter]: "Newsletter",
  [DocTypeEnum.ClientReport]: "Client Report",
  [DocTypeEnum.MarketingCollateral]: "Marketing Collateral",
  [DocTypeEnum.InternalMemo]: "Internal Memo",
  [DocTypeEnum.PartnerDirectory]: "Partner Directory",
  [DocTypeEnum.TravelAdvisory]: "Travel Advisory",
};

const COMMON_TAGS = [
  "luxury",
  "wellness",
  "family",
  "adventure",
  "beach",
  "city",
  "Europe",
  "Asia",
  "Virtuoso",
  "commission",
  "rates",
  "policy",
];

export type KnowledgeVaultFiltersState = {
  source_id?: string;
  data_layer?: DataLayer;
  document_type?: DocumentType;
  freshness?: Freshness;
  ingestion_status?: IngestionStatus;
  tags?: string[];
};

type Props = {
  sources: DataSource[];
  filters: KnowledgeVaultFiltersState;
  onFiltersChange: (f: KnowledgeVaultFiltersState) => void;
  onConnectSource: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

export default function KnowledgeVaultFilters({
  sources,
  filters,
  onFiltersChange,
  onConnectSource,
  hasActiveFilters,
  onClearFilters,
}: Props) {
  const [docTypeOpen, setDocTypeOpen] = useState(true);
  const [tagsOpen, setTagsOpen] = useState(false);

  const toggleFilter = <K extends keyof KnowledgeVaultFiltersState>(
    key: K,
    value: KnowledgeVaultFiltersState[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: filters[key] === value ? undefined : value,
    });
  };

  const toggleTag = (tag: string) => {
    const current = filters.tags ?? [];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
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
          {sources.filter((s) => s.status === "connected").map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() =>
                  toggleFilter("source_id", filters.source_id === s.id ? undefined : s.id)
                }
                className={cn(
                  "w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm",
                  filters.source_id === s.id ? "bg-white/10 text-[#F5F5F5]" : "text-[rgba(245,245,245,0.8)] hover:bg-white/5"
                )}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    s.health_score >= 80 && "bg-[var(--muted-success-text)]",
                    s.health_score >= 50 && s.health_score < 80 && "bg-[var(--muted-amber-text)]",
                    s.health_score < 50 && s.health_score > 0 && "bg-[var(--muted-error-text)]"
                  )}
                />
                <span className="truncate flex-1">{s.name}</span>
                <span className="text-xs text-[rgba(245,245,245,0.5)]">{s.document_count}</span>
              </button>
            </li>
          ))}
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

      <section>
        <button
          type="button"
          onClick={() => setDocTypeOpen(!docTypeOpen)}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2"
        >
          {docTypeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Document type
        </button>
        {docTypeOpen && (
          <ul className="space-y-1">
            {(Object.values(DocTypeEnum) as DocumentType[]).slice(0, 8).map((type) => (
              <li key={type}>
                <button
                  type="button"
                  onClick={() => toggleFilter("document_type", type)}
                  className={cn(
                    "w-full text-left px-2 py-1 rounded text-sm",
                    filters.document_type === type ? "bg-white/10 text-[#F5F5F5]" : "text-[rgba(245,245,245,0.7)] hover:bg-white/5"
                  )}
                >
                  {DOC_TYPE_LABELS[type]}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">
          Freshness
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FRESHNESS_LABELS) as Freshness[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFilter("freshness", f)}
              className={cn(
                "text-xs px-2 py-1 rounded",
                filters.freshness === f ? FRESHNESS_COLORS[f] : "bg-white/5 text-[rgba(245,245,245,0.6)] hover:bg-white/10"
              )}
            >
              {FRESHNESS_LABELS[f]}
            </button>
          ))}
        </div>
      </section>

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

      <section>
        <button
          type="button"
          onClick={() => setTagsOpen(!tagsOpen)}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2"
        >
          {tagsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Tags
        </button>
        {tagsOpen && (
          <div className="flex flex-wrap gap-1.5">
            {COMMON_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "text-xs px-2 py-0.5 rounded bg-white/5 hover:bg-white/10",
                  filters.tags?.includes(tag) ? "ring-1 ring-white/20 text-[#F5F5F5]" : "text-[rgba(245,245,245,0.7)]"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
