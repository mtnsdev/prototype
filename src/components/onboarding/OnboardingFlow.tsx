"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
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
  POST_ONBOARDING_CHAT_PATH,
  setPostOnboardingSkippedIntegrationsNudge,
  setUserOnboardingComplete,
  setWorkspaceInitialSetupComplete,
  storeStarterChipsForChat,
  takePostOnboardingRedirect,
  shouldShowOnboarding,
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

  useEffect(() => {
    if (userLoading || !user) return;
    console.debug("[onboarding] onboarding_started", { path, user_id: user.id });
  }, [path, user?.id, userLoading, user]);

  useEffect(() => {
    console.debug("[onboarding] screen_viewed", { screen_name: step, path });
  }, [step, path]);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.replace("/login?redirect=/dashboard/onboarding");
      return;
    }
    if (!shouldShowOnboarding(user)) {
      router.replace("/dashboard/chat");
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
    takePostOnboardingRedirect();
    console.debug("[onboarding] onboarding_completed", {
      path,
      user_id: user.id,
      integrations_connected: {
        intranet: hubSnapshot.intranetConnected,
        shared: hubSnapshot.sharedDriveConnected,
        personal: hubSnapshot.personalConnected,
      },
    });
    router.replace(POST_ONBOARDING_CHAT_PATH);
  }, [user, path, hubSnapshot, router]);

  if (userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <OnboardingShell
      stepIndex={stepIndex}
      totalSteps={totalSteps}
      onBack={step === "welcome" ? goWelcomeBack : handleBack}
      canBack
    >
      {step === "welcome" && (
        <WelcomeProfileStep
          path={path}
          agencyName={PROTOTYPE_AGENCY_NAME}
          initialName={profileName || user.username || "there"}
          initialEmail={user.email}
          onContinue={({ fullName }) => {
            setProfileName(fullName);
            setStep("hub");
          }}
        />
      )}

      {step === "hub" && (
        <KnowledgeHubStep
          path={path}
          onContinue={(snap) => {
            setHubSnapshot(snap);
            if (path === "A") {
              setInviteRowsFromTeams(null);
              setStep("teams");
            } else setStep("completion");
          }}
        />
      )}

      {step === "teams" && path === "A" && (
        <TeamsBuilderStep
          hubSnapshot={hubSnapshot}
          onContinue={(rows) => {
            setInviteRowsFromTeams(rows);
            setStep("completion");
          }}
          onBack={() => setStep("hub")}
        />
      )}

      {step === "completion" && (
        <CompletionStep
          path={path}
          hubSnapshot={hubSnapshot}
          inviteRowsFromTeams={inviteRowsFromTeams}
          onFinishToChat={finishOnboarding}
          onBack={() => {
            if (path === "A") setStep("teams");
            else setStep("hub");
          }}
        />
      )}
    </OnboardingShell>
  );
}
