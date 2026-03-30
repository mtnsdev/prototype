"use client";

import type { Team } from "@/types/teams";

type Props = {
  /** `private`, team id, or `mirrors_source` for intranet documents default */
  scope: "private" | "mirrors_source" | string;
  teams: Team[];
  className?: string;
};

const privateStyle = {
  background: "rgba(160,140,180,0.06)",
  color: "rgba(160,140,180,0.50)",
  border: "1px solid rgba(160,140,180,0.10)",
} as const;

export function ScopeBadge({ scope, teams, className = "" }: Props) {
  if (scope === "private") {
    return (
      <span className={`text-2xs px-1.5 py-0.5 rounded ${className}`.trim()} style={privateStyle}>
        Private
      </span>
    );
  }
  if (scope === "mirrors_source") {
    return (
      <span
        className={`text-2xs px-1.5 py-0.5 rounded ${className}`.trim()}
        style={{
          background: "rgba(140,160,180,0.06)",
          color: "rgba(140,160,180,0.45)",
          border: "1px solid rgba(140,160,180,0.10)",
        }}
      >
        Based on access
      </span>
    );
  }
  const team = teams.find((t) => t.id === scope);
  const isEveryone = Boolean(team?.isDefault);
  const style = {
    background: isEveryone ? "rgba(140,160,180,0.06)" : "rgba(140,170,160,0.06)",
    color: isEveryone ? "rgba(140,160,180,0.50)" : "rgba(140,170,160,0.50)",
    border: `1px solid ${isEveryone ? "rgba(140,160,180,0.10)" : "rgba(140,170,160,0.10)"}`,
  } as const;
  return (
    <span className={`text-2xs px-1.5 py-0.5 rounded ${className}`.trim()} style={style}>
      {team?.name || "Team"}
    </span>
  );
}
