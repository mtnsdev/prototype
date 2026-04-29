"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Check, Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type OnboardingShellProps = {
  /** 0-based index of current step */
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  canBack: boolean;
  /**
   * State token: when this changes we briefly flash a "Saved" pill so the
   * user knows their work is being persisted as they go.
   */
  saveToken?: string | number;
  /**
   * Optional advance callback bound to ⌘/Ctrl + Enter. The shell delegates
   * progression to whichever step is mounted; if the step doesn't pass one
   * we fall through to clicking the focused button (default browser behaviour).
   */
  onAdvance?: () => void;
  children: ReactNode;
};

export function OnboardingShell({
  stepIndex,
  totalSteps,
  onBack,
  canBack,
  saveToken,
  onAdvance,
  children,
}: OnboardingShellProps) {
  const pct = totalSteps > 0 ? ((stepIndex + 1) / totalSteps) * 100 : 0;

  // ── Saved pill that flashes whenever saveToken / step changes ─────────
  const [savedFlash, setSavedFlash] = useState(false);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSavedFlash(true);
    const t = window.setTimeout(() => setSavedFlash(false), 1400);
    return () => clearTimeout(t);
  }, [saveToken, stepIndex]);

  // ── Shortcut dialog + keyboard nav ────────────────────────────────────
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.getAttribute("contenteditable") === "true";

      // ⌘/Ctrl + Enter advances even from inside a field
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (onAdvance) onAdvance();
        else {
          // Fallback: trigger the most-prominent submit button on screen
          const btn = document.querySelector<HTMLButtonElement>(
            "[data-onboarding-primary]"
          );
          btn?.click();
        }
        return;
      }
      if (e.key === "Escape" && !shortcutsOpen) {
        if (canBack) {
          e.preventDefault();
          onBack();
        }
        return;
      }
      if (e.key === "?" && !inField && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAdvance, onBack, canBack, shortcutsOpen]);

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
            aria-label="Back (Esc)"
            title="Back · Esc"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </Button>
          <div className="min-w-0 flex-1">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn(
                  "h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <span
            aria-live="polite"
            className={cn(
              "inline-flex shrink-0 items-center gap-1 text-[11px] font-medium tracking-wide text-primary/80 transition-opacity duration-500",
              savedFlash ? "opacity-100" : "opacity-0"
            )}
          >
            <Check className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            Saved
          </span>
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="hidden shrink-0 rounded-md border border-transparent p-1.5 text-muted-foreground hover:border-border hover:text-foreground sm:inline-flex"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts · ?"
          >
            <Keyboard className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6 md:px-6 md:py-10">
          {children}
          <p className="mt-12 text-center text-[11px] tracking-wide text-muted-foreground/70">
            Leave anytime · we&apos;ll pick up where you left off.
          </p>
        </div>
      </div>

      {shortcutsOpen && (
        <ShortcutsDialog onClose={() => setShortcutsOpen(false)} />
      )}
    </div>
  );
}

function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-semibold text-foreground">Keyboard shortcuts</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <ul className="space-y-2 text-sm">
          <Shortcut keys={["⌘", "Enter"]} label="Continue / advance" />
          <Shortcut keys={["Ctrl", "Enter"]} label="Continue / advance" />
          <Shortcut keys={["Esc"]} label="Back" />
          <Shortcut keys={["?"]} label="Show this dialog" />
        </ul>
      </div>
    </div>
  );
}

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-foreground">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={`${k}-${i}`}
            className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground"
          >
            {k}
          </kbd>
        ))}
      </span>
    </li>
  );
}

/**
 * Skeleton fallback shown while the user record is loading. Designed to
 * roughly match the welcome step layout so first paint feels stable.
 */
export function OnboardingShellSkeleton() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="shrink-0 border-b border-border px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
          <div className="h-1.5 w-full animate-pulse rounded-full bg-muted/60" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-5 px-4 py-10 md:px-6">
          <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-44 w-full animate-pulse rounded-2xl bg-muted/60" />
          <div className="ml-auto h-10 w-40 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
