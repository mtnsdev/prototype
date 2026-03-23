"use client";

import type { IngestionStatus } from "@/types/knowledge-vault";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { getVisibleTeamsForUser } from "@/lib/teamsMock";

export type KnowledgeVaultFiltersState = {
  source_ids?: string[];
  /** Omitted = all scopes */
  scope?: "private" | string;
  ingestion_status?: IngestionStatus;
};

type Props = {
  filters: KnowledgeVaultFiltersState;
  onFiltersChange: (f: KnowledgeVaultFiltersState) => void;
  hasDocumentFilters: boolean;
  onClearDocumentFilters: () => void;
};

export default function KnowledgeVaultFilters({
  filters,
  onFiltersChange,
  hasDocumentFilters,
  onClearDocumentFilters,
}: Props) {
  const { user } = useUser();
  const scopeTeams = getVisibleTeamsForUser(user?.id);

  const setScope = (scope: KnowledgeVaultFiltersState["scope"]) => {
    onFiltersChange({
      ...filters,
      scope,
    });
  };

  const toggleScope = (value: NonNullable<KnowledgeVaultFiltersState["scope"]>) => {
    setScope(filters.scope === value ? undefined : value);
  };

  return (
    <div className="p-4 space-y-4">
      <p className="text-[11px] leading-relaxed text-[rgba(245,245,245,0.45)]">
        Choose sources on the cards above. These options filter the document list only—they do not change which
        connection is selected.
      </p>

      {hasDocumentFilters && (
        <button
          type="button"
          onClick={onClearDocumentFilters}
          className="text-xs text-[rgba(245,245,245,0.7)] hover:text-[#F5F5F5] hover:underline"
        >
          Clear document filters
        </button>
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-start sm:gap-8">
        <section className="min-w-0" role="group" aria-labelledby="kv-filter-scope-label">
          <h3
            id="kv-filter-scope-label"
            className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2"
          >
            Scope
          </h3>
          <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Filter by scope">
            <button
              type="button"
              aria-pressed={filters.scope == null}
              onClick={() => setScope(undefined)}
              className={cn(
                "text-xs px-2 py-1 rounded border",
                filters.scope == null
                  ? "bg-white/10 text-[#F5F5F5] border-white/20"
                  : "border-white/10 text-[rgba(245,245,245,0.6)] hover:bg-white/5"
              )}
            >
              All
            </button>
            <button
              type="button"
              aria-pressed={filters.scope === "private"}
              onClick={() => toggleScope("private")}
              className={cn(
                "text-xs px-2 py-1 rounded border",
                filters.scope === "private"
                  ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                  : "border-white/10 text-[rgba(245,245,245,0.6)] hover:bg-white/5"
              )}
            >
              Private
            </button>
            {scopeTeams.map((team) => (
              <button
                key={team.id}
                type="button"
                aria-pressed={filters.scope === team.id}
                onClick={() => toggleScope(team.id)}
                className={cn(
                  "text-xs px-2 py-1 rounded border max-w-[160px] truncate",
                  filters.scope === team.id
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "border-white/10 text-[rgba(245,245,245,0.6)] hover:bg-white/5"
                )}
                title={team.name}
              >
                {team.name}
              </button>
            ))}
          </div>
        </section>

        <section className="min-w-0" role="group" aria-labelledby="kv-filter-ingestion-label">
          <h3
            id="kv-filter-ingestion-label"
            className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2"
          >
            Ingestion status
          </h3>
          <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Filter by ingestion status">
            {(["indexed", "pending", "processing", "failed"] as const).map((s) => {
              const pressed = filters.ingestion_status === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={pressed}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      ingestion_status: filters.ingestion_status === s ? undefined : s,
                    })
                  }
                  className={cn(
                    "text-xs px-2 py-1 rounded border capitalize",
                    pressed
                      ? s === "failed"
                        ? "bg-[var(--muted-error-bg)] text-[var(--muted-error-text)] border-[var(--muted-error-border)]"
                        : "bg-white/10 border-white/20 text-[#F5F5F5]"
                      : "border-white/10 text-[rgba(245,245,245,0.6)] hover:bg-white/5"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
