"use client";

import Link from "next/link";
import { Plug } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ConnectToUnlockProps {
  integrationName: string;
  description: string;
}

export function ConnectToUnlock({ integrationName, description }: ConnectToUnlockProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--surface-base)]/40 px-4 py-10 text-center"
      role="region"
      aria-label={`Connect ${integrationName} to unlock this widget`}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-interactive)] text-[var(--text-tertiary)]"
        aria-hidden
      >
        <Plug className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Connect {integrationName} to unlock
        </p>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{description}</p>
      </div>
      <Button variant="toolbarAccent" size="sm" asChild>
        <Link href="/dashboard/settings/integrations">Set up integration</Link>
      </Button>
    </div>
  );
}
