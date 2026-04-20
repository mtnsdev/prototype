"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { OnboardingTrackPicker } from "@/components/onboarding/OnboardingTrackPicker";
import {
  getOnboardingTrackChoice,
  setOnboardingTrackChoice,
  shouldShowOnboarding,
  type OnboardingTrackChoice,
} from "@/lib/onboardingState";

type Phase = "init" | "pick" | "flow";

export function OnboardingEntry() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [phase, setPhase] = useState<Phase>("init");

  useEffect(() => {
    if (getOnboardingTrackChoice()) {
      setPhase("flow");
      return;
    }
    setPhase("pick");
  }, []);

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

  const handleSelectTrack = useCallback((track: OnboardingTrackChoice) => {
    setOnboardingTrackChoice(track);
    setPhase("flow");
  }, []);

  if (userLoading || !user || phase === "init") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (phase === "pick") {
    return (
      <OnboardingTrackPicker onSelectTrack={handleSelectTrack} />
    );
  }

  return <OnboardingFlow />;
}
