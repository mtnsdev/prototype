"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Building2,
  Cloud,
  FolderOpen,
  Mail,
  AlertTriangle,
  Check,
  Loader2,
  Folder,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  agencyName: string;
  adminUserName: string;
  adminUserEmail: string;
  onContinue: (snapshot: HubSnapshot) => void;
  registerAdvance?: (fn: () => void) => void;
};

type CardKey = "intranet" | "shared" | "personal" | "email";
type DriveStep = "idle" | "authorizing" | "picking" | "syncing";
type Status = "connected" | "not_connected" | "admin_managed" | "skipped";

const MOCK_STATS = { docs: 42, pages: 18, sharedDocs: 156, personalDocs: 48 };

type IntranetErrorKind = "bad_url" | "bad_creds" | "sso_only" | "server";
const INTRANET_ERROR_COPY: Record<IntranetErrorKind, string> = {
  bad_url: "We couldn't reach that URL. Double-check the address and try again.",
  bad_creds:
    "Those credentials didn't work. They should be the same ones you use to log into your intranet.",
  sso_only:
    "Your intranet looks like it uses single sign-on. Ask IT for an app-password or service account.",
  server: "Our system is temporarily busy. Please wait a moment and try again.",
};

// ── Refined dot+text status indicator (replaces the heavier pill) ────────
function StatusDot({ status }: { status: Status }) {
  const map: Record<
    Status,
    { label: string; dot: string; text: string; bg: string; border: string }
  > = {
    connected: {
      label: "Connected",
      dot: "bg-primary",
      text: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/25",
    },
    not_connected: {
      label: "Not connected",
      dot: "bg-muted-foreground/40",
      text: "text-muted-foreground",
      bg: "bg-muted/40",
      border: "border-border/60",
    },
    admin_managed: {
      label: "Admin-managed",
      dot: "bg-muted-foreground/40",
      text: "text-muted-foreground",
      bg: "bg-muted/40",
      border: "border-border/60",
    },
    skipped: {
      label: "Skipped",
      dot: "bg-amber-500/70",
      text: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
  };
  const { label, dot, text, bg, border } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        text,
        bg,
        border
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} aria-hidden />
      {label}
    </span>
  );
}

function HelpHint({ id, label, body }: { id: string; label: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={`What is ${label}?`}
        aria-expanded={open}
        aria-controls={`${id}-tip`}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="text-muted-foreground hover:text-foreground"
      >
        <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
      </button>
      {open && (
        <span
          id={`${id}-tip`}
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-lg"
        >
          {body}
        </span>
      )}
    </span>
  );
}

