"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Building2,
  Cloud,
  FolderOpen,
  Sparkles,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/contexts/UserContext";
import { useTeams } from "@/contexts/TeamsContext";
import { TEAM_EVERYONE_ID } from "@/types/teams";
import { useGoogleDriveStatus } from "@/hooks/useGoogleDriveStatus";
import { useClaromentisStatus } from "@/hooks/useClaromentisStatus";
import type { OnboardingPath } from "@/lib/onboardingState";
import { isWorkspaceStaff } from "@/lib/workspaceRoles";
import type { HubSnapshot } from "@/components/onboarding/types";
import { emptyHubSnapshot } from "@/components/onboarding/types";
import { cn } from "@/lib/utils";

type KnowledgeHubStepProps = {
  path: OnboardingPath;
  onContinue: (snapshot: HubSnapshot) => void;
};

type ModalState =
  | { kind: "closed" }
  | { kind: "intranet_admin"; step: "url" | "creds" | "success" }
  | { kind: "intranet_user"; step: "creds" | "success" }
  | { kind: "shared_admin"; step: "oauth" | "sync" | "success" }
  | { kind: "personal"; step: "oauth" | "sync" | "success" };

const MOCK_STATS = { docs: 42, pages: 18, sharedDocs: 156, personalDocs: 48 };

