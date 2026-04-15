"use client";

import type { ReactNode } from "react";

/** Wraps dashboard content; reserved for future shell-wide state. */
export function DashboardShellProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
