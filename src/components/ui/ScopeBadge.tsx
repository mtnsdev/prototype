"use client";

import type { Team } from "@/types/teams";

type Props = {
  scope: "private" | string;
  teams: Team[];
  className?: string;
};

export function ScopeBadge({ scope, teams, className = "" }: Props) {
  if (scope === "private") {
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded border bg-violet-500/5 text-violet-400/50 border-violet-500/10 ${className}`.trim()}
      >
        Private
      </span>
    );
  }
  const team = teams.find((t) => t.id === scope);
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded border bg-blue-500/5 text-blue-400/50 border-blue-500/10 ${className}`.trim()}
    >
      {team?.name || "Team"}
    </span>
  );
}
