"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  X,
  BookOpen,
  MessageSquare,
  Users,
  Settings,
  Library,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isProductTourPending,
  setProductTourPending,
} from "@/lib/onboardingState";

type TourStep = {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  destination: string;
  destinationLabel: string;
};

const STEPS: TourStep[] = [
  {
    title: "Knowledge Hub",
    body:
      "All your sources in one place — agency intranet, Drives, email forwarding. Connect more or update permissions anytime.",
    icon: BookOpen,
    destination: "/dashboard/knowledge",
    destinationLabel: "Open Knowledge Hub",
  },
  {
    title: "Chat",
    body:
      "Ask questions in plain English — Enable answers from your connected sources, with citations you can click straight into.",
    icon: MessageSquare,
    destination: "/dashboard/chat",
    destinationLabel: "Open Chat",
  },
  {
    title: "Teams",
    body:
      "Group your advisors, control which intranet pages they see. Document permissions inherit from each advisor's intranet login.",
    icon: Users,
    destination: "/dashboard/settings",
    destinationLabel: "Manage teams",
  },
  {
    title: "Settings",
    body:
      "Update integrations, invite teammates, manage roles. Anything you skipped in setup lives here.",
    icon: Settings,
    destination: "/dashboard/settings",
    destinationLabel: "Open Settings",
  },
  {
    title: "Library",
    body:
      "Browse everything Enable has indexed across your sources. Save products to your client briefcase.",
    icon: Library,
    destination: "/dashboard/library",
    destinationLabel: "Open Library",
  },
];

export function ProductTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setPending(isProductTourPending());
  }, [pathname]);

  // Don't render on onboarding paths
  if (!pending) return null;
  if (pathname?.startsWith("/dashboard/onboarding")) return null;

  const total = STEPS.length;
  const current = STEPS[Math.min(step, total - 1)];
  const Icon = current.icon;
  const isLast = step >= total - 1;

  const dismiss = () => {
    setProductTourPending(false);
    setPending(false);
  };

  const next = () => {
    if (isLast) {
      dismiss();
      return;
    }
    setStep((s) => s + 1);
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  const goTo = () => {
    setProductTourPending(false);
    setPending(false);
    router.push(current.destination);
  };

  const pct = ((step + 1) / total) * 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Product tour — step ${step + 1} of ${total}`}
      className="fixed inset-0 z-[150] flex items-end justify-end bg-background/30 p-4 backdrop-blur-[2px] sm:items-center sm:justify-center"
    >
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-xl">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Product tour · {step + 1} / {total}
            </p>
            <p className="font-display truncate text-base font-medium tracking-tight text-foreground">{current.title}</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-2 pt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="px-4 py-4">
          <p className="text-sm text-foreground">{current.body}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goTo}
            className="mt-3 gap-1.5"
          >
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            {current.destinationLabel}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={step === 0}
            className="gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            Back
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip tour
          </button>
          <Button type="button" size="sm" onClick={next} className="gap-1">
            {isLast ? (
              <>
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                Done
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
