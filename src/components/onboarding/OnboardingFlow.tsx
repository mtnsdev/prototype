"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import {
  OnboardingShell,
  OnboardingShellSkeleton,
} from "@/components/onboarding/OnboardingShell";
import { WelcomeProfileStep } from "@/components/onboarding/steps/WelcomeProfileStep";
import { KnowledgeHubStep } from "@/components/onboarding/steps/KnowledgeHubStep";
import { TeamsBuilderStep } from "@/components/onboarding/steps/TeamsBuilderStep";
import { CompletionStep } from "@/components/onboarding/steps/CompletionStep";
import {
  getStarterQuestionsForHub,
  PROTOTYPE_AGENCY_NAME,
} from "@/components/onboarding/constants";
import type { InviteRow } from "@/components/onboarding/InviteTeamModal";
import type { HubSnapshot } from "@/components/onboarding/types";
import { emptyHubSnapshot } from "@/components/onboarding/types";
import {
  resolveOnboardingPath,
  saveOnboardingResume,
  loadOnboardingResume,
  clearOnboardingResume,
  clearOnboardingTrackChoice,
  POST_ONBOARDING_HOME_PATH,
  setPostOnboardingSkippedIntegrationsNudge,
  setUserOnboardingComplete,
  setWorkspaceInitialSetupComplete,
  storeStarterChipsForChat,
  takePostOnboardingRedirect,
  shouldShowOnboarding,
  storeOnboardingSummary,
  setProductTourPending,
  type OnboardingPath,
  type OnboardingStepId,
} from "@/lib/onboardingState";

