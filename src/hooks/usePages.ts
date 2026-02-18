"use client";

import { useEffect, useState } from "react";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

export interface PageItem {
  kind: "page";
  id: string;
  name: string;
  key: string;
  size: number;
  last_modified: string;
}

export interface PagesListResponse {
  items: PageItem[];
  next_token?: string | null;
  has_more: boolean;
}

type UsePagesOpts = {
  enabled?: boolean;
};

export function usePages(continuationToken?: string, opts?: UsePagesOpts) {
  const [data, setData] = useState<PagesListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Delayed loading to prevent flickering
  const showLoading = useDelayedLoading(loading);

  const enabled = opts?.enabled ?? true;

  useEffect(() => {
    let cancelled = false;

    const getCookieValue = (name: string) => {
      const prefix = `${name}=`;
      for (const part of document.cookie.split(";")) {
        const trimmed = part.trim();
        if (trimmed.startsWith(prefix)) {
          return decodeURIComponent(trimmed.slice(prefix.length));
        }
      }
      return "";
    };

    async function fetchPages() {
      if (!enabled) return;

      setLoading(true);
      setError(null);

      try {
        const url = new URL("/api/library/knowledge/pages", window.location.origin);
        if (continuationToken) {
          url.searchParams.set("continuation_token", continuationToken);
        }
        url.searchParams.set("limit", "100");

        const token = getCookieValue("auth_token");
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        const res = await fetch(url.pathname + url.search, {
          cache: "no-store",
          headers,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Backend error ${res.status}: ${text || res.statusText}`);
        }

        const result = (await res.json()) as PagesListResponse;

        if (!cancelled) {
          setData(result);
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Unknown error");
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPages();

    return () => {
      cancelled = true;
    };
  }, [enabled, continuationToken]);

  return { data, loading, showLoading, error, isLoading: loading };
}
