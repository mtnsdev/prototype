"use client";

import { useEffect, useState } from "react";

type Options = {
  /** Scroll distance (px) before switching to compact. */
  threshold?: number;
  /** When false, compact stays false. */
  enabled?: boolean;
};

/**
 * Tracks whether a scroll container is scrolled past a threshold (for compact headers).
 * Pass the same element you attach `ref` to — use `useState` + callback ref so the effect runs when the node mounts.
 */
export function useScrollCollapseState(scrollEl: HTMLElement | null, options?: Options): boolean {
  const { threshold = 24, enabled = true } = options ?? {};
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (!enabled || !scrollEl) {
      setCompact(false);
      return;
    }

    const onScroll = () => {
      const next = scrollEl.scrollTop > threshold;
      setCompact((c) => (c !== next ? next : c));
    };

    onScroll();
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, [scrollEl, threshold, enabled]);

  return compact;
}
