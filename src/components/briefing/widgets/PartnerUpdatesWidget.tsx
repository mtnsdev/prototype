"use client";

import { Handshake } from "lucide-react";
import type { PartnerUpdateContent } from "@/types/briefing";
import BriefingEmptyState from "../BriefingEmptyState";

const UPDATE_LABELS: Record<string, string> = {
  rate_change: "Rate change",
  new_program: "New program",
  policy_change: "Policy change",
  fam_trip: "FAM trip",
  training: "Training",
  event: "Event",
};

type Props = { content: PartnerUpdateContent };

export default function PartnerUpdatesWidget({ content }: Props) {
  const items = content.items ?? [];
  if (items.length === 0) {
    return (
      <BriefingEmptyState
        icon={<Handshake />}
        title="No partner updates"
        description="Rate changes, FAMs, training, and policy notes from suppliers will list here."
      />
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-border/80 bg-muted/12 p-3.5 transition-colors hover:bg-muted/18"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">{item.partner_name}</span>
            <span className="rounded-md bg-muted/45 px-1.5 py-0.5 text-xs text-muted-foreground">
              {UPDATE_LABELS[item.update_type] ?? item.update_type}
            </span>
            {item.action_required ? (
              <span className="rounded-md bg-[var(--muted-error-bg)] px-1.5 py-0.5 text-xs text-[var(--muted-error-text)]">
                Action required
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">{item.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
          {item.effective_date ? (
            <p className="mt-1 text-xs text-muted-foreground/75">
              {new Date(item.effective_date).toLocaleDateString()}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
