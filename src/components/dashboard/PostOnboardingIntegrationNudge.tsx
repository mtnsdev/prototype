"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IS_PREVIEW_MODE } from "@/config/preview";
import {
  dismissPostOnboardingIntegrationNudge,
  shouldShowPostOnboardingIntegrationNudge,
} from "@/lib/onboardingState";

/**
 * Shown after onboarding when the user skipped at least one integration (PRD post-onboarding nudge).
 */
export function PostOnboardingIntegrationNudge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(IS_PREVIEW_MODE && shouldShowPostOnboardingIntegrationNudge());
  }, []);

  if (!visible) return null;

  return (
    <div className="flex shrink-0 items-start gap-3 border-b border-border bg-muted/25 px-4 py-2.5 md:px-6">
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground md:text-sm">
        Connect skipped sources in{" "}
        <Link
          href="/dashboard/settings/integrations"
          className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/90"
        >
          Settings → Integrations
        </Link>{" "}
        for better answers.
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
        onClick={() => {
          dismissPostOnboardingIntegrationNudge();
          setVisible(false);
        }}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
