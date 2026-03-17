"use client";

import { useState, useCallback } from "react";

const KEY = "travellustre_results_view";

export function useResultsView() {
  const [view, setViewState] = useState<"card" | "list">(() => {
    if (typeof window === "undefined") return "card";
    return (localStorage.getItem(KEY) as "card" | "list") || "card";
  });

  const setView = useCallback((v: "card" | "list") => {
    setViewState(v);
    if (typeof window !== "undefined") localStorage.setItem(KEY, v);
  }, []);

  return [view, setView] as const;
}
