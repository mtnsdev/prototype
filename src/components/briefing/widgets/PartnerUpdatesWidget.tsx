"use client";

import type { PartnerUpdateContent } from "@/types/briefing";
import { cn } from "@/lib/utils";

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
      <p className="text-sm text-muted-foreground/75 py-4">No partner updates.</p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-lg border border-border bg-white/[0.03] p-3"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground text-sm">{item.partner_name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">
              {UPDATE_LABELS[item.update_type] ?? item.update_type}
            </span>
            {item.action_required && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--muted-error-bg)] text-[var(--muted-error-text)]">
                Action required
              </span>
            )}
          </div>
          <p className="font-medium text-foreground text-sm mt-1">{item.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
          {item.effective_date && (
            <p className="text-xs text-muted-foreground/75 mt-1">
              {new Date(item.effective_date).toLocaleDateString()}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
