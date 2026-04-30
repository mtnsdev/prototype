"use client";

import type { Team } from "@/types/teams";

type Props = {
  /** `private`, team id, or `mirrors_source` for intranet documents default */
  scope: "private" | "mirrors_source" | string;
  teams: Team[];
  className?: string;
};

/* ────────────────────────────────────────────────
   Refreshed: pill anatomy with muted-state token pairs.
   Was using 0.50-opacity colors — too muted, hard to read.
   New: tinted bg + deeper text + low-opacity border + dot.
   ──────────────────────────────────────────────── */

const PILL_BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-medium leading-none";

type Style = { bg: string; text: string; border: string; dot: string };

const PRIVATE_STYLE: Style = {
  bg: "var(--muted-accent-bg)",
  text: "var(--muted-accent-text)",
  border: "var(--muted-accent-border)",
  dot: "var(--muted-accent-text)",
};

const MIRRORS_STYLE: Style = {
  bg: "var(--muted-info-bg)",
  text: "var(--muted-info-text)",
  border: "var(--muted-info-border)",
  dot: "var(--color-info)",
};

const EVERYONE_STYLE: Style = {
  bg: "var(--muted-info-bg)",
  text: "var(--muted-info-text)",
  border: "var(--muted-info-border)",
  dot: "var(--color-info)",
};

const TEAM_STYLE: Style = {
  bg: "var(--surface-interactive)",
  text: "var(--brand-primary)",
  border: "rgba(58, 89, 56, 0.30)",
  dot: "var(--brand-primary)",
};

function Pill({ style, label, className }: { style: Style; label: string; className?: string }) {
  return (
    <span
      className={`${PILL_BASE} ${className ?? ""}`.trim()}
      style={{
        background: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: style.dot }}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function ScopeBadge({ scope, teams, className }: Props) {
  if (scope === "private") {
    return <Pill style={PRIVATE_STYLE} label="Private" className={className} />;
  }
  if (scope === "mirrors_source") {
    return <Pill style={MIRRORS_STYLE} label="Based on access" className={className} />;
  }
  const team = teams.find((t) => t.id === scope);
  const isEveryone = Boolean(team?.isDefault);
  const style = isEveryone ? EVERYONE_STYLE : TEAM_STYLE;
  return <Pill style={style} label={team?.name || "Team"} className={className} />;
}