function normalizeResumeStep(step: OnboardingStepId | null, path: OnboardingPath): OnboardingStepId {
  if (!step) return "welcome";
  if (path !== "A" && step === "teams") return "hub";
  return step;
}

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useUser();

  const path = useMemo(
    () => (user ? resolveOnboardingPath(user, searchParams) : ("B" as OnboardingPath)),
    [user, searchParams]
  );

  const [step, setStep] = useState<OnboardingStepId>("welcome");
  const [hubSnapshot, setHubSnapshot] = useState<HubSnapshot>(() => emptyHubSnapshot());
  const [inviteRowsFromTeams, setInviteRowsFromTeams] = useState<InviteRow[] | null>(null);
  const [profileName, setProfileName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  /** Bumped any time the user completes a meaningful action — drives the "Saved" pill. */
  const [saveToken, setSaveToken] = useState(0);
  /** Step-supplied "advance" handler used by ⌘/Ctrl+Enter shortcut. */
  const advanceRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (user?.username) setProfileName((p) => p || user.username || "");
  }, [user?.username]);

  useEffect(() => {
    if (userLoading || !user) return;
    const r = loadOnboardingResume(user.id, path);
    setStep(normalizeResumeStep(r, path));
  }, [user?.id, path, userLoading, user]);

  useEffect(() => {
    if (!user) return;
    saveOnboardingResume(user.id, path, step);
  }, [user, path, step]);

  // Bump save token whenever the snapshot changes meaningfully.
  useEffect(() => {
    setSaveToken((n) => n + 1);
  }, [hubSnapshot, profileName, workspaceName]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/login?redirect=/dashboard/onboarding");
      return;
    }
    if (!shouldShowOnboarding(user)) {
      router.replace(POST_ONBOARDING_HOME_PATH);
    }
  }, [user, userLoading, router]);

  const totalSteps = path === "A" ? 4 : 3;

  const stepIndex = useMemo(() => {
    if (step === "welcome") return 0;
    if (step === "hub") return 1;
    if (step === "teams") return 2;
    return path === "A" ? 3 : 2;
  }, [step, path]);

  const goWelcomeBack = useCallback(() => {
    router.replace("/login");
  }, [router]);

  const handleBack = useCallback(() => {
    if (step === "welcome") {
      goWelcomeBack();
      return;
    }
    if (step === "hub") setStep("welcome");
    else if (step === "teams") setStep("hub");
    else if (step === "completion") {
      if (path === "A") setStep("teams");
      else setStep("hub");
    }
  }, [step, path, goWelcomeBack]);

  const finishOnboarding = useCallback(() => {
    if (!user) return;
    setUserOnboardingComplete(user.id);
    if (path === "A") {
      setWorkspaceInitialSetupComplete();
    }
    clearOnboardingResume(user.id);
    clearOnboardingTrackChoice();
    storeStarterChipsForChat(getStarterQuestionsForHub(hubSnapshot));
    setPostOnboardingSkippedIntegrationsNudge(hubSnapshot);
    storeOnboardingSummary({
      path,
      workspaceName: workspaceName || "",
      intranetConnected: hubSnapshot.intranetConnected,
      sharedDriveConnected: hubSnapshot.sharedDriveConnected,
      personalConnected: hubSnapshot.personalConnected,
      emailForwardingConfigured: hubSnapshot.emailForwardingConfigured,
      skippedIntranet: hubSnapshot.skippedIntranet,
      skippedShared: hubSnapshot.skippedShared,
      skippedPersonal: hubSnapshot.skippedPersonal,
      skippedEmailForwarding: hubSnapshot.skippedEmailForwarding,
      completedAt: Date.now(),
    });
    if (path === "A") setProductTourPending(true);
    takePostOnboardingRedirect();
    router.replace(POST_ONBOARDING_HOME_PATH);
  }, [user, path, hubSnapshot, workspaceName, router]);

  /** Demo-mode bypass — used by the welcome screen "Show me a demo" link. */
  const enterDemoMode = useCallback(() => {
    if (!user) return;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("enable_vic_demo_mode", "1");
      } catch {
        /* ignore */
      }
    }
    setUserOnboardingComplete(user.id);
    clearOnboardingResume(user.id);
    clearOnboardingTrackChoice();
    router.replace(POST_ONBOARDING_HOME_PATH);
  }, [user, router]);

  if (userLoading || !user) {
    return <OnboardingShellSkeleton />;
  }

  const agencyForCopy = workspaceName || PROTOTYPE_AGENCY_NAME;

  return (
    <OnboardingShell
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onBack={step === "welcome" ? goWelcomeBack : handleBack}
      canBack
      saveToken={`${step}-${saveToken}`}
      onAdvance={() => advanceRef.current?.()}
    >
      {step === "welcome" && (
        <WelcomeProfileStep
          path={path}
          agencyName={agencyForCopy}
          initialName={profileName || user.username || "there"}
          initialEmail={user.email}
          initialWorkspaceName={workspaceName}
          onContinue={({ fullName, workspaceName: ws }) => {
            setProfileName(fullName);
            if (ws) setWorkspaceName(ws);
            setHubSnapshot((s) => ({ ...s, workspaceName: ws || s.workspaceName }));
            setStep("hub");
          }}
          onDemoMode={enterDemoMode}
          registerAdvance={(fn) => {
            advanceRef.current = fn;
          }}
        />
      )}

      {step === "hub" && (
        <KnowledgeHubStep
          path={path}
          agencyName={agencyForCopy}
          adminUserName={user.username || ""}
          adminUserEmail={user.email}
          onContinue={(snap) => {
            setHubSnapshot({ ...snap, workspaceName: workspaceName || snap.workspaceName });
            if (path === "A") {
              setInviteRowsFromTeams(null);
              setStep("teams");
            } else setStep("completion");
          }}
          registerAdvance={(fn) => {
            advanceRef.current = fn;
          }}
        />
      )}

      {step === "teams" && path === "A" && (
        <TeamsBuilderStep
          hubSnapshot={hubSnapshot}
          agencyName={agencyForCopy}
          onContinue={(rows) => {
            setInviteRowsFromTeams(rows);
            setStep("completion");
          }}
          onBack={() => setStep("hub")}
          registerAdvance={(fn) => {
            advanceRef.current = fn;
          }}
        />
      )}

      {step === "completion" && (
        <CompletionStep
          path={path}
          agencyName={agencyForCopy}
          hubSnapshot={hubSnapshot}
          inviteRowsFromTeams={inviteRowsFromTeams}
          onFinishToChat={finishOnboarding}
          onBack={() => {
            if (path === "A") setStep("teams");
            else setStep("hub");
          }}
          registerAdvance={(fn) => {
            advanceRef.current = fn;
          }}
        />
      )}
    </OnboardingShell>
  );
}
