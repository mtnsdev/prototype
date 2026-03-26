"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, Tags, Users, Zap } from "lucide-react";
import type { IngestionStatus } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";
import type { Team } from "@/types/teams";
import { TEAM_EVERYONE_ID } from "@/types/teams";

export type KnowledgeVaultFiltersState = {
  source_ids?: string[];
  scope?: "private" | string;
  tags?: string[];
  ingestion_status?: IngestionStatus;
};

type Props = {
  filters: KnowledgeVaultFiltersState;
  onFiltersChange: (f: KnowledgeVaultFiltersState) => void;
  hasDocumentFilters: boolean;
  onClearDocumentFilters: () => void;
  searchActive?: boolean;
  tagOptions: string[];
  scopeTeams: Team[];
};

const INGESTION_OPTIONS: { value: IngestionStatus; label: string }[] = [
  { value: "indexed", label: "Indexed" },
  { value: "processing", label: "Processing" },
  { value: "not_indexed", label: "Not indexed" },
];

function scopeSummary(
  scope: KnowledgeVaultFiltersState["scope"],
  everyoneTeam: Team | undefined,
  scopeTeams: Team[]
): string | null {
  if (scope == null) return null;
  if (scope === "private") return "Private";
  if (scope === TEAM_EVERYONE_ID || (everyoneTeam && scope === everyoneTeam.id)) {
    return everyoneTeam ? `Agency · ${everyoneTeam.name}` : "Agency-wide";
  }
  const team = scopeTeams.find((t) => t.id === scope);
  return team?.name ?? "Team";
}

function ingestionSummary(status: IngestionStatus | undefined): string | null {
  if (status == null) return null;
  return INGESTION_OPTIONS.find((o) => o.value === status)?.label ?? null;
}

/** Match ProductDirectoryLocationDropdown: trigger + absolute panel */
function useFilterDropdownOpen() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, rootRef };
}

const triggerBase =
  "flex max-w-[220px] items-center gap-2 rounded-lg border px-3 py-1.5 text-left transition-colors";
const triggerIdle = "border-[rgba(255,255,255,0.03)] bg-[#0c0c12] hover:border-[rgba(255,255,255,0.06)]";
const triggerActive = "border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.06)]";

const panelClass =
  "absolute left-0 top-full z-[60] mt-1 max-h-80 w-64 overflow-y-auto rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] shadow-xl";

