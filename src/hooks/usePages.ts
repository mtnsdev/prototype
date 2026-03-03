"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

export interface PageItem {
  kind: "page";
  id: string;
  name: string;
  key: string;
  size: number;
  last_modified: string;
  /** Set when the page can be previewed (path for document API); only show Preview button when present */
  pdf_path?: string | null;
}

export interface PagesListResponse {
  items: PageItem[];
  next_token?: string | null;
  has_more: boolean;
}

const getCookieValue = (name: string): string => {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return "";
};

async function fetchPagesBatch(nextToken?: string | null): Promise<PagesListResponse> {
  const url = new URL("/api/library/knowledge/pages", window.location.origin);
  if (nextToken) {
    url.searchParams.set("continuation_token", nextToken);
  }
  url.searchParams.set("limit", "100");

  const token = getCookieValue("auth_token");
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const res = await fetch(url.pathname + url.search, { cache: "no-store", headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as PagesListResponse;
}

type UsePagesOpts = {
  enabled?: boolean;
};

export function usePages(opts?: UsePagesOpts) {
  const [items, setItems] = useState<PageItem[]>([]);
  const [nextToken, setNextToken] = useState<string | null | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const initialised = useRef(false);

  const showLoading = useDelayedLoading(loading);
  const enabled = opts?.enabled ?? true;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPagesBatch(nextToken);
      setItems((prev) => [...prev, ...result.items]);
      setNextToken(result.next_token);
      setHasMore(result.has_more);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, nextToken]);

  // Initial fetch on mount
  useEffect(() => {
    if (!enabled || initialised.current) return;
    initialised.current = true;

    let cancelled = false;

    async function initialFetch() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPagesBatch();
        if (!cancelled) {
          setItems(result.items);
          setNextToken(result.next_token);
          setHasMore(result.has_more);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initialFetch();
    return () => { cancelled = true; };
  }, [enabled]);

  return { items, hasMore, loading, showLoading, error, loadMore, isLoading: loading };
}
