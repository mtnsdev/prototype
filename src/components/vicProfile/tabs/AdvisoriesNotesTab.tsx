"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { AdvisoryNote, AdvisorNote, InternalFlag, SourceConflict } from "@/types/vic-profile";
import { ProfileSectionCard } from "../components/ProfileSectionCard";
import { AdvisoryBanner } from "../components/AdvisoryBanner";
import { ConflictResolver } from "../components/ConflictResolver";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/vic-profile-helpers";
import { Button } from "@/components/ui/button";

const FLAG_LABELS: Record<InternalFlag, string> = {
  sensitive_client: "Sensitive client",
  senior_advisor_approval_required: "Senior advisor approval",
  payment_history_concern: "Payment history concern",
  high_maintenance: "High maintenance",
  referral_vip: "Referral VIP",
  press_sensitive: "Press sensitive",
};

export function AdvisoriesNotesTab({
  advisories,
  sourceConflicts,
  advisorNotes,
  internalFlags: initialFlags,
}: {
  advisories: AdvisoryNote[];
  sourceConflicts: SourceConflict[];
  advisorNotes: AdvisorNote[];
  internalFlags: InternalFlag[];
}) {
  const [flags, setFlags] = useState<Set<InternalFlag>>(() => new Set(initialFlags));
  const [conflicts, setConflicts] = useState(sourceConflicts);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("");

  const activeAdvisories = useMemo(
    () => [...advisories].filter((a) => a.status === "active").sort((a, b) => rankSev(b) - rankSev(a)),
    [advisories]
  );

  const archivedAdvisories = useMemo(() => advisories.filter((a) => a.status !== "active"), [advisories]);
  const unresolved = conflicts.filter((c) => c.status === "unresolved");
  const resolvedConflicts = conflicts.filter((c) => c.status === "resolved");

  const filteredNotes = useMemo(() => {
    const list = [...advisorNotes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (!tagFilter.trim()) return list;
    const t = tagFilter.toLowerCase();
    return list.filter((n) => n.tags.some((x) => x.toLowerCase().includes(t)));
  }, [advisorNotes, tagFilter]);

  const toggleFlag = (f: InternalFlag) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const resolveConflict = (id: string, value: string) => {
    setConflicts((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "resolved" as const, resolvedValue: value, resolvedAt: new Date().toISOString(), resolvedBy: "You" }
          : c
      )
    );
  };

  return (
    <div className="space-y-6">
      <ProfileSectionCard title="Active advisories">
        {activeAdvisories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active advisories.</p>
        ) : (
          <div className="space-y-3">
            {activeAdvisories.map((a) => (
              <AdvisoryBanner key={a.id} advisory={a} />
            ))}
          </div>
        )}
      </ProfileSectionCard>

      <ProfileSectionCard title="Source conflict queue">
        {unresolved.length === 0 ? (
          <p className="text-sm text-muted-foreground">No unresolved conflicts.</p>
        ) : (
          <div className="space-y-3">
            {unresolved.map((c) => (
              <ConflictResolver key={c.id} conflict={c} onResolve={resolveConflict} />
            ))}
          </div>
        )}
      </ProfileSectionCard>

      <ProfileSectionCard
        title="Advisor notes"
        action={
          <input
            placeholder="Filter by tag…"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
          />
        }
      >
        {filteredNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes match this filter.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {filteredNotes.map((n) => (
              <li key={n.id} className="rounded-lg border border-border bg-background p-3">
                <p className="whitespace-pre-wrap text-foreground">{n.content}</p>
                <p className="mt-2 text-2xs text-muted-foreground">
                  {formatShortDate(n.createdAt)} · {n.createdBy}
                  {n.linkedContext ? ` · ${n.linkedContext}` : ""}
                </p>
                {n.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {n.tags.map((t) => (
                      <span key={t} className="rounded-md bg-muted/50 px-1.5 py-0.5 text-2xs text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </ProfileSectionCard>

      <ProfileSectionCard title="Internal flags (advisor-only)">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FLAG_LABELS) as InternalFlag[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFlag(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                flags.has(f)
                  ? "border-[var(--brand-cta)]/50 bg-[var(--brand-cta)]/15 text-foreground"
                  : "border-border bg-muted/25 text-muted-foreground hover:bg-muted/40"
              )}
            >
              {FLAG_LABELS[f]}
            </button>
          ))}
        </div>
      </ProfileSectionCard>

      <div className="rounded-xl border border-border bg-background">
        <button
          type="button"
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold"
          onClick={() => setArchivedOpen(!archivedOpen)}
        >
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !archivedOpen && "-rotate-90")}
          />
          Archived ({archivedAdvisories.length + resolvedConflicts.length})
        </button>
        {archivedOpen ? (
          <div className="space-y-4 border-t border-border p-4">
            <div>
              <p className="text-2xs font-medium uppercase text-muted-foreground">Resolved / archived advisories</p>
              <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                {archivedAdvisories.length === 0 ? (
                  <li>None</li>
                ) : (
                  archivedAdvisories.map((a) => (
                    <li key={a.id}>
                      {a.title} — {a.status}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <p className="text-2xs font-medium uppercase text-muted-foreground">Resolved conflicts</p>
              <ul className="mt-2 space-y-2">
                {resolvedConflicts.map((c) => (
                  <li key={c.id}>
                    <ConflictResolver conflict={c} />
                  </li>
                ))}
                {resolvedConflicts.length === 0 ? <li className="text-xs text-muted-foreground">None</li> : null}
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm">
          Export audit trail
        </Button>
      </div>
    </div>
  );
}

function rankSev(a: AdvisoryNote): number {
  if (a.severity === "critical") return 3;
  if (a.severity === "warning") return 2;
  return 1;
}
