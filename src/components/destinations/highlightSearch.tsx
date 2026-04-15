import type { ReactNode } from "react";

/**
 * Highlights the first case-insensitive match of `query` in `text` (portal search).
 */
export function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <>
      {before}
      <mark className="rounded-sm bg-brand-cta/25 px-0.5 text-inherit">{match}</mark>
      {after}
    </>
  );
}