export function KnowledgeHubStep({
  path,
  agencyName,
  adminUserName,
  adminUserEmail,
  onContinue,
  registerAdvance,
}: KnowledgeHubStepProps) {
  const { user } = useUser();
  const { teams, agencyUsers } = useTeams();
  const { status: personalDrive, refetch: refetchPersonal } = useGoogleDriveStatus("personal");
  const { status: agencyDrive, refetch: refetchAgency } = useGoogleDriveStatus("agency");
  const { status: claromentis, refetch: refetchClaromentis } = useClaromentisStatus();

  const [snapshot, setSnapshot] = useState<HubSnapshot>(() => emptyHubSnapshot());
  /** Dev affordances (Simulate error / Simulate timeout) are hidden unless `?dev=1`
   *  is in the URL — keeps the onboarding clean for real users. */
  const showDevTools = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return new URLSearchParams(window.location.search).get("dev") === "1";
    } catch {
      return false;
    }
  }, []);
  const enableInboxAddress = useMemo(() => {
    const slug = (user?.email || "you@youragency.com")
      .split("@")[0]
      .replace(/[^a-z0-9.]/gi, "")
      .toLowerCase();
    return `${slug || "you"}@inbox.enablevic.com`;
  }, [user?.email]);
  const [busy, setBusy] = useState<CardKey | null>(null);


  const [intranetUrlDraft, setIntranetUrlDraft] = useState("");
  const [intranetUserDraft, setIntranetUserDraft] = useState("");
  const [intranetPassDraft, setIntranetPassDraft] = useState("");
  const [forwardingDraft, setForwardingDraft] = useState("");

  const [sharedStep, setSharedStep] = useState<DriveStep>("idle");
  const [personalStep, setPersonalStep] = useState<DriveStep>("idle");
  const [sharedPopupBlocked, setSharedPopupBlocked] = useState(false);
  const [personalPopupBlocked, setPersonalPopupBlocked] = useState(false);


  const [pulseKey, setPulseKey] = useState<CardKey | null>(null);
  /** Timed-out cards: surface 'Taking longer than expected. Skip for now?'. */
  const [timeoutKey, setTimeoutKey] = useState<CardKey | null>(null);
  const timeoutTimers = useRef<Record<CardKey, number | undefined>>({
    intranet: undefined,
    shared: undefined,
    personal: undefined,
    email: undefined,
  });

  /** Start a timeout countdown — fires the "taking too long" UI after `ms`. */
  const startTimeout = useCallback((key: CardKey, ms: number) => {
    if (timeoutTimers.current[key]) {
      window.clearTimeout(timeoutTimers.current[key]);
    }
    timeoutTimers.current[key] = window.setTimeout(() => {
      setTimeoutKey(key);
    }, ms);
  }, []);

  const clearTimeoutFor = useCallback((key: CardKey) => {
    if (timeoutTimers.current[key]) {
      window.clearTimeout(timeoutTimers.current[key]);
      timeoutTimers.current[key] = undefined;
    }
    setTimeoutKey((cur) => (cur === key ? null : cur));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const timers = timeoutTimers.current;
    return () => {
      (Object.values(timers) as Array<number | undefined>).forEach((t) => {
        if (t) window.clearTimeout(t);
      });
    };
  }, []);
  const triggerPulse = (k: CardKey) => {
    setPulseKey(k);
    window.setTimeout(() => setPulseKey((cur) => (cur === k ? null : cur)), 1000);
  };

  const clarActive = claromentis?.status === "active";
  const tenantUrlFromApi = claromentis?.claromentis_base_url ?? null;
  const tenantUrl = snapshot.tenantIntranetUrl ?? tenantUrlFromApi;

  const intranetConnected = clarActive || snapshot.intranetConnected;
  const agencyConnected = agencyDrive?.connected || snapshot.sharedDriveConnected;
  const personalConnected = personalDrive?.connected || snapshot.personalConnected;

  const staff = user ? isWorkspaceStaff(user) : false;
  const isPathA = path === "A";
  const isAdvisor = path === "B";

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

  const validateIntranet = useCallback(
    async (urlInput: string): Promise<IntranetErrorKind | null> => {
      setBusy("intranet");
      startTimeout("intranet", 10000); // 10s validation timeout per ticket
      // Simulate slow validation if URL contains "slow" — will trip the timeout
      const slow = urlInput.toLowerCase().includes("slow");
      await new Promise((r) => setTimeout(r, slow ? 12000 : 600));
      clearTimeoutFor("intranet");
      setBusy(null);
      const u = urlInput.trim().toLowerCase();
      if (u && !u.startsWith("http")) return "bad_url";
      if (u.includes("sso")) return "sso_only";
      if (u.includes("fail")) return "server";
      return null;
    },
    [startTimeout, clearTimeoutFor]
  );

  const saveIntranetAdmin = async () => {
    if (!intranetUrlDraft.trim() || !intranetUserDraft.trim() || !intranetPassDraft) return;
    const err = await validateIntranet(intranetUrlDraft);
    if (err) {
      setSnapshot((s) => ({ ...s, intranetError: INTRANET_ERROR_COPY[err] }));
      return;
    }
    setSnapshot((s) => ({
      ...s,
      tenantIntranetUrl: intranetUrlDraft.trim(),
      intranetConnected: true,
      intranetDocs: MOCK_STATS.docs,
      intranetPages: MOCK_STATS.pages,
      intranetConnectedAs: intranetUserDraft.trim(),
      intranetError: "",
      skippedIntranet: false,
    }));
    void refetchClaromentis();
    triggerPulse("intranet");
  };

  const saveIntranetAdvisor = async () => {
    if (!intranetUserDraft.trim() || !intranetPassDraft) return;
    const err = await validateIntranet("");
    if (err) {
      setSnapshot((s) => ({ ...s, intranetError: INTRANET_ERROR_COPY[err] }));
      return;
    }
    setSnapshot((s) => ({
      ...s,
      intranetConnected: true,
      intranetDocs: MOCK_STATS.docs,
      intranetPages: MOCK_STATS.pages,
      intranetConnectedAs: intranetUserDraft.trim(),
      intranetError: "",
      skippedIntranet: false,
    }));
    void refetchClaromentis();
    triggerPulse("intranet");
  };

  const driveOwnerLabel = adminUserName || adminUserEmail || "Workspace admin";
  const personalOwnerLabel = user?.username || user?.email || "You";

  const startSharedAuth = () => {
    setSharedPopupBlocked(false);
    setSharedStep("authorizing");
    startTimeout("shared", 30000); // 30s OAuth timeout per ticket
    window.setTimeout(() => {
      clearTimeoutFor("shared");
      setSharedStep("picking");
    }, 1200);
  };
  const cancelSharedAuth = () => setSharedStep("idle");
  const pickSharedFolder = (folder: string) => {
    setSharedStep("syncing");
    window.setTimeout(() => {
      setSnapshot((s) => ({
        ...s,
        sharedDriveConnected: true,
        sharedDocs: MOCK_STATS.sharedDocs,
        sharedFolderName: folder,
        sharedConnectedAs: driveOwnerLabel,
        skippedShared: false,
      }));
      void refetchAgency();
      setSharedStep("idle");
      triggerPulse("shared");
    }, 900);
  };

  const startPersonalAuth = () => {
    setPersonalPopupBlocked(false);
    setPersonalStep("authorizing");
    startTimeout("personal", 30000);
    window.setTimeout(() => {
      clearTimeoutFor("personal");
      setPersonalStep("picking");
    }, 1200);
  };
  const cancelPersonalAuth = () => setPersonalStep("idle");
  const pickPersonalFolder = (folder: string) => {
    setPersonalStep("syncing");
    window.setTimeout(() => {
      setSnapshot((s) => ({
        ...s,
        personalConnected: true,
        personalDocs: MOCK_STATS.personalDocs,
        personalFolderName: folder,
        personalConnectedAs: personalOwnerLabel,
        skippedPersonal: false,
      }));
      void refetchPersonal();
      setPersonalStep("idle");
      triggerPulse("personal");
    }, 900);
  };

  const saveForwarding = async () => {
    if (!forwardingDraft.trim()) return;
    setBusy("email");
    await new Promise((r) => setTimeout(r, 400));
    setBusy(null);
    setSnapshot((s) => ({
      ...s,
      emailForwardingConfigured: true,
      emailForwardingAddress: forwardingDraft.trim(),
      skippedEmailForwarding: false,
    }));
  };

  const skipCard = (key: CardKey) => {
    setSnapshot((s) => {
      switch (key) {
        case "intranet":
          return { ...s, skippedIntranet: true };
        case "shared":
          return { ...s, skippedShared: true };
        case "personal":
          return { ...s, skippedPersonal: true };
        case "email":
          return { ...s, skippedEmailForwarding: true };
      }
    });
  };

  const handleHubContinue = useCallback(() => {
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
  }, [
    onContinue,
    snapshot,
    tenantUrlFromApi,
    clarActive,
    agencyDrive?.connected,
    personalDrive?.connected,
  ]);

  useEffect(() => {
    registerAdvance?.(() => handleHubContinue());
  }, [registerAdvance, handleHubContinue]);

  const intranetStatus: Status = intranetConnected
    ? "connected"
    : snapshot.skippedIntranet
    ? "skipped"
    : "not_connected";
  const sharedStatus: Status = isPathA
    ? agencyConnected
      ? "connected"
      : snapshot.skippedShared
      ? "skipped"
      : "not_connected"
    : agencyConnected
    ? "connected"
    : "admin_managed";
  const personalStatus: Status = personalConnected
    ? "connected"
    : snapshot.skippedPersonal
    ? "skipped"
    : "not_connected";
  const hubPrimaryCta = path === "A" ? "Continue to team setup" : "Start using Enable";

  return (
    <div className="flex flex-1 flex-col pb-8">
      <div className="mb-10 text-center md:text-left">
        <p className="font-display mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Step 2 · Connect your sources
        </p>
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          Knowledge Hub
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
          {isPathA
            ? `Connect ${agencyName}'s knowledge sources. Fill in details inline — Enable will index and confirm each one.`
            : `Connect what you'll bring to ${agencyName} on Enable. Fill in details inline — we'll confirm each connection.`}
        </p>
      </div>

      <div className="grid gap-5">
        {/* ── Agency intranet ───────────────────────────────────────────── */}
        <SourceCard
          icon={Building2}
          title="Agency intranet"
          status={intranetStatus}
          pulsing={pulseKey === "intranet"}
          help={{
            id: "intranet",
            label: "agency intranet",
            body:
              "Your agency's internal site (Claromentis or similar) — training materials, supplier guides, commission tables, destination briefs.",
          }}
          summary={
            isPathA
              ? intranetConnected
                ? `${MOCK_STATS.docs} documents · ${MOCK_STATS.pages} pages indexed`
                : "Your agency's internal site."
              : intranetConnected
              ? `${MOCK_STATS.docs} documents · ${MOCK_STATS.pages} pages available through your teams`
              : tenantUrl
              ? `Sign in to access ${agencyName}'s intranet.`
              : "Your admin hasn't set up the intranet yet."
          }
          connectedAs={
            intranetConnected && snapshot.intranetConnectedAs
              ? `Connected as ${snapshot.intranetConnectedAs}`
              : undefined
          }
          canEdit={isPathA || (!!tenantUrl && !intranetConnected)}
          alwaysExpanded
        >
          {snapshot.intranetError && <ErrorBanner message={snapshot.intranetError} />}
          {timeoutKey === "intranet" && (
            <TimeoutBanner
              onRetry={() => clearTimeoutFor("intranet")}
              onSkip={() => {
                clearTimeoutFor("intranet");
                skipCard("intranet");
              }}
            />
          )}

          {isPathA && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="intranet-url">Intranet URL</Label>
                <Input
                  id="intranet-url"
                  placeholder="https://yourcompany.yourintranet.com"
                  value={intranetUrlDraft}
                  onChange={(e) => setIntranetUrlDraft(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="intranet-user-admin" className="text-xs">Username</Label>
                  <Input
                    id="intranet-user-admin"
                    value={intranetUserDraft}
                    onChange={(e) => setIntranetUserDraft(e.target.value)}
                    autoComplete="username"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="intranet-pass-admin" className="text-xs">Password</Label>
                  <Input
                    id="intranet-pass-admin"
                    type="password"
                    value={intranetPassDraft}
                    onChange={(e) => setIntranetPassDraft(e.target.value)}
                    autoComplete="current-password"
                    className="h-9"
                  />
                </div>
              </div>
              <CardActions
                onSkip={() => skipCard("intranet")}
                onSave={saveIntranetAdmin}
                busy={busy === "intranet"}
                saveLabel={intranetConnected ? "Update" : "Connect"}
                onSimulateError={
                  showDevTools
                    ? () =>
                        setSnapshot((s) => ({
                          ...s,
                          intranetError: INTRANET_ERROR_COPY.bad_creds,
                        }))
                    : undefined
                }
                onSimulateTimeout={
                  showDevTools ? () => setTimeoutKey("intranet") : undefined
                }
              />
            </div>
          )}

          {!isPathA && tenantUrl && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Same credentials you use to log into your intranet.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="intranet-user-adv">Username</Label>
                  <Input
                    id="intranet-user-adv"
                    value={intranetUserDraft}
                    onChange={(e) => setIntranetUserDraft(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intranet-pass-adv">Password</Label>
                  <Input
                    id="intranet-pass-adv"
                    type="password"
                    value={intranetPassDraft}
                    onChange={(e) => setIntranetPassDraft(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <CardActions
                onSkip={() => skipCard("intranet")}
                onSave={saveIntranetAdvisor}
                busy={busy === "intranet"}
                saveLabel="Connect"
              />
            </div>
          )}
        </SourceCard>
        

        {/* ── Shared Google Drive ───────────────────────────────────────── */}
        <SourceCard
          icon={Cloud}
          title="Shared Google Drive"
          status={sharedStatus}
          pulsing={pulseKey === "shared"}
          help={{
            id: "shared",
            label: "shared Google Drive",
            body:
              "A Drive folder you share with your whole team — agency-wide rate sheets, supplier brochures, destination briefs.",
          }}
          summary={
            staff && isPathA
              ? agencyConnected
                ? `${snapshot.sharedFolderName || "Agency knowledge"} · ${MOCK_STATS.sharedDocs} files indexed`
                : "A Drive folder shared with your team."
              : agencyConnected
              ? `${snapshot.sharedFolderName || "Agency knowledge"} · ${MOCK_STATS.sharedDocs} files indexed`
              : "Your admin hasn't connected a shared Drive yet."
          }
          connectedAs={
            agencyConnected && snapshot.sharedConnectedAs
              ? `Authorized by ${snapshot.sharedConnectedAs} (Google)`
              : undefined
          }
          canEdit={staff && isPathA}
          alwaysExpanded
        >
          <DriveConnectFlow
            step={sharedStep}
            connected={agencyConnected}
            connectedFolder={snapshot.sharedFolderName || "Agency knowledge"}
            popupBlocked={sharedPopupBlocked}
            audience="shared"
            timedOut={timeoutKey === "shared"}
            onStart={startSharedAuth}
            onCancel={cancelSharedAuth}
            onPick={pickSharedFolder}
            onSimulatePopupBlocked={() => setSharedPopupBlocked(true)}
            onSimulateTimeout={() => setTimeoutKey("shared")}
            onTimeoutRetry={() => clearTimeoutFor("shared")}
            onTimeoutSkip={() => {
              clearTimeoutFor("shared");
              setSharedStep("idle");
              skipCard("shared");
            }}
            onSkip={() => skipCard("shared")}
          />
        </SourceCard>

        {/* ── Personal Google Drive ─────────────────────────────────────── */}
        <SourceCard
          icon={FolderOpen}
          title="Personal Google Drive"
          status={personalStatus}
          pulsing={pulseKey === "personal"}
          help={{
            id: "personal",
            label: "personal Google Drive",
            body:
              "Your own Drive folder — only you see this content. For your client roster, trip notes, personal research.",
          }}
          summary={
            personalConnected
              ? `${snapshot.personalFolderName || "My research"} · ${MOCK_STATS.personalDocs} files synced`
              : "A Drive folder only you can see."
          }
          connectedAs={
            personalConnected && snapshot.personalConnectedAs
              ? `Authorized as ${snapshot.personalConnectedAs} (Google)`
              : undefined
          }
          canEdit
          alwaysExpanded
        >
          <DriveConnectFlow
            step={personalStep}
            connected={personalConnected}
            connectedFolder={snapshot.personalFolderName || "My research"}
            popupBlocked={personalPopupBlocked}
            audience="personal"
            timedOut={timeoutKey === "personal"}
            onStart={startPersonalAuth}
            onCancel={cancelPersonalAuth}
            onPick={pickPersonalFolder}
            onSimulatePopupBlocked={() => setPersonalPopupBlocked(true)}
            onSimulateTimeout={() => setTimeoutKey("personal")}
            onTimeoutRetry={() => clearTimeoutFor("personal")}
            onTimeoutSkip={() => {
              clearTimeoutFor("personal");
              setPersonalStep("idle");
              skipCard("personal");
            }}
            onSkip={() => skipCard("personal")}
          />
        </SourceCard>
        

        {/* ── Email forwarding ──────────────────────────────────────────── */}
        <SourceCard
          icon={Mail}
          title="Email forwarding"
          status="connected"
          help={{
            id: "email",
            label: "email forwarding",
            body:
              "We've provisioned a private Enable inbox. Forward supplier emails (or set an auto-forward rule) and Enable parses, files, and indexes them next to your other sources.",
          }}
          summary={`Inbox · ${enableInboxAddress}`}
          connectedAs={
            snapshot.emailForwardingAddress
              ? `Forwarding from ${snapshot.emailForwardingAddress}`
              : undefined
          }
          canEdit
          alwaysExpanded
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label htmlFor="forward-from" className="shrink-0 text-xs text-muted-foreground sm:w-32">
              Forward from
            </Label>
            <Input
              id="forward-from"
              placeholder="you@youragency.com"
              type="email"
              value={forwardingDraft}
              onChange={(e) => setForwardingDraft(e.target.value)}
              className="h-9 flex-1"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={saveForwarding}
              disabled={busy === "email" || !forwardingDraft.trim()}
              className="h-7 px-2.5 text-xs sm:shrink-0"
            >
              {busy === "email" ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" strokeWidth={1.5} aria-hidden />
                  <span role="status" aria-live="polite">Saving…</span>
                </>
              ) : snapshot.emailForwardingAddress ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </SourceCard>
      </div>

      {isAdvisor && (
        <div className="mt-10 rounded-2xl border border-border/40 bg-card/20 p-5 md:p-6">
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Team membership
          </p>
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
        <div className="mt-10 rounded-2xl border border-border/40 bg-card/20 p-5 md:p-6">
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Workspace status
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li>
              {workspaceSummary.teamCount} team{workspaceSummary.teamCount === 1 ? "" : "s"}
              {workspaceSummary.teamNames.length > 0 ? ` (${workspaceSummary.teamNames.slice(0, 4).join(", ")}${workspaceSummary.teamNames.length > 4 ? "…" : ""})` : ""} · {workspaceSummary.memberTotal} members
            </li>
            <li>
              {workspaceSummary.invited} invited · {workspaceSummary.active} active
            </li>
            <li>You have admin access. Manage workspace settings anytime in Settings.</li>
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 text-sm text-muted-foreground"
          onClick={handleHubContinue}
        >
          Skip for now
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-9 px-4 text-sm"
          onClick={handleHubContinue}
          data-onboarding-primary
        >
          {hubPrimaryCta}
        </Button>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────
function CardActions({
  onSkip,
  onSave,
  busy,
  saveLabel,
  onSimulateError,
  onSimulateTimeout,
}: {
  onSkip: () => void;
  onSave: () => void;
  busy: boolean;
  saveLabel: string;
  onSimulateError?: () => void;
  onSimulateTimeout?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-0.5">
        {onSimulateError && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSimulateError}
            disabled={busy}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Simulate error
          </Button>
        )}
        {onSimulateTimeout && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSimulateTimeout}
            disabled={busy}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Simulate timeout
          </Button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onSkip}
          disabled={busy}
          className="h-7 px-2 text-xs"
        >
          Set up later
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={busy}
          className="h-7 px-2.5 text-xs"
        >
          {busy ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" strokeWidth={1.5} aria-hidden />
              <span role="status" aria-live="polite">Checking…</span>
            </>
          ) : (
            saveLabel
          )}
        </Button>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
      <span>{message}</span>
    </div>
  );
}


// ── TimeoutBanner ───────────────────────────────────────────────────────
function TimeoutBanner({
  onSkip,
  onRetry,
}: {
  onSkip: () => void;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" strokeWidth={1.5} aria-hidden />
        <span className="text-foreground">
          Taking longer than expected. Skip for now?
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onRetry} className="h-7 px-2 text-xs">
          Retry
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onSkip} className="h-7 px-2.5 text-xs">
          Skip for now
        </Button>
      </div>
    </div>
  );
}

const SHARED_FOLDERS = [
  { name: "Agency knowledge", count: 156 },
  { name: "Supplier rate sheets", count: 84 },
  { name: "Client trip files", count: 412 },
];
const PERSONAL_FOLDERS = [
  { name: "My research", count: 48 },
  { name: "Trip notes", count: 31 },
  { name: "Client correspondence", count: 73 },
];

function DriveConnectFlow({
  step,
  connected,
  connectedFolder,
  popupBlocked,
  audience,
  timedOut,
  onStart,
  onCancel,
  onPick,
  onSimulatePopupBlocked,
  onSimulateTimeout,
  onTimeoutRetry,
  onTimeoutSkip,
  onSkip,
}: {
  step: DriveStep;
  connected: boolean;
  connectedFolder: string;
  popupBlocked: boolean;
  audience: "shared" | "personal";
  timedOut?: boolean;
  onStart: () => void;
  onCancel: () => void;
  onPick: (folder: string) => void;
  onSimulatePopupBlocked: () => void;
  onSimulateTimeout?: () => void;
  onTimeoutRetry?: () => void;
  onTimeoutSkip?: () => void;
  onSkip: () => void;
}) {
  const folders = audience === "shared" ? SHARED_FOLDERS : PERSONAL_FOLDERS;
  // introCopy removed — buttons communicate the action directly

  if (connected && step === "idle") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Check className="mt-0.5 h-4 w-4 text-primary" strokeWidth={1.5} aria-hidden />
          <span>
            Connected — syncing <span className="font-medium text-foreground">{connectedFolder}</span>.
            Pick a different folder anytime.
          </span>
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onStart} className="h-7 px-2.5 text-xs">
            Change folder
          </Button>
        </div>
      </div>
    );
  }

  if (step === "idle") {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onSkip} className="h-7 px-2 text-xs">
          Set up later
        </Button>
        <Button type="button" size="sm" onClick={onStart} className="h-7 px-2.5 text-xs">
          Continue with Google
        </Button>
      </div>
    );
  }

  if (step === "authorizing") {
    return (
      <div className="space-y-3">
        {timedOut && onTimeoutRetry && onTimeoutSkip && (
          <TimeoutBanner onRetry={onTimeoutRetry} onSkip={onTimeoutSkip} />
        )}
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/30 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" strokeWidth={1.5} aria-hidden />
          <div role="status" aria-live="polite">
            <p className="text-sm font-medium text-foreground">Waiting for Google authorization…</p>
            <p className="text-xs text-muted-foreground">
              Complete the sign-in in the popup. We won&apos;t touch any folder you don&apos;t pick.
            </p>
          </div>
        </div>
        {popupBlocked && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4" strokeWidth={1.5} aria-hidden />
            <span>Your browser blocked the authorization window. Please allow popups and try again.</span>
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSimulatePopupBlocked}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Simulate popup blocked
          </Button>
          {onSimulateTimeout && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSimulateTimeout}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Simulate timeout
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-7 px-2 text-xs">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (step === "picking") {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">Pick a folder to sync</p>
          <p className="text-xs text-muted-foreground">
            We&apos;ll index PDF, DOCX, TXT, HTML and MD files. You can change this later in Settings.
          </p>
        </div>
        <ul role="listbox" aria-label="Drive folders" className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/40 bg-card/30">
          {folders.map((f) => (
            <li key={f.name} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => onPick(f.name)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
              >
                <Folder className="h-4 w-4 text-foreground/60" strokeWidth={1.5} aria-hidden />
                <span className="flex-1 text-sm text-foreground">{f.name}</span>
                <span className="text-xs text-muted-foreground">{f.count} files</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-7 px-2 text-xs">Cancel</Button>
        </div>
      </div>
    );
  }

  // syncing
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" strokeWidth={1.5} aria-hidden />
        <div className="min-w-0 flex-1" role="status" aria-live="polite">
          <p className="text-sm font-medium text-foreground">Syncing your folder…</p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={66}
            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/60"
          >
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            You can keep going — sync continues in the background.
          </p>
        </div>
      </div>
    </div>
  );
}

function SourceCard({
  icon: Icon,
  title,
  summary,
  status,
  canEdit,
  pulsing,
  connectedAs,
  help,
  alwaysExpanded,
  children,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  summary: ReactNode | null;
  status: Status;
  canEdit: boolean;
  pulsing?: boolean;
  connectedAs?: string;
  help?: { id: string; label: string; body: string };
  alwaysExpanded?: boolean;
  children?: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pulsing || !wrapRef.current) return;
    const el = wrapRef.current;
    el.style.transition = "border-color 600ms ease-out, background-color 600ms ease-out";
    return () => {
      el.style.transition = "";
    };
  }, [pulsing]);



  const headerInner = (
    <div className="flex items-start gap-3 px-4 py-2.5 md:px-5 md:py-2.5">
      <Icon
        className="mt-0.5 h-[18px] w-[18px] shrink-0 text-foreground/70"
        strokeWidth={1.5}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-display min-w-0 flex-1 text-lg font-medium tracking-tight text-foreground">
            {title}
          </h2>
          {help && <HelpHint id={help.id} label={help.label} body={help.body} />}
          <StatusDot status={status} />
        </div>
        {summary ? (
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
        ) : null}
        {connectedAs && (
          <p className="mt-1 text-xs text-muted-foreground/70">{connectedAs}</p>
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={wrapRef}
      className={cn(
        "rounded-2xl transition-colors duration-300",
        status === "connected" && "border border-border/60 bg-card/40",
        status === "skipped" && "border border-amber-500/30 bg-card/20",
        (status === "not_connected" || status === "admin_managed") && "border border-border/30 bg-card/15"
      )}
    >
      {headerInner}
      {canEdit && alwaysExpanded && (
        <div className="border-t border-border/40 px-4 pb-3 pt-2.5 md:px-5">{children}</div>
      )}
    </div>
  );
}
