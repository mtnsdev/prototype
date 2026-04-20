"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { OnboardingPath } from "@/lib/onboardingState";
import type { HubSnapshot } from "@/components/onboarding/types";
import { getStarterQuestionsForHub } from "@/components/onboarding/constants";
import { InviteTeamModal, type InviteRow } from "@/components/onboarding/InviteTeamModal";
import { useTeams } from "@/contexts/TeamsContext";
import { TEAM_EVERYONE_ID } from "@/types/teams";

type CompletionStepProps = {
  path: OnboardingPath;
  hubSnapshot: HubSnapshot;
  /** Rows built from Path A team builder pre-assignments; optional. */
  inviteRowsFromTeams: InviteRow[] | null;
  onFinishToChat: () => void;
  onBack: () => void;
};

export function CompletionStep({
  path,
  hubSnapshot,
  inviteRowsFromTeams,
  onFinishToChat,
  onBack,
}: CompletionStepProps) {
  const { teams } = useTeams();
  const [inviteOpen, setInviteOpen] = useState(false);

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

  const starterQuestions = useMemo(() => getStarterQuestionsForHub(hubSnapshot), [hubSnapshot]);

  const summaryLines: string[] = [];
  if (hubSnapshot.intranetConnected) {
    summaryLines.push(
      `Intranet — ${hubSnapshot.intranetDocs || 42} documents, ${hubSnapshot.intranetPages || 18} pages`
    );
  } else if (hubSnapshot.skippedIntranet) {
    summaryLines.push("Intranet — not connected");
  }
  if (hubSnapshot.sharedDriveConnected) {
    summaryLines.push(`Shared Drive — ${hubSnapshot.sharedDocs || 156} files`);
  } else if (hubSnapshot.skippedShared) {
    summaryLines.push("Shared Drive — not connected");
  }
  if (hubSnapshot.personalConnected) {
    summaryLines.push(`Personal Drive — ${hubSnapshot.personalDocs || 48} files`);
  } else if (hubSnapshot.skippedPersonal) {
    summaryLines.push("Personal Drive — not connected");
  }
  summaryLines.push("EnableVIC Intelligence — always on");

  const showInvite = path === "A" || path === "C";

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          You&apos;re ready.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Here&apos;s what&apos;s connected — try one of the starters below in chat.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/40 p-4 md:p-5">
        <p className="text-sm font-medium text-foreground">Connected sources</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {summaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium text-foreground">Starter questions</p>
        <ul className="mt-3 space-y-2">
          {starterQuestions.map((q) => (
            <li key={q} className="text-sm text-muted-foreground">
              “{q}”
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {showInvite && (
            <>
              <Button type="button" variant="default" size="lg" onClick={() => setInviteOpen(true)}>
                Invite your team
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={onFinishToChat}>
                Skip — go to Chat
              </Button>
            </>
          )}
          {!showInvite && (
            <Button type="button" size="lg" onClick={onFinishToChat}>
              Start using EnableVIC
            </Button>
          )}
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
