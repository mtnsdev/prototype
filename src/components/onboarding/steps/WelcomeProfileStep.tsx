"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import type { OnboardingPath } from "@/lib/onboardingState";
import { PROTOTYPE_AGENCY_NAME } from "@/components/onboarding/constants";

type WelcomeProfileStepProps = {
  path: OnboardingPath;
  agencyName: string;
  initialName: string;
  initialEmail: string;
  initialWorkspaceName?: string;
  onContinue: (payload: {
    fullName: string;
    workspaceName: string;
    password?: string;
  }) => void;
  onDemoMode?: () => void;
  registerAdvance?: (fn: () => void) => void;
};

export function WelcomeProfileStep({
  path,
  agencyName,
  initialName,
  initialEmail,
  initialWorkspaceName = "",
  onContinue,
  onDemoMode,
  registerAdvance,
}: WelcomeProfileStepProps) {
  const [fullName, setFullName] = useState(initialName);
  const [workspaceName, setWorkspaceName] = useState(initialWorkspaceName);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  const isAdmin = path === "A";

  const eyebrow = useMemo(() => {
    if (path === "A") return "Step 1 · Welcome";
    if (path === "C") return "Welcome · Admin invitation";
    return "Welcome";
  }, [path]);

  const title = useMemo(() => {
    const agency = agencyName || PROTOTYPE_AGENCY_NAME;
    if (path === "A") return "Set up your workspace.";
    if (path === "C") return `${agency} has invited you as an admin.`;
    return `${agency} has invited you to Enable.`;
  }, [path, agencyName]);

  const subtitle = isAdmin
    ? "A few quick details and we'll get your team's intelligence assistant ready."
    : `${agencyName || PROTOTYPE_AGENCY_NAME} has set up Enable for the team. Confirm your details and you're in.`;

  const ctaLabel = isAdmin ? "Set up workspace" : "Continue";

  const needsFullNameHint = fullName.trim().length > 0 && !fullName.trim().includes(" ");
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 8;

  // Both admin and advisor now set a password.
  const canSubmit =
    fullName.trim().length > 0 &&
    passwordsMatch &&
    !passwordTooShort &&
    (isAdmin ? workspaceName.trim().length > 0 : true);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    onContinue({
      fullName: fullName.trim() || initialName,
      workspaceName: workspaceName.trim(),
      password,
    });
  };

  useEffect(() => {
    registerAdvance?.(() => {
      if (canSubmit) handleSubmit();
    });
  }, [registerAdvance, canSubmit, fullName, workspaceName, password, confirmPassword]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-12 mt-4 md:mt-8">
        <p className="font-display mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="font-display max-w-xl text-[2rem] font-medium leading-[1.1] tracking-tight text-foreground md:text-[2.75rem]">
          {title}
        </h1>
        <p className="mt-4 max-w-lg text-sm text-muted-foreground md:text-base">{subtitle}</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="space-y-5 rounded-2xl border border-border/40 bg-card/20 p-5 md:p-6">
          <div className="space-y-1.5">
            <Label htmlFor="onboarding-full-name" className="text-xs">
              Full name
            </Label>
            <Input
              id="onboarding-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="Your full name"
              className="h-9"
            />
            {needsFullNameHint && (
              <p className="text-xs text-amber-600 dark:text-amber-500/90">
                Please enter your full name
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="onboarding-email" className="text-xs">
              Email
            </Label>
            <Input
              id="onboarding-email"
              value={initialEmail}
              readOnly
              className="h-9 bg-muted/20 text-muted-foreground"
            />
            {!isAdmin && (
              <p className="text-xs text-muted-foreground">
                Set by your admin. Contact them if this looks wrong.
              </p>
            )}
          </div>

          {isAdmin && (
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-workspace" className="text-xs">
                Workspace name
              </Label>
              <Input
                id="onboarding-workspace"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Dal Luxury Travel"
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">Shown to your team across the app.</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-password" className="text-xs">
                Create password
              </Label>
              <Input
                id="onboarding-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-9"
              />
              {passwordTooShort && (
                <p className="text-xs text-amber-600 dark:text-amber-500/90">
                  Password must be at least 8 characters.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-password-confirm" className="text-xs">
                Confirm password
              </Label>
              <Input
                id="onboarding-password-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="h-9"
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-amber-600 dark:text-amber-500/90">
                  Passwords don&apos;t match.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {isAdmin && onDemoMode ? (
            <button
              type="button"
              onClick={onDemoMode}
              className="inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              Skip setup, show me a demo
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <Button
            type="submit"
            size="sm"
            className="h-9 min-w-[160px] px-4 text-sm"
            disabled={!canSubmit}
            data-onboarding-primary
          >
            {ctaLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
