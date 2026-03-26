"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IngestionStatus } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";
import type { Team } from "@/types/teams";
import { Input } from "@/components/ui/input";

export type KnowledgeVaultFiltersState = {
  source_ids?: string[];
  /** Omitted = all scopes */
  scope?: "private" | string;
  /** OR match: doc must include at least one selected tag */
  tags?: string[];
  ingestion_status?: IngestionStatus;
};

type Props = {
  filters: KnowledgeVaultFiltersState;
  onFiltersChange: (f: KnowledgeVaultFiltersState) => void;
  hasDocumentFilters: boolean;
  onClearDocumentFilters: () => void;
  /** Distinct auto-generated tag labels for vault documents */
  tagOptions: string[];
  /** Teams shown as scope pills (admin: all; advisor: membership) */
  scopeTeams: Team[];
};

const AVAILABILITY: { value: IngestionStatus; label: string }[] = [
  { value: "indexed", label: "Indexed" },
  { value: "processing", label: "Processing" },
  { value: "not_indexed", label: "Not indexed" },
];

/** First N team pills inline; rest in overflow (spec: >4 teams → first 3 + More) */
const MAX_INLINE_TEAM_PILLS = 3;

export default function KnowledgeVaultFilters({
  filters,
  onFiltersChange,
  hasDocumentFilters,
  onClearDocumentFilters,
  tagOptions,
  scopeTeams,
}: Props) {
  const inlineScopeTeams = scopeTeams.slice(0, MAX_INLINE_TEAM_PILLS);
  const overflowScopeTeams = scopeTeams.slice(MAX_INLINE_TEAM_PILLS);
  const selectedTags = filters.tags ?? [];
  const [tagSearch, setTagSearch] = useState("");

  const filteredSortedTagOptions = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    const base = q.length ? tagOptions.filter((t) => t.toLowerCase().includes(q)) : [...tagOptions];
    return base.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [tagOptions, tagSearch]);

  const setScope = (scope: KnowledgeVaultFiltersState["scope"]) => {
    onFiltersChange({
      ...filters,
      scope,
    });
  };

  const toggleScope = (value: NonNullable<KnowledgeVaultFiltersState["scope"]>) => {
    setScope(filters.scope === value ? undefined : value);
  };

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onFiltersChange({
      ...filters,
      tags: next.length ? next : undefined,
    });
  };

  const removeTag = (tag: string) => {
    const next = selectedTags.filter((t) => t !== tag);
    onFiltersChange({
      ...filters,
      tags: next.length ? next : undefined,
    });
  };

  return (
    <div className="p-4 space-y-4">
      {hasDocumentFilters && (
        <button
          type="button"
          onClick={onClearDocumentFilters}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
        >
          Clear document filters
        </button>
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-start sm:gap-8">
        <section className="min-w-0" role="group" aria-labelledby="kv-filter-scope-label">
          <h3
            id="kv-filter-scope-label"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2"
          >
            Scope
        </h3>
          <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Filter by scope">
                <button
                  type="button"
              aria-pressed={filters.scope == null}
              onClick={() => setScope(undefined)}
                  className={cn(
                "text-[10px] px-2.5 py-1 rounded-lg transition-colors border",
                filters.scope == null
                  ? "bg-[rgba(201,169,110,0.15)] text-[#C9A96E] border-[rgba(201,169,110,0.3)]"
                  : "text-[#9B9590] hover:text-[#F5F0EB] border-transparent"
              )}
            >
              All
                </button>
            <button
              type="button"
              aria-pressed={filters.scope === "private"}
              onClick={() => toggleScope("private")}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-lg transition-colors border",
                filters.scope === "private"
                  ? "bg-[rgba(201,169,110,0.15)] text-[#C9A96E] border-[rgba(201,169,110,0.3)]"
                  : "text-[#9B9590] hover:text-[#F5F0EB] border-transparent"
              )}
            >
              Private
            </button>
            {inlineScopeTeams.map((team) => (
              <button
                key={team.id}
                type="button"
                aria-pressed={filters.scope === team.id}
                onClick={() => toggleScope(team.id)}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-lg transition-colors border max-w-[160px] truncate",
                  filters.scope === team.id
                    ? "bg-[rgba(201,169,110,0.15)] text-[#C9A96E] border-[rgba(201,169,110,0.3)]"
                    : "text-[#9B9590] hover:text-[#F5F0EB] border-transparent"
                )}
                title={team.name}
              >
                {team.name}
              </button>
            ))}
            {overflowScopeTeams.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "text-[10px] px-2.5 py-1 rounded-lg text-[#9B9590] hover:text-[#F5F0EB] inline-flex items-center gap-1 border border-transparent",
                      overflowScopeTeams.some((t) => t.id === filters.scope) &&
                        "bg-[rgba(201,169,110,0.15)] text-[#C9A96E] border-[rgba(201,169,110,0.3)]"
                    )}
                  >
                    +{overflowScopeTeams.length} more
                    <ChevronDown className="w-3 h-3" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="bg-[#0c0c12] border border-[rgba(255,255,255,0.06)] max-h-64 overflow-y-auto"
                >
                  {overflowScopeTeams.map((team) => (
                    <DropdownMenuItem
                      key={team.id}
                      className="text-[11px] text-[#9B9590] hover:text-[#F5F0EB] focus:text-[#F5F0EB]"
                      onClick={() => setScope(team.id)}
                    >
                      {team.name}
                      {filters.scope === team.id ? " ✓" : ""}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </section>

        <section className="min-w-0 flex-1 sm:max-w-md lg:max-w-lg" role="group" aria-labelledby="kv-filter-tags-label">
          <h3
            id="kv-filter-tags-label"
            className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
          >
            Tags
          </h3>
          {selectedTags.length > 0 && (
            <div className="mb-1.5 flex max-h-[2.75rem] flex-wrap content-start gap-1 overflow-y-auto overscroll-contain">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex max-w-full shrink-0 items-center gap-0.5 rounded border border-white/[0.12] bg-white/[0.06] pl-1.5 pr-0.5 py-0.5 text-[10px] text-[var(--text-secondary)]"
                >
                  <span className="truncate max-w-[140px]" title={tag}>
                    {tag}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded p-0.5 text-[var(--text-quaternary)] hover:bg-white/[0.08] hover:text-[var(--text-secondary)]"
                    aria-label={`Remove tag filter ${tag}`}
                  >
                    <X size={11} strokeWidth={2} aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          )}
          {tagOptions.length > 0 && (
            <div className="relative mb-1.5">
              <Search
                size={13}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-quaternary)] pointer-events-none"
                aria-hidden
              />
              <Input
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="Search tags…"
                className="h-7 pl-7 text-xs bg-white/[0.04] border-white/[0.08] text-[var(--text-secondary)] placeholder:text-[var(--text-quaternary)]"
                aria-label="Search tag filters"
              />
        </div>
      )}
          {tagOptions.length === 0 ? (
            <p className="text-[11px] text-[var(--text-quaternary)] py-1">No tags in catalog</p>
          ) : (
            <details className="group rounded-lg border border-white/[0.06] bg-black/20 overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-1.5 text-[11px] text-[var(--text-secondary)] hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1 font-medium">Browse tag list</span>
                <span className="tabular-nums text-[var(--text-quaternary)]">{tagOptions.length}</span>
                <ChevronDown
                  size={14}
                  className="shrink-0 text-[var(--text-quaternary)] transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div
                className="max-h-[7.5rem] overflow-y-auto overscroll-contain border-t border-white/[0.05]"
                role="listbox"
                aria-label="Filter by tags"
                aria-multiselectable
              >
                {filteredSortedTagOptions.length === 0 ? (
                  <p className="px-2.5 py-2 text-[11px] text-[var(--text-quaternary)]">
                    No tags match “{tagSearch.trim()}”
                  </p>
                ) : (
                  <ul className="divide-y divide-white/[0.04]">
                    {filteredSortedTagOptions.map((tag) => {
                      const pressed = selectedTags.includes(tag);
                      return (
                        <li key={tag}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={pressed}
                            onClick={() => toggleTag(tag)}
                            title={tag}
                            className={cn(
                              "flex w-full items-center gap-2 px-2.5 py-1 text-left text-[11px] transition-colors",
                              pressed
                                ? "bg-white/[0.06] text-[var(--text-primary)]"
                                : "text-[var(--text-tertiary)] hover:bg-white/[0.035] hover:text-[var(--text-secondary)]"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-3 w-3 shrink-0 items-center justify-center rounded border",
                                pressed
                                  ? "border-white/30 bg-white/[0.1] text-[var(--text-secondary)]"
                                  : "border-white/[0.12] bg-transparent"
                              )}
                              aria-hidden
                            >
                              {pressed ? <Check size={9} strokeWidth={2.5} /> : null}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{tag}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </details>
          )}
        </section>

        <section className="min-w-0" role="group" aria-labelledby="kv-filter-ingestion-label">
          <h3
            id="kv-filter-ingestion-label"
            className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2"
          >
            Availability
        </h3>
          <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Filter by RAG availability">
            {AVAILABILITY.map(({ value, label }) => {
              const pressed = filters.ingestion_status === value;
              return (
            <button
                  key={value}
              type="button"
                  aria-pressed={pressed}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      ingestion_status: filters.ingestion_status === value ? undefined : value,
                    })
                  }
              className={cn(
                "text-xs px-2 py-1 rounded border",
                    pressed &&
                      value === "indexed" &&
                      "bg-[var(--color-success-muted)] border-[color-mix(in_srgb,var(--color-success)_38%,transparent)] text-[var(--color-success)]",
                    pressed &&
                      value === "processing" &&
                      "bg-[var(--color-warning-muted)] border-[color-mix(in_srgb,var(--color-warning)_35%,transparent)] text-[var(--color-warning)]",
                    pressed &&
                      value === "not_indexed" &&
                      "bg-white/10 border-white/22 text-[var(--text-primary)]",
                    !pressed && "border-white/10 text-[var(--text-secondary)] hover:bg-white/5"
                  )}
                >
                  {label}
            </button>
              );
            })}
        </div>
      </section>
      </div>
    </div>
  );
}
