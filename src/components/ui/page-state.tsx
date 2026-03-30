"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "muted" | "warning" | "error";

const toneBorder: Record<Tone, string> = {
  default: "border-border",
  muted: "border-border",
  warning: "border-[var(--color-warning)]/25",
  error: "border-[var(--color-error)]/30",
};

const toneBg: Record<Tone, string> = {
  default: "bg-card/60",
  muted: "bg-inset/80",
  warning: "bg-[var(--color-warning-muted)]",
  error: "bg-[var(--color-error-muted)]",
};

export function PageState({
  icon,
  title,
  description,
  action,
  tone = "default",
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border px-6 py-12 text-center",
        toneBorder[tone],
        toneBg[tone],
        className
      )}
      role="status"
    >
      {icon ? <div className="mb-4 text-muted-foreground">{icon}</div> : null}
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-muted-foreground/75">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function PageStateInline({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-inset/50 px-4 py-3", className)}>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground/75">{description}</p> : null}
    </div>
  );
}

/** Inline form / action errors — use with fields or modals for consistent feedback. */
export function InlineFieldError({ message, className }: { message: string; className?: string }) {
  return (
    <p role="alert" className={cn("text-sm text-[var(--color-error)]", className)}>
      {message}
    </p>
  );
}
