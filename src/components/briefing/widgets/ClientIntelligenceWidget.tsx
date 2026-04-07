"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Heart,
  Cake,
  ShieldAlert,
  Plane,
  PhoneOff,
  CreditCard,
  Gift,
} from "lucide-react";
import AppleWidgetCard, { type WidgetCardDensity } from "../AppleWidgetCard";
import BriefingEmptyState from "../BriefingEmptyState";
import { mergeWidgetHeaderRight } from "../mergeWidgetHeaderRight";
import type { ClientIntelligenceContent, ClientIntelligenceItem } from "@/types/briefing";
import { cn } from "@/lib/utils";

const ALERT_ICONS: Record<ClientIntelligenceItem["alert_type"], typeof Heart> = {
  birthday_upcoming: Cake,
  passport_expiring: ShieldAlert,
  trip_departure: Plane,
  no_contact_90d: PhoneOff,
  loyalty_expiring: CreditCard,
  anniversary: Gift,
};

const URGENCY_STYLES: Record<ClientIntelligenceItem["urgency"], string> = {
  urgent:
    "border-[var(--muted-error-border)] bg-[var(--muted-error-bg)] text-[var(--muted-error-text)]",
  soon:
    "border-[var(--muted-warning-border)] bg-[var(--muted-warning-bg)] text-[var(--muted-warning-text)]",
  upcoming:
    "border-[var(--muted-info-border)] bg-[var(--muted-info-bg)] text-[var(--muted-info-text)]",
};

const URGENCY_LABEL: Record<ClientIntelligenceItem["urgency"], string> = {
  urgent: "Urgent",
  soon: "Soon",
  upcoming: "Upcoming",
};

type Props = {
  content: ClientIntelligenceContent;
  staggerIndex?: number;
  cardDensity?: WidgetCardDensity;
  layoutMenu?: ReactNode;
};

export default function ClientIntelligenceWidget({
  content,
  staggerIndex = 0,
  cardDensity,
  layoutMenu,
}: Props) {
  const items = content.items ?? [];
  const urgentCount = items.filter((i) => i.urgency === "urgent").length;
  const sorted = [...items].sort((a, b) => {
    const order = { urgent: 0, soon: 1, upcoming: 2 };
    return (order[a.urgency] ?? 2) - (order[b.urgency] ?? 2);
  });
  const top5 = sorted.slice(0, 5);
  const moreCount = items.length - 5;

  return (
    <AppleWidgetCard
      title="VIC Intelligence"
      accent="rose"
      icon={<Heart size={20} />}
      staggerIndex={staggerIndex}
      density={cardDensity ?? "default"}
      rightElement={mergeWidgetHeaderRight(
        urgentCount > 0 ? (
          <span className="text-xs font-medium text-foreground/85">{urgentCount} urgent</span>
        ) : undefined,
        layoutMenu,
      )}
    >
      {items.length === 0 ? (
        <BriefingEmptyState
          icon={<Heart />}
          title="No client alerts"
          description="Birthdays, trips, and follow-ups for your VICs will surface here."
          action={
            <Link
              href="/dashboard/vics"
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              Open VICs
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {top5.map((item) => {
            const Icon = ALERT_ICONS[item.alert_type] ?? Heart;
            return (
              <Link
                key={item.id}
                href={`/dashboard/vics/${item.vic_id}`}
                className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                    URGENCY_STYLES[item.urgency],
                  )}
                >
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                      {item.vic_name}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-1.5 py-0.5 text-2xs font-medium",
                        URGENCY_STYLES[item.urgency],
                      )}
                    >
                      {URGENCY_LABEL[item.urgency]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.title}</p>
                  {item.suggested_action ? (
                    <p className="mt-0.5 truncate text-2xs italic text-muted-foreground/60">
                      → {item.suggested_action}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
          {moreCount > 0 ? (
            <p className="pt-1 text-center text-xs text-muted-foreground/60">
              +{moreCount} more alert{moreCount > 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
      )}
    </AppleWidgetCard>
  );
}
