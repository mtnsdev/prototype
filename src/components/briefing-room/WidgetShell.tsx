"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import { ConnectToUnlock } from "./ConnectToUnlock";

export type WidgetShellSize = "standard" | "wide";

export interface WidgetShellProps {
  title: string;
  icon: LucideIcon;
  actions?: ReactNode;
  loading?: boolean;
  error?: string;
  integration?: { name: string; connected: boolean };
  size?: WidgetShellSize;
  children: ReactNode;
  /** Shown when loading — number of skeleton rows */
  skeletonRows?: number;
}

export function WidgetShell({
  title,
  icon: Icon,
  actions,
  loading,
  error,
  integration,
  size = "standard",
  skeletonRows = 4,
  children,
}: WidgetShellProps) {
  const locked = integration != null && !integration.connected;
  const titleId = useId();

  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 transition-[border-color] duration-200 hover:border-[var(--border-default)]",
        size === "wide" && "lg:col-span-2"
      )}
      aria-labelledby={titleId}
    >
      <header className="mb-4 flex items-start gap-3">
        <Icon
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-tertiary)]"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            className="text-sm font-semibold tracking-tight text-[var(--text-primary)]"
          >
            {title}
          </h2>
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1 text-[var(--text-tertiary)]">{actions}</div>
        ) : null}
      </header>

      {loading ? (
        <WidgetSkeleton rows={skeletonRows} />
      ) : error ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {error}
        </p>
      ) : locked ? (
        <ConnectToUnlock
          integrationName={integration.name}
          description={`See live itineraries, departure windows, and client context from ${integration.name} right here.`}
        />
      ) : (
        children
      )}
    </section>
  );
}

function WidgetSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded-md bg-[var(--surface-interactive)]"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}
