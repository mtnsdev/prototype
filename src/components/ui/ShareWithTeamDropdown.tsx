"use client";

import { useEffect, useRef, useState } from "react";
import type { Team } from "@/types/teams";

type Props = {
  onSelect: (teamId: string) => void;
  teams: Team[];
  trigger: React.ReactNode;
};

export function ShareWithTeamDropdown({ onSelect, teams, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)}
      >
        {trigger}
      </div>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-input rounded-xl shadow-2xl z-50 py-1">
          <p className="text-2xs text-muted-foreground uppercase tracking-wider px-3 py-2">Share with team</p>
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => {
                onSelect(team.id);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-foreground/88 hover:bg-white/5"
            >
              {team.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
