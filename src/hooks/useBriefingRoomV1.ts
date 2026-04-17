"use client";

import { useEffect, useState } from "react";
import {
  BRIEFING_V1_STORAGE_KEY,
  type BriefingV1State,
  loadBriefingV1State,
  saveBriefingV1State,
} from "@/lib/briefingRoomV1Store";

export function useBriefingRoomV1(): {
  state: BriefingV1State;
  setState: React.Dispatch<React.SetStateAction<BriefingV1State>>;
  hydrated: boolean;
} {
  const [state, setState] = useState<BriefingV1State>(() => loadBriefingV1State());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadBriefingV1State());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const sync = () => {
      setState((prev) => {
        const next = loadBriefingV1State();
        if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
        return next;
      });
    };
    window.addEventListener("enable-briefing-v1-updated", sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === BRIEFING_V1_STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("enable-briefing-v1-updated", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveBriefingV1State(state);
  }, [state, hydrated]);

  return { state, setState, hydrated };
}
