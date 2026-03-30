/**
 * Highlight search terms in text for product list/card (Section 10 polish).
 */

import React from "react";

export function highlightSearch(text: string, query: string | null): React.ReactNode {
  if (!query || !query.trim() || !text) return text;
  const q = query.trim().toLowerCase();
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[var(--muted-amber-bg)] text-foreground rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}
