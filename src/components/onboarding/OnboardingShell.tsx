"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type OnboardingShellProps = {
  /** 0-based index of current step */
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  canBack: boolean;
  children: ReactNode;
};

export function OnboardingShell({
  stepIndex,
  totalSteps,
  onBack,
  canBack,
  children,
}: OnboardingShellProps) {
  const pct = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="shrink-0 border-b border-border px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onBack}
            disabled={!canBack}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full bg-primary transition-[width] duration-300 ease-out")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6 md:px-6 md:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
