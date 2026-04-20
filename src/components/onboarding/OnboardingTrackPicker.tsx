"use client";

import { Shield, Users } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OnboardingTrackChoice } from "@/lib/onboardingState";
import { cn } from "@/lib/utils";

type OnboardingTrackPickerProps = {
  onSelectTrack: (track: OnboardingTrackChoice) => void;
};

export function OnboardingTrackPicker({ onSelectTrack }: OnboardingTrackPickerProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Choose your onboarding
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Choose Admin or Advisor — each session starts here until you finish onboarding. Refresh mid-flow keeps your
          progress without asking again.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelectTrack("admin")}
          className={cn(
            "text-left rounded-2xl border border-border bg-card/50 p-0 transition-colors",
            "hover:border-primary/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60">
                <Shield className="h-5 w-5 text-foreground/90" aria-hidden />
              </div>
              <CardTitle className="text-lg">Admin track</CardTitle>
              <CardDescription className="text-muted-foreground">
                Workspace setup, Knowledge Hub (admin controls), teams, and team invites. First-time workspace
                shows the full admin path; otherwise the additional-admin path.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-sm font-medium text-primary">Continue as admin →</span>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() => onSelectTrack("advisor")}
          className={cn(
            "text-left rounded-2xl border border-border bg-card/50 p-0 transition-colors",
            "hover:border-primary/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60">
                <Users className="h-5 w-5 text-foreground/90" aria-hidden />
              </div>
              <CardTitle className="text-lg">Advisor (non-admin) track</CardTitle>
              <CardDescription className="text-muted-foreground">
                Invited user journey: welcome, Knowledge Hub (personal connections + read-only shared sources),
                then completion — no team builder or workspace admin steps.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <span className="text-sm font-medium text-primary">Continue as advisor →</span>
            </CardContent>
          </Card>
        </button>
      </div>

      <div className="mt-8 flex flex-col items-center border-t border-border pt-8">
        <Link
          href="/login"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
