import { Suspense } from "react";
import { OnboardingEntry } from "@/components/onboarding/OnboardingEntry";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Loading…
        </div>
      }
    >
      <OnboardingEntry />
    </Suspense>
  );
}
