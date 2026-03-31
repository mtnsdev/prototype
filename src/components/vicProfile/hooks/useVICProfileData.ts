"use client";

import { useCallback, useEffect, useState } from "react";
import { getPersonaBundleByVicId } from "@/lib/vic-profile-mock";
import type { VICPersonaBundle } from "@/types/vic-profile";

const MOCK_LATENCY_MS = 280;

export function useVICProfileData(vicId: string | undefined) {
  const [bundle, setBundle] = useState<VICPersonaBundle | null>(null);
  const [loading, setLoading] = useState(Boolean(vicId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!vicId) {
      setBundle(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));
    try {
      const found = getPersonaBundleByVicId(vicId);
      setBundle(found ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, [vicId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { bundle, loading, error, refetch: load };
}