export function KnowledgeHubStep({ path, onContinue }: KnowledgeHubStepProps) {
  const { user } = useUser();
  const { teams, agencyUsers } = useTeams();
  const { status: personalDrive, refetch: refetchPersonal } = useGoogleDriveStatus("personal");
  const { status: agencyDrive, refetch: refetchAgency } = useGoogleDriveStatus("agency");
  const { status: claromentis, refetch: refetchClaromentis } = useClaromentisStatus();

  const [snapshot, setSnapshot] = useState<HubSnapshot>(() => emptyHubSnapshot());
  const [modal, setModal] = useState<ModalState>({ kind: "closed" });
  const [busy, setBusy] = useState(false);
  const [intranetUrlDraft, setIntranetUrlDraft] = useState("");
  const [intranetUserDraft, setIntranetUserDraft] = useState("");
  const [intranetPassDraft, setIntranetPassDraft] = useState("");
  const [oauthBlockedHint, setOauthBlockedHint] = useState(false);

  const clarActive = claromentis?.status === "active";
  const tenantUrlFromApi = claromentis?.claromentis_base_url ?? null;

  const tenantUrl = snapshot.tenantIntranetUrl ?? tenantUrlFromApi;
  const intranetConnected = clarActive || snapshot.intranetConnected;

  const agencyConnected = agencyDrive?.connected || snapshot.sharedDriveConnected;
  const personalConnected = personalDrive?.connected || snapshot.personalConnected;

  const staff = user ? isWorkspaceStaff(user) : false;
  const isPathA = path === "A";

  const assignedTeamNames = useMemo(() => {
    const nonEveryone = teams.filter((t) => t.id !== TEAM_EVERYONE_ID);
    return nonEveryone.map((t) => t.name);
  }, [teams]);

  const workspaceSummary = useMemo(() => {
    const nonEveryone = teams.filter((t) => t.id !== TEAM_EVERYONE_ID);
    const memberTotal = nonEveryone.reduce((acc, t) => acc + t.memberIds.length, 0);
    return {
      teamCount: nonEveryone.length,
      teamNames: nonEveryone.map((t) => t.name),
      memberTotal,
      invited: agencyUsers.length + 2,
      active: agencyUsers.length,
    };
  }, [teams, agencyUsers]);

  const hubFooterMessage = useMemo(() => {
    const sharedOk = isPathA ? agencyConnected || snapshot.skippedShared : agencyConnected;
    const intranetOk = intranetConnected || snapshot.skippedIntranet;
    const personalOk = personalConnected || snapshot.skippedPersonal;
    if (intranetOk && sharedOk && personalOk) {
      return "You're fully set up. EnableVIC can draw on all your knowledge sources.";
    }
    if (!intranetConnected && !agencyConnected && !personalConnected && !snapshot.skippedIntranet) {
      return "EnableVIC is ready with its built-in intelligence. Connect your sources to make it dramatically more useful.";
    }
    return "EnableVIC works best with all sources connected. You can connect more anytime in Settings.";
  }, [
    intranetConnected,
    agencyConnected,
    personalConnected,
    snapshot.skippedIntranet,
    snapshot.skippedShared,
    snapshot.skippedPersonal,
    isPathA,
  ]);

  const runValidation = useCallback(async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    setBusy(false);
  }, []);

  const closeModal = () => {
    setModal({ kind: "closed" });
    setOauthBlockedHint(false);
  };

  useEffect(() => {
    if (modal.kind !== "personal" || modal.step !== "sync") return;
    const t = window.setTimeout(() => setModal({ kind: "personal", step: "success" }), 900);
    return () => clearTimeout(t);
  }, [modal]);

  const finishIntranetAdminSuccess = () => {
    setSnapshot((s) => ({
      ...s,
      tenantIntranetUrl: intranetUrlDraft || s.tenantIntranetUrl || "https://intranet.example.com",
      intranetConnected: true,
      intranetDocs: MOCK_STATS.docs,
      intranetPages: MOCK_STATS.pages,
    }));
    void refetchClaromentis();
    closeModal();
  };

  const finishIntranetUserSuccess = () => {
    setSnapshot((s) => ({
      ...s,
      intranetConnected: true,
      intranetDocs: MOCK_STATS.docs,
      intranetPages: MOCK_STATS.pages,
    }));
    void refetchClaromentis();
    closeModal();
  };

  const finishSharedSuccess = (folder: string) => {
    setSnapshot((s) => ({
      ...s,
      sharedDriveConnected: true,
      sharedDocs: MOCK_STATS.sharedDocs,
      sharedFolderName: folder,
    }));
    void refetchAgency();
    closeModal();
  };

  const finishPersonalSuccess = (folder: string) => {
    setSnapshot((s) => ({
      ...s,
      personalConnected: true,
      personalDocs: MOCK_STATS.personalDocs,
      personalFolderName: folder,
    }));
    void refetchPersonal();
    closeModal();
  };

  const hubPrimaryCta =
    path === "A" ? "Continue to team setup" : path === "B" ? "Start using EnableVIC" : "Start using EnableVIC";

  const handleHubContinue = () => {
    onContinue({
      ...snapshot,
      tenantIntranetUrl: snapshot.tenantIntranetUrl ?? tenantUrlFromApi,
      intranetConnected: clarActive || snapshot.intranetConnected,
      intranetDocs: snapshot.intranetDocs || (clarActive ? MOCK_STATS.docs : 0),
      intranetPages: snapshot.intranetPages || (clarActive ? MOCK_STATS.pages : 0),
      sharedDriveConnected: agencyDrive?.connected ?? snapshot.sharedDriveConnected,
      sharedDocs: snapshot.sharedDocs || MOCK_STATS.sharedDocs,
      personalConnected: personalDrive?.connected ?? snapshot.personalConnected,
    });
  };

  return (
    <div className="flex flex-1 flex-col pb-8">
      <div className="mb-6 text-center md:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Knowledge Hub
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Connect your sources — the hub updates live as you go.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Intranet */}
        <SourceCard
          icon={Building2}
          title="Agency intranet"
          variant={
            intranetConnected ? "ok" : snapshot.skippedIntranet && !intranetConnected ? "warn" : "neutral"
          }
          body={
            isPathA ? (
              <p className="text-sm text-muted-foreground">
                Set up your agency&apos;s intranet so EnableVIC can access training materials, supplier guides,
                and internal knowledge.
              </p>
            ) : tenantUrl || clarActive ? (
              <p className="text-sm text-muted-foreground">
                Your agency&apos;s intranet — {MOCK_STATS.docs} documents, {MOCK_STATS.pages} pages available
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your admin hasn&apos;t set up the intranet yet.
              </p>
            )
          }
          footer={
            isPathA ? (
              <Button
                type="button"
                size="sm"
                variant={intranetConnected ? "outline" : "default"}
                onClick={() =>
                  setModal({
                    kind: "intranet_admin",
                    step: snapshot.tenantIntranetUrl ? "creds" : "url",
                  })
                }
              >
                {intranetConnected ? "Connected" : "Set up intranet"}
              </Button>
            ) : tenantUrl || clarActive ? (
              <Button
                type="button"
                size="sm"
                variant={intranetConnected ? "outline" : "default"}
                onClick={() => setModal({ kind: "intranet_user", step: "creds" })}
                disabled={!tenantUrl && !clarActive}
              >
                {intranetConnected ? "Connected" : "Connect your account"}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Waiting for admin</span>
            )
          }
        />

        {/* Shared Drive */}
        <SourceCard
          icon={Cloud}
          title="Shared Google Drive"
          variant={
            agencyConnected ? "ok" : snapshot.skippedShared ? "warn" : "neutral"
          }
          body={
            staff && isPathA ? (
              <p className="text-sm text-muted-foreground">
                Documents in the selected folder are available to your whole team.
              </p>
            ) : agencyConnected ? (
              <p className="text-sm text-muted-foreground">
                Connected by Demo Admin — {snapshot.sharedFolderName || "Agency knowledge"} —{" "}
                {MOCK_STATS.sharedDocs} files indexed
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your admin hasn&apos;t connected shared Google Drive yet.
              </p>
            )
          }
          footer={
            staff && isPathA ? (
              <Button
                type="button"
                size="sm"
                variant={agencyConnected ? "outline" : "default"}
                onClick={() => setModal({ kind: "shared_admin", step: "oauth" })}
              >
                {agencyConnected ? "Connected" : "Connect shared Drive"}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Admin-managed</span>
            )
          }
        />

        {/* Personal Drive */}
        <SourceCard
          icon={FolderOpen}
          title="Personal Google Drive"
          variant={personalConnected ? "ok" : snapshot.skippedPersonal ? "warn" : "neutral"}
          body={
            <p className="text-sm text-muted-foreground">
              Connect your personal Drive so EnableVIC can reference your own files — client notes, trip
              research, rate sheets. Only you can see this content.
            </p>
          }
          footer={
            <Button
              type="button"
              size="sm"
              variant={personalConnected ? "outline" : "default"}
              onClick={() => setModal({ kind: "personal", step: "oauth" })}
            >
              {personalConnected ? "Connected" : "Connect personal Drive"}
            </Button>
          }
        />

        {/* Intelligence */}
        <SourceCard
          icon={Sparkles}
          title="EnableVIC Intelligence"
          variant="intel"
          body={
            <p className="text-sm text-muted-foreground">
              Always on — curated hotel data, DMC partner content, verified destination knowledge.
            </p>
          }
          footer={<span className="text-xs font-medium text-primary">Always on</span>}
        />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">{hubFooterMessage}</p>

      {path === "B" && (
        <div className="mt-8 rounded-2xl border border-border bg-card/40 p-4">
          <p className="text-sm font-medium text-foreground">Team membership</p>
          {assignedTeamNames.length > 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;re part of{" "}
              <span className="font-medium text-foreground">
                {assignedTeamNames.slice(0, 3).join(", ")}
              </span>
              . Your page access is the combined content across all your teams.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              You haven&apos;t been assigned to a team yet. Ask your admin to add you so you can access shared
              content.
            </p>
          )}
        </div>
      )}

      {path === "C" && (
        <div className="mt-8 rounded-2xl border border-border bg-card/40 p-4">
          <p className="text-sm font-medium text-foreground">Workspace status</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>
              Teams: {workspaceSummary.teamCount} ({workspaceSummary.teamNames.slice(0, 4).join(", ")}
              {workspaceSummary.teamNames.length > 4 ? "…" : ""}) — {workspaceSummary.memberTotal} members
              total
            </li>
            <li>
              Users: {workspaceSummary.invited} invited, {workspaceSummary.active} active in this prototype
            </li>
            <li>You have admin access. Manage workspace settings anytime in Settings.</li>
          </ul>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="ghost" className="text-muted-foreground" onClick={handleHubContinue}>
          Skip for now
        </Button>
        <Button type="button" size="lg" onClick={handleHubContinue}>
          {hubPrimaryCta}
        </Button>
      </div>

      {/* Intranet admin modal */}
      <Dialog
        open={modal.kind === "intranet_admin"}
        onOpenChange={(o) => !o && closeModal()}
      >
        <DialogContent className="bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up your intranet</DialogTitle>
          </DialogHeader>
          {modal.kind === "intranet_admin" && modal.step === "url" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="intranet-url">Intranet URL</Label>
                <Input
                  id="intranet-url"
                  placeholder="https://yourcompany.yourintranet.com"
                  value={intranetUrlDraft}
                  onChange={(e) => setIntranetUrlDraft(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This is the URL your team uses. Set it once — all users inherit it.
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSnapshot((s) => ({ ...s, skippedIntranet: true }));
                    closeModal();
                  }}
                >
                  Set up later
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setSnapshot((s) => ({
                      ...s,
                      tenantIntranetUrl: intranetUrlDraft || s.tenantIntranetUrl,
                    }));
                    setModal({ kind: "intranet_admin", step: "creds" });
                  }}
                >
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}
          {modal.kind === "intranet_admin" && modal.step === "creds" && (
            <>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="in-user">Username</Label>
                  <Input
                    id="in-user"
                    value={intranetUserDraft}
                    onChange={(e) => setIntranetUserDraft(e.target.value)}
                    disabled={busy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="in-pass">Password</Label>
                  <Input
                    id="in-pass"
                    type="password"
                    value={intranetPassDraft}
                    onChange={(e) => setIntranetPassDraft(e.target.value)}
                    disabled={busy}
                  />
                </div>
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer text-foreground/80">Don&apos;t know your credentials?</summary>
                  <p className="mt-1">
                    Use the same login you use for your intranet in the browser. Contact your IT admin if you
                    use SSO.
                  </p>
                </details>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSnapshot((s) => ({ ...s, skippedIntranet: true }));
                    closeModal();
                  }}
                >
                  Set up later
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await runValidation();
                    setModal({ kind: "intranet_admin", step: "success" });
                  }}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking…
                    </>
                  ) : (
                    "Connect"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
          {modal.kind === "intranet_admin" && modal.step === "success" && (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Indexed</p>
                  <p className="text-sm text-muted-foreground">
                    {MOCK_STATS.docs} documents indexed (PDF, DOCX, TXT, HTML, MD). Rate sheets, supplier
                    brochures, destination guides. You have access to all {MOCK_STATS.pages} pages as an
                    admin.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={finishIntranetAdminSuccess}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Intranet user modal */}
      <Dialog open={modal.kind === "intranet_user"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect your intranet account</DialogTitle>
          </DialogHeader>
          {modal.kind === "intranet_user" && modal.step === "creds" && (
            <>
              <p className="text-sm text-muted-foreground">
                Same credentials you use to log into your intranet. The workspace URL is already configured.
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="iu">Username</Label>
                  <Input id="iu" value={intranetUserDraft} onChange={(e) => setIntranetUserDraft(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip">Password</Label>
                  <Input
                    id="ip"
                    type="password"
                    value={intranetPassDraft}
                    onChange={(e) => setIntranetPassDraft(e.target.value)}
                  />
                </div>
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer text-foreground/80">Don&apos;t know your credentials?</summary>
                  <p className="mt-1">Ask your admin or IT for intranet login details.</p>
                </details>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSnapshot((s) => ({ ...s, skippedIntranet: true }));
                    closeModal();
                  }}
                >
                  Set up later
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    await runValidation();
                    setModal({ kind: "intranet_user", step: "success" });
                  }}
                >
                  Connect
                </Button>
              </DialogFooter>
            </>
          )}
          {modal.kind === "intranet_user" && modal.step === "success" && (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Connected — {MOCK_STATS.docs} documents, {MOCK_STATS.pages} pages through your teams.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" onClick={finishIntranetUserSuccess}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Shared drive admin */}
      <Dialog open={modal.kind === "shared_admin"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect shared Google Drive</DialogTitle>
          </DialogHeader>
          {modal.kind === "shared_admin" && modal.step === "oauth" && (
            <>
              <p className="text-sm text-muted-foreground">
                You&apos;ll authorize Google and pick a folder. Documents in that folder will be available to
                your whole team.
              </p>
              {oauthBlockedHint && (
                <p className="text-sm text-destructive">
                  Your browser blocked the authorization window. Please allow popups and try again.
                </p>
              )}
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSnapshot((s) => ({ ...s, skippedShared: true }));
                    closeModal();
                  }}
                >
                  Set up later
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setModal({ kind: "shared_admin", step: "sync" });
                    setTimeout(() => setModal({ kind: "shared_admin", step: "success" }), 1200);
                  }}
                >
                  Continue with Google
                </Button>
              </DialogFooter>
            </>
          )}
          {modal.kind === "shared_admin" && modal.step === "sync" && (
            <div className="flex items-center gap-3 py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Waiting for authorization…</p>
            </div>
          )}
          {modal.kind === "shared_admin" && modal.step === "success" && (
            <>
              <div className="space-y-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-3/5 animate-pulse rounded-full bg-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Syncing {MOCK_STATS.sharedDocs} documents from Agency knowledge (PDF, DOCX, TXT, HTML, MD are
                  searchable). You can finish now — sync continues in the background.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => finishSharedSuccess("Agency knowledge")}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Personal drive */}
      <Dialog open={modal.kind === "personal"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect personal Google Drive</DialogTitle>
          </DialogHeader>
          {modal.kind === "personal" && modal.step === "oauth" && (
            <>
              <p className="text-sm text-muted-foreground">
                Only you can see documents from this folder. Great for client notes and trip research.
              </p>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSnapshot((s) => ({ ...s, skippedPersonal: true }));
                    closeModal();
                  }}
                >
                  Set up later
                </Button>
                <Button type="button" onClick={() => setModal({ kind: "personal", step: "sync" })}>
                  Continue with Google
                </Button>
              </DialogFooter>
            </>
          )}
          {modal.kind === "personal" && modal.step === "sync" && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Waiting for authorization…</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setOauthBlockedHint(true)}>
                Simulate popup blocked
              </Button>
            </div>
          )}
          {modal.kind === "personal" && modal.step === "success" && (
            <>
              <p className="text-sm text-muted-foreground">
                Syncing {MOCK_STATS.personalDocs} documents from My research. Done is available immediately.
              </p>
              <DialogFooter>
                <Button type="button" onClick={() => finishPersonalSuccess("My research")}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

function SourceCard({
  icon: Icon,
  title,
  body,
  footer,
  variant,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: ReactNode;
  footer: ReactNode;
  variant: "ok" | "warn" | "neutral" | "intel";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors md:p-5",
        variant === "ok" && "border-border bg-card/60",
        variant === "warn" && "border-amber-500/40 bg-card/40",
        variant === "neutral" && "border-border bg-card/30",
        variant === "intel" && "border-border bg-card/50"
      )}
    >
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/50">
          <Icon className="h-5 w-5 text-foreground/80" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {variant === "warn" && <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" aria-hidden />}
            {variant === "ok" && <Check className="h-4 w-4 text-primary" aria-hidden />}
          </div>
          <div className="mt-2">{body}</div>
          <div className="mt-3">{footer}</div>
        </div>
      </div>
    </div>
  );
}