function KvScopeDropdown({
  filters,
  onFiltersChange,
  everyoneTeam,
  otherTeams,
  scopeTeams,
}: {
  filters: KnowledgeVaultFiltersState;
  onFiltersChange: (f: KnowledgeVaultFiltersState) => void;
  everyoneTeam: Team | undefined;
  otherTeams: Team[];
  scopeTeams: Team[];
}) {
  const { open, setOpen, rootRef } = useFilterDropdownOpen();
  const summary = scopeSummary(filters.scope, everyoneTeam, scopeTeams);
  const has = summary != null;

  const setScope = useCallback(
    (scope: KnowledgeVaultFiltersState["scope"]) => {
      onFiltersChange({ ...filters, scope });
      setOpen(false);
    },
    [filters, onFiltersChange]
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(triggerBase, has ? triggerActive : triggerIdle)}
      >
        {!has ? (
          <>
            <Users className="h-3 w-3 shrink-0 text-[#4A4540]" />
            <span className="text-[11px] text-[#9B9590]">Access</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[11px] text-[#F5F0EB]">{summary}</span>
        )}
        <ChevronDown className="h-3 w-3 shrink-0 text-[#4A4540]" />
      </button>

      {open && (
        <div className={panelClass}>
          <div className="border-b border-[rgba(255,255,255,0.03)] px-2 py-1.5">
            <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#4A4540]">General</span>
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
            onClick={() => setScope(undefined)}
          >
            <span>All visible</span>
            {filters.scope == null ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3" />}
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
            onClick={() => setScope("private")}
          >
            <span>Private</span>
            {filters.scope === "private" ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3" />}
          </button>
          <div className="border-b border-[rgba(255,255,255,0.03)] bg-[rgba(255,255,255,0.02)] px-2 py-1.5">
            <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#4A4540]">Agency & teams</span>
          </div>
          {everyoneTeam ? (
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
              onClick={() => setScope(everyoneTeam.id)}
            >
              <span className="truncate pr-2">Agency-wide ({everyoneTeam.name})</span>
              {filters.scope === everyoneTeam.id ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3" />}
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
              onClick={() => setScope(TEAM_EVERYONE_ID)}
            >
              <span>Agency-wide</span>
              {filters.scope === TEAM_EVERYONE_ID ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3" />}
            </button>
          )}
          {otherTeams.map((team) => (
            <button
              key={team.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
              onClick={() => setScope(team.id)}
            >
              <span className="truncate pr-2">{team.name}</span>
              {filters.scope === team.id ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function KvTagsDropdown({
  filters,
  onFiltersChange,
  tagOptions,
}: {
  filters: KnowledgeVaultFiltersState;
  onFiltersChange: (f: KnowledgeVaultFiltersState) => void;
  tagOptions: string[];
}) {
  const { open, setOpen, rootRef } = useFilterDropdownOpen();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedTags = filters.tags ?? [];

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q.length ? tagOptions.filter((t) => t.toLowerCase().includes(q)) : [...tagOptions];
    return base.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [tagOptions, search]);

  const toggleTag = useCallback(
    (tag: string) => {
      const next = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag];
      onFiltersChange({ ...filters, tags: next.length ? next : undefined });
    },
    [filters, onFiltersChange, selectedTags]
  );

  const clearTags = useCallback(() => {
    onFiltersChange({ ...filters, tags: undefined });
    setSearch("");
  }, [filters, onFiltersChange]);

  const has = selectedTags.length > 0;
  const summary =
    has ? (
      <span className="truncate text-[11px] text-[#F5F0EB]">
        {selectedTags.slice(0, 2).join(", ")}
        {selectedTags.length > 2 && ` +${selectedTags.length - 2}`}
      </span>
    ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        disabled={tagOptions.length === 0}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          triggerBase,
          tagOptions.length === 0 && "cursor-not-allowed opacity-50",
          has ? triggerActive : triggerIdle
        )}
      >
        {!has ? (
          <>
            <Tags className="h-3 w-3 shrink-0 text-[#4A4540]" />
            <span className="text-[11px] text-[#9B9590]">Tags</span>
          </>
        ) : (
          <span className="min-w-0 flex-1">{summary}</span>
        )}
        <ChevronDown className="h-3 w-3 shrink-0 text-[#4A4540]" />
      </button>

      {open && tagOptions.length > 0 && (
        <div className={cn(panelClass, "w-72")}>
          <div className="sticky top-0 z-[1] border-b border-[rgba(255,255,255,0.03)] bg-[#0c0c12] p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#4A4540]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tags…"
                className="w-full rounded-lg border-none bg-[rgba(255,255,255,0.03)] py-1.5 pl-8 pr-2 text-[11px] text-[#F5F0EB] placeholder-[#4A4540] focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/40"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {selectedTags.length > 0 ? (
              <button
                type="button"
                className="mt-1.5 text-[10px] text-[#6B6560] transition-colors hover:text-[#C9A96E]"
                onClick={clearTags}
              >
                Clear all tags
              </button>
            ) : null}
          </div>
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-[11px] text-[#6B6560]">No match</p>
          ) : (
            filtered.map((tag) => {
              const on = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                  onClick={() => toggleTag(tag)}
                >
                  <span className="truncate pr-2">{tag}</span>
                  {on ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function KvIndexingDropdown({
  filters,
  onFiltersChange,
}: {
  filters: KnowledgeVaultFiltersState;
  onFiltersChange: (f: KnowledgeVaultFiltersState) => void;
}) {
  const { open, setOpen, rootRef } = useFilterDropdownOpen();
  const summary = ingestionSummary(filters.ingestion_status);
  const has = summary != null;

  const setIngestion = useCallback(
    (v: IngestionStatus | undefined) => {
      onFiltersChange({ ...filters, ingestion_status: v });
      setOpen(false);
    },
    [filters, onFiltersChange]
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(triggerBase, has ? triggerActive : triggerIdle)}
      >
        {!has ? (
          <>
            <Zap className="h-3 w-3 shrink-0 text-[#4A4540]" />
            <span className="text-[11px] text-[#9B9590]">Indexing</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[11px] text-[#F5F0EB]">{summary}</span>
        )}
        <ChevronDown className="h-3 w-3 shrink-0 text-[#4A4540]" />
      </button>

      {open && (
        <div className={panelClass}>
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
            onClick={() => setIngestion(undefined)}
          >
            <span>Any</span>
            {filters.ingestion_status == null ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3" />}
          </button>
          {INGESTION_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] text-[#9B9590] transition-colors hover:bg-[rgba(255,255,255,0.04)]"
              onClick={() => setIngestion(value)}
            >
              <span>{label}</span>
              {filters.ingestion_status === value ? <Check className="h-3 w-3 shrink-0 text-[#C9A96E]" /> : <span className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeVaultFilters({
  filters,
  onFiltersChange,
  hasDocumentFilters,
  onClearDocumentFilters,
  searchActive = false,
  tagOptions,
  scopeTeams,
}: Props) {
  const { everyoneTeam, otherTeams } = useMemo(() => {
    const everyone = scopeTeams.find((t) => t.id === TEAM_EVERYONE_ID);
    const rest = scopeTeams
      .filter((t) => t.id !== TEAM_EVERYONE_ID)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return { everyoneTeam: everyone, otherTeams: rest };
  }, [scopeTeams]);

  const activeFilterCount =
    (filters.scope != null ? 1 : 0) +
    (filters.tags?.length ?? 0) +
    (filters.ingestion_status != null ? 1 : 0) +
    (searchActive ? 1 : 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <KvScopeDropdown
            filters={filters}
            onFiltersChange={onFiltersChange}
            everyoneTeam={everyoneTeam}
            otherTeams={otherTeams}
            scopeTeams={scopeTeams}
          />
          <KvTagsDropdown filters={filters} onFiltersChange={onFiltersChange} tagOptions={tagOptions} />
          <KvIndexingDropdown filters={filters} onFiltersChange={onFiltersChange} />
        </div>
        {hasDocumentFilters ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <span className="text-[10px] tabular-nums text-[#6B6560]">{activeFilterCount} active</span>
            <button
              type="button"
              onClick={onClearDocumentFilters}
              className="text-[11px] text-[#C9A96E] transition-colors hover:text-[#D4B383] hover:underline"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
