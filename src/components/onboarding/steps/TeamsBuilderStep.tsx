"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeams } from "@/contexts/TeamsContext";
import type { HubSnapshot } from "@/components/onboarding/types";
import type { InviteRow } from "@/components/onboarding/InviteTeamModal";

const MOCK_PAGES = [
  "Policies & training hub",
  "Supplier guides — Europe",
  "Commission & preferred partners",
  "Destination briefs — APAC",
];

const MOCK_DOCS = [
  "Virtuoso rates 2026.pdf",
  "Japan preferred hotels.xlsx",
  "Onboarding checklist.docx",
];

type TeamDraft = {
  id: string;
  name: string;
  description: string;
  pageKeys: Set<string>;
  docKeys: Set<string>;
  memberEmails: string;
};

function newTeamDraft(): TeamDraft {
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    description: "",
    pageKeys: new Set(),
    docKeys: new Set(),
    memberEmails: "",
  };
}

type TeamsBuilderStepProps = {
  hubSnapshot: HubSnapshot;
  /** Pre-filled rows for the completion invite modal (emails → teams from this step). */
  onContinue: (inviteRowsForCompletion: InviteRow[] | null) => void;
  onBack: () => void;
};

export function TeamsBuilderStep({ hubSnapshot, onContinue, onBack }: TeamsBuilderStepProps) {
  const { createTeam } = useTeams();
  const [teams, setTeams] = useState<TeamDraft[]>(() => [newTeamDraft()]);

  const hasSources =
    hubSnapshot.intranetConnected ||
    hubSnapshot.sharedDriveConnected ||
    hubSnapshot.personalConnected;

  const updateTeam = useCallback((id: string, patch: Partial<TeamDraft>) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const toggleInSet = useCallback((id: string, field: "pageKeys" | "docKeys", key: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = new Set(t[field]);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return { ...t, [field]: next };
      })
    );
  }, []);

  const addTeam = useCallback(() => {
    setTeams((prev) => [...prev, newTeamDraft()]);
  }, []);

  const handleContinue = () => {
    const emailToTeamIds = new Map<string, Set<string>>();

    for (const t of teams) {
      const name = t.name.trim();
      if (!name) continue;
      const emails = t.memberEmails
        .split(/[\s,;]+/)
        .map((e) => e.trim())
        .filter(Boolean);
      const memberIds = emails.length > 0 ? emails.map((e) => `invite:${e}`) : ["user-pending"];
      const teamId = createTeam(name, memberIds);
      if (!teamId) continue;
      if (emails.length === 0) continue;
      for (const email of emails) {
        const lower = email.toLowerCase();
        if (!emailToTeamIds.has(lower)) emailToTeamIds.set(lower, new Set());
        emailToTeamIds.get(lower)!.add(teamId);
      }
    }

    let inviteRowsForCompletion: InviteRow[] | null = null;
    if (emailToTeamIds.size > 0) {
      inviteRowsForCompletion = Array.from(emailToTeamIds.entries()).map(([email, idSet], idx) => ({
        id: `invite-from-teams-${idx}-${email}`,
        email,
        role: "user" as const,
        teamIds: [...idSet],
      }));
    }

    onContinue(inviteRowsForCompletion);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Teams</h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Create teams to control which knowledge different groups of advisors can access.
        </p>
      </div>

      <div className="space-y-6">
        {teams.map((team, idx) => (
          <div key={team.id} className="rounded-2xl border border-border bg-card/40 p-4 md:p-5">
            <p className="mb-4 text-sm font-medium text-foreground">Team {idx + 1}</p>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`tn-${team.id}`}>Team name</Label>
                  <Input
                    id={`tn-${team.id}`}
                    value={team.name}
                    onChange={(e) => updateTeam(team.id, { name: e.target.value })}
                    placeholder="e.g. Europe Specialists"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`td-${team.id}`}>Description</Label>
                  <Input
                    id={`td-${team.id}`}
                    value={team.description}
                    onChange={(e) => updateTeam(team.id, { description: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assign intranet pages</Label>
                {!hasSources ? (
                  <p className="text-sm text-muted-foreground">
                    No knowledge sources connected yet. Assign content later from Settings.
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {MOCK_PAGES.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id={`${team.id}-p-${p}`}
                          checked={team.pageKeys.has(p)}
                          onChange={() => toggleInSet(team.id, "pageKeys", p)}
                          className="mt-1 rounded border-input"
                        />
                        <label htmlFor={`${team.id}-p-${p}`} className="text-sm text-muted-foreground">
                          {p}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Label>Assign documents</Label>
                {!hasSources ? (
                  <p className="text-sm text-muted-foreground">
                    No knowledge sources connected yet. Assign content later from Settings.
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {MOCK_DOCS.map((d) => (
                      <li key={d} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id={`${team.id}-d-${d}`}
                          checked={team.docKeys.has(d)}
                          onChange={() => toggleInSet(team.id, "docKeys", d)}
                          className="mt-1 rounded border-input"
                        />
                        <label htmlFor={`${team.id}-d-${d}`} className="text-sm text-muted-foreground">
                          {d}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`em-${team.id}`}>Pre-assign members (emails)</Label>
                <Input
                  id={`em-${team.id}`}
                  value={team.memberEmails}
                  onChange={(e) => updateTeam(team.id, { memberEmails: e.target.value })}
                  placeholder="advisor@agency.com, another@agency.com"
                />
                <p className="text-xs text-muted-foreground">
                  Pre-assignment only — invites are sent from the next step (prototype: stored on the team).
                </p>
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addTeam}>
          <Plus className="h-4 w-4" />
          Add another team
        </Button>
      </div>

      <div className="mt-10 flex flex-wrap justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" size="lg" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
