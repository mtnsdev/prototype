"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ShellCrumb } from "@/lib/dashboardShellCrumbs";

type DashboardShellContextValue = {
  manualCrumbs: ShellCrumb[] | null;
  setManualCrumbs: (crumbs: ShellCrumb[] | null) => void;
};

const DashboardShellContext = createContext<DashboardShellContextValue | null>(null);

export function DashboardShellProvider({ children }: { children: ReactNode }) {
  const [manualCrumbs, setManualCrumbsState] = useState<ShellCrumb[] | null>(null);

  const setManualCrumbs = useCallback((crumbs: ShellCrumb[] | null) => {
    setManualCrumbsState(crumbs);
  }, []);

  const value = useMemo(
    () => ({ manualCrumbs, setManualCrumbs }),
    [manualCrumbs, setManualCrumbs]
  );

  return <DashboardShellContext.Provider value={value}>{children}</DashboardShellContext.Provider>;
}

export function useDashboardShell(): DashboardShellContextValue {
  const v = useContext(DashboardShellContext);
  if (!v) throw new Error("DashboardShellProvider required");
  return v;
}

/** Registers shell breadcrumbs for the current view; clears on unmount. */
export function ShellCrumbOverride({ crumbs }: { crumbs: ShellCrumb[] }) {
  const { setManualCrumbs } = useDashboardShell();
  const signature = crumbs.map((c) => `${c.label}\0${c.href ?? ""}`).join("|");

  useEffect(() => {
    setManualCrumbs(crumbs);
    return () => setManualCrumbs(null);
  }, [signature, setManualCrumbs]);

  return null;
}
