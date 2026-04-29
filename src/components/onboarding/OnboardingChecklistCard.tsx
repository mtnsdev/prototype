"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Building2,
  Cloud,
  FolderOpen,
  Mail,
  ArrowRight,
  Check,
  ListChecks,
} from "lucide-react";
import {
  loadOnboardingSummary,
  clearOnboardingSummary,
  type OnboardingSummary,
} from "@/lib/onboardingState";

type ChecklistItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  href: string;
  done: boolean;
  skipped: boolean;
  estimate: string;
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function buildItems(s: OnboardingSummary): ChecklistItem[] {
  return [
    {
      key: "intranet",
      label: "Connect agency intranet",
      icon: Building2,
      href: "/dashboard/settings",
      done: s.intranetConnected,
      skipped: s.skippedIntranet,
      estimate: "3 min",
    },
    {
      key: "shared",
      label: "Connect shared Drive",
      icon: Cloud,
      href: "/dashboard/settings",
      done: s.sharedDriveConnected,
      skipped: s.skippedShared,
      estimate: "2 min",
    },
    {
      key: "personal",
      label: "Connect personal Drive",
      icon: FolderOpen,
      href: "/dashboard/settings",
      done: s.personalConnected,
      skipped: s.skippedPersonal,
      estimate: "2 min",
    },
    {
      key: "email",
      label: "Set up email forwarding",
      icon: Mail,
      href: "/dashboard/settings",
      done: s.emailForwardingConfigured,
      skipped: s.skippedEmailForwarding,
      estimate: "1 min",
    },
  ];
}

export function OnboardingChecklistCard() {
  const pathname = usePathname();
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const s = loadOnboardingSummary();
    if (!s) return;
    if (Date.now() - s.completedAt > SEVEN_DAYS_MS) {
      clearOnboardingSummary();
      return;
    }
    setSummary(s);
  }, [pathname]);

  const items = useMemo(() => (summary ? buildItems(summary) : []), [summary]);
  const remaining = items.filter((i) => !i.done);
  const total = items.length;
  const doneCount = items.filter((i) => i.done).length;

  // Hide on the onboarding flow itself, and once everything is connected.
  if (!summary) return null;
  if (pathname?.startsWith("/dashboard/onboarding")) return null;
  if (remaining.length === 0) return null;

  const dismiss = () => {
    clearOnboardingSummary();
    setSummary(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[120] hidden w-80 max-w-[calc(100vw-2rem)] sm:block">
      <div className="rounded-2xl border border-border/60 bg-card/95 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center gap-2 px-4 pt-3 text-left"
          aria-expanded={!collapsed}
          aria-controls="onboarding-checklist-body"
        >
          <ListChecks className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-medium tracking-tight text-foreground">Finish setting up</p>
            <p className="text-xs text-muted-foreground">
              {doneCount} of {total} done · {remaining.length} item{remaining.length === 1 ? "" : "s"} left
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss checklist"
          >
            <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
        </button>

        <div className="px-4 pb-2 pt-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${(doneCount / total) * 100}%` }}
            />
          </div>
        </div>

        {!collapsed && (
          <ul id="onboarding-checklist-body" className="space-y-1 p-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  {item.done ? (
                    <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground line-through">
                      <Check className="h-4 w-4 text-primary" strokeWidth={1.5} aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className="group flex items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted/50"
                    >
                      <Icon className="h-4 w-4 text-foreground/70" strokeWidth={1.5} aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.estimate}</span>
                      <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-muted-foreground transition-all group-hover:translate-x-0 group-hover:text-foreground" strokeWidth={1.5} aria-hidden />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
