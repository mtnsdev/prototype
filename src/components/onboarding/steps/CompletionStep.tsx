"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Compass } from "lucide-react";
import type { OnboardingPath } from "@/lib/onboardingState";
import type { HubSnapshot } from "@/components/onboarding/types";
import { InviteTeamModal, type InviteRow } from "@/components/onboarding/InviteTeamModal";
import { useTeams } from "@/contexts/TeamsContext";
import { TEAM_EVERYONE_ID } from "@/types/teams";

type CompletionStepProps = {
  path: OnboardingPath;
  agencyName: string;
  hubSnapshot: HubSnapshot;
  inviteRowsFromTeams: InviteRow[] | null;
  onFinishToChat: () => void;
  onBack: () => void;
  registerAdvance?: (fn: () => void) => void;
};

export function CompletionStep({
  path,
  agencyName,
  hubSnapshot,
  inviteRowsFromTeams,
  onFinishToChat,
  onBack,
  registerAdvance,
}: CompletionStepProps) {
  const { teams } = useTeams();
  const [inviteOpen, setInviteOpen] = useState(false);

  const isAdvisor = path === "B";
  const showInvite = path === "A" || path === "C";

  const selectableTeams = teams.filter((t) => t.id !== TEAM_EVERYONE_ID);
  const initialInviteRows: InviteRow[] = useMemo(() => {
    if (inviteRowsFromTeams && inviteRowsFromTeams.length > 0) return inviteRowsFromTeams;
    return [
      {
        id: "invite-1",
        email: "",
        role: "user",
        teamIds: selectableTeams[0] ? [selectableTeams[0].id] : [],
      },
    ];
  }, [inviteRowsFromTeams, selectableTeams]);

  useEffect(() => {
    registerAdvance?.(() => onFinishToChat());
  }, [registerAdvance, onFinishToChat]);

  // ── Advisor: minimal "you're ready" moment ────────────────────────────
  if (isAdvisor) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden />
        </div>
        <p className="font-display mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          You&apos;re all set
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          Welcome to Enable.
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground md:text-base">
          Enable is set up with your sources at {agencyName}. You can update connections anytime in
          Settings.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="ghost" size="sm" className="h-9 text-sm" onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onFinishToChat}
            className="h-9 min-w-[160px] px-4 text-sm"
            data-onboarding-primary
          >
            Start using Enable
          </Button>
        </div>
      </div>
    );
  }

  // ── Admin: editorial completion ───────────────────────────────────────
  // Aggregate the most valuable single number — total items indexed across sources
  const totalDocs =
    (hubSnapshot.intranetConnected ? hubSnapshot.intranetDocs || 42 : 0) +
    (hubSnapshot.sharedDriveConnected ? hubSnapshot.sharedDocs || 156 : 0) +
    (hubSnapshot.personalConnected ? hubSnapshot.personalDocs || 48 : 0);
  const sourcesConnected =
    (hubSnapshot.intranetConnected ? 1 : 0) +
    (hubSnapshot.sharedDriveConnected ? 1 : 0) +
    (hubSnapshot.personalConnected ? 1 : 0) +
    (hubSnapshot.emailForwardingConfigured ? 1 : 0);

  const detailRows = [
    hubSnapshot.intranetConnected
      ? `Intranet — ${hubSnapshot.intranetDocs || 42} documents, ${hubSnapshot.intranetPages || 18} pages`
      : null,
    hubSnapshot.sharedDriveConnected
      ? `Shared Drive — ${hubSnapshot.sharedDocs || 156} files`
      : null,
    hubSnapshot.personalConnected
      ? `Personal Drive — ${hubSnapshot.personalDocs || 48} files`
      : null,
    hubSnapshot.emailForwardingConfigured
      ? `Email forwarding — ${hubSnapshot.emailForwardingAddress || "configured"}`
      : null,
    selectableTeams.length > 0
      ? `${selectableTeams.length} team${selectableTeams.length === 1 ? "" : "s"} ready`
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-1 flex-col">
      {/* Editorial hero */}
      <div className="mb-12 mt-4 md:mt-8">
        <p className="font-display mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {agencyName} is ready
        </p>
        <h1 className="font-display text-[2rem] font-medium leading-[1.1] tracking-tight text-foreground md:text-[2.75rem]">
          {totalDocs > 0 ? (
            <>
              <span className="text-primary">{totalDocs.toLocaleString()}</span> items indexed
              <br />
              across {sourcesConnected} source{sourcesConnected === 1 ? "" : "s"}.
            </>
          ) : (
            <>You&apos;re ready.</>
          )}
        </h1>
        <p className="mt-4 max-w-lg text-sm text-muted-foreground md:text-base">
          Invite your team next, or take a short tour of your workspace.
        </p>
      </div>

      {/* Quiet detail rows — what was unlocked */}
      {detailRows.length > 0 && (
        <ul className="mb-10 space-y-2 text-sm text-muted-foreground">
          {detailRows.map((row) => (
            <li key={row} className="flex items-baseline gap-3">
              <span className="h-1 w-1 shrink-0 rounded-full bg-primary/60" aria-hidden />
              <span>{row}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Tour prompt — quieter than before */}
      <div className="mb-10 flex items-start gap-3 rounded-2xl border border-border/40 bg-card/20 p-5 md:p-6">
        <Compass className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden />
        <div>
          <p className="font-display text-base font-medium text-foreground">
            A short tour of your workspace
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Five steps — Knowledge Hub, Chat, Teams, Settings, Library. Skip anytime.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
        <Button type="button" variant="ghost" size="sm" className="h-9 text-sm" onClick={onBack}>
          Back
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {showInvite && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 px-4 text-sm"
              onClick={() => setInviteOpen(true)}
            >
              Invite your team
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={onFinishToChat}
            className="h-9 min-w-[160px] px-4 text-sm"
            data-onboarding-primary
          >
            Start tour
          </Button>
        </div>
      </div>

      {showInvite && (
        <InviteTeamModal
          key={
            inviteRowsFromTeams?.length
              ? inviteRowsFromTeams.map((r) => r.email).join("|")
              : "default-invite-rows"
          }
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          teams={teams}
          initialRows={initialInviteRows}
          onSend={() => onFinishToChat()}
        />
      )}
    </div>
  );
}
