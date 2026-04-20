"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingPath } from "@/lib/onboardingState";
import { PROTOTYPE_AGENCY_NAME } from "@/components/onboarding/constants";

type WelcomeProfileStepProps = {
  path: OnboardingPath;
  agencyName: string;
  initialName: string;
  initialEmail: string;
  onContinue: (payload: { fullName: string }) => void;
};

export function WelcomeProfileStep({
  path,
  agencyName,
  initialName,
  initialEmail,
  onContinue,
}: WelcomeProfileStepProps) {
  const [fullName, setFullName] = useState(initialName);

  const title = useMemo(() => {
    const agency = agencyName || PROTOTYPE_AGENCY_NAME;
    if (path === "A") return "Welcome — let's set up your workspace";
    if (path === "C") return `Welcome — ${agency} has invited you as an admin`;
    return `Welcome — ${agency} has invited you`;
  }, [path, agencyName]);

  const ctaLabel = path === "A" ? "Set up workspace" : "Get started";

  const needsFullNameHint = fullName.trim().length > 0 && !fullName.trim().includes(" ");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContinue({ fullName: fullName.trim() || initialName });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Your team&apos;s luxury travel intelligence assistant.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="rounded-2xl border border-border bg-card/50 p-5 md:p-6">
          <p className="mb-4 text-sm font-medium text-foreground">Confirm your profile</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="onboarding-full-name">Full name</Label>
              <Input
                id="onboarding-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                placeholder="Your full name"
              />
              {needsFullNameHint && (
                <p className="text-xs text-amber-600 dark:text-amber-500/90">
                  Please confirm your full name
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="onboarding-email">Email</Label>
              <Input
                id="onboarding-email"
                value={initialEmail}
                readOnly
                className="bg-muted/30 text-muted-foreground"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-muted-foreground">Profile photo</Label>
              <p className="text-xs text-muted-foreground">
                Optional — you can add a photo later in Settings.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" size="lg" className="min-w-[160px]">
            {ctaLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
