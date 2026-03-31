"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreferenceDomain, SignalSource } from "@/types/vic-profile";
import { ProfileSectionCard } from "../components/ProfileSectionCard";
import { PreferenceSignalCard } from "../components/PreferenceSignalCard";
import { Button } from "@/components/ui/button";

type ConfFilter = "all" | "high" | "medium" | "low";
type SrcFilter = "all" | SignalSource["type"];

export function IntelligenceTab({ domains: initial }: { domains: PreferenceDomain[] }) {
  const [domains, setDomains] = useState(initial);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initial.map((d) => [d.id, true]))
  );
  useEffect(() => {
    setDomains(initial);
    setOpen(Object.fromEntries(initial.map((d) => [d.id, true])));
  }, [initial]);
  const [conf, setConf] = useState<ConfFilter>("all");
  const [src, setSrc] = useState<SrcFilter>("all");
  const [conflictsOnly, setConflictsOnly] = useState(false);

  const togglePin = (id: string) => {
    setDomains((prev) =>
      prev.map((d) => ({
        ...d,
        signals: d.signals.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)),
      }))
    );
  };

  const filteredDomains = useMemo(() => {
    return domains
      .map((d) => ({
        ...d,
        signals: d.signals.filter((s) => {
          if (conflictsOnly && !(s.conflicts ?? []).some((c) => !c.resolved)) return false;
          if (conf !== "all" && s.confidence !== conf) return false;
          if (src !== "all" && !s.sources.some((x) => x.type === src)) return false;
          return true;
        }),
      }))
      .filter((d) => d.signals.length > 0);
  }, [domains, conf, src, conflictsOnly]);

  if (initial.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No intelligence domains yet — run enrichment or add notes to generate signals.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ProfileSectionCard title="Filters">
        <div className="flex flex-wrap gap-2">
          {(["all", "high", "medium", "low"] as const).map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={conf === c ? "secondary" : "outline"}
              onClick={() => setConf(c)}
            >
              {c === "all" ? "All confidence" : c}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            ["all", "booking_data", "advisor_note", "client_statement", "itinerary_extraction", "program_data"] as const
          ).map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={src === t ? "secondary" : "outline"}
              onClick={() => setSrc(t)}
            >
              {t === "all" ? "All sources" : t.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={conflictsOnly}
            onChange={(e) => setConflictsOnly(e.target.checked)}
            className="rounded border-border"
          />
          Show conflicts only
        </label>
      </ProfileSectionCard>

      <div className="space-y-3">
        {filteredDomains.length === 0 ? (
          <p className="text-sm text-muted-foreground">No signals match the current filters.</p>
        ) : null}
        {filteredDomains.map((d) => (
          <div key={d.id} className="rounded-xl border border-border bg-background">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold"
              onClick={() => setOpen((o) => ({ ...o, [d.id]: !o[d.id] }))}
            >
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform", !open[d.id] && "-rotate-90")}
              />
              <span>{d.displayName}</span>
              <span className="text-2xs font-normal text-muted-foreground">({d.signals.length})</span>
            </button>
            {open[d.id] ? (
              <div className="space-y-2 border-t border-border p-4">
                {d.signals.map((s) => (
                  <PreferenceSignalCard key={s.id} signal={s} onTogglePin={togglePin} />
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
