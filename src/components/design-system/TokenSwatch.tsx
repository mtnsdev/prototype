"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Token } from "@/lib/designSystemTokens";

type Props = {
  token: Token;
};

/**
 * One row in a token grid. Click anywhere → copy `var(--token-name)` to clipboard.
 */
export function TokenSwatch({ token }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`var(--${token.name})`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group flex w-full items-stretch gap-3 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-card)] p-2.5 text-left transition-colors hover:border-[color:var(--border-default)] hover:bg-[color:var(--surface-card-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-cta)]"
      aria-label={`Copy var(--${token.name})`}
    >
      <SwatchPreview token={token} />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div className="flex items-center gap-1.5">
          <code className="font-mono text-[12px] text-[color:var(--text-primary)]">
            --{token.name}
          </code>
          <span className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
            {copied ? (
              <Check size={12} className="text-[color:var(--color-success)]" />
            ) : (
              <Copy size={12} className="text-[color:var(--text-quaternary)]" />
            )}
          </span>
        </div>
        <code className="truncate font-mono text-[11px] text-[color:var(--text-tertiary)]">
          {token.value}
        </code>
        {token.caption ? (
          <span className="mt-0.5 text-[11px] text-[color:var(--text-quaternary)]">
            {token.caption}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function SwatchPreview({ token }: { token: Token }) {
  const base = "h-12 w-12 shrink-0 rounded-md";

  if (token.previewMode === "border") {
    return (
      <div
        className={`${base} bg-[color:var(--surface-card)]`}
        style={{ border: `2px solid ${token.value}` }}
      />
    );
  }

  if (token.previewMode === "muted-pair") {
    return (
      <div
        className={`${base} flex items-center justify-center rounded-md text-[10px] font-medium`}
        style={{
          background: token.value,
          color: token.pairText,
          border: `1px solid ${token.pairBorder}`,
        }}
      >
        {token.badgeLabel ?? "•"}
      </div>
    );
  }

  if (token.previewMode === "text") {
    return (
      <div
        className={`${base} flex items-center justify-center rounded-md bg-[color:var(--surface-card)] text-[14px] font-medium`}
        style={{ color: token.value }}
      >
        Aa
      </div>
    );
  }

  return <div className={base} style={{ background: token.value }} />;
}
