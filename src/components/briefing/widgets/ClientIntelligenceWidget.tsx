"use client";

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
import AppleWidgetCard from "../AppleWidgetCard";
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
  urgent: "text-red-400 bg-red-400/10 border-red-400/20",
  soon: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  upcoming: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

const URGENCY_LABEL: Record<ClientIntelligenceItem["urgency"], string> = {
  urgent: "Urgent",
  soon: "Soon",
  upcoming: "Upcoming",
};

type Props = {
  content: ClientIntelligenceContent;
  staggerIndex?: number;
};

export default function ClientIntelligenceWidget({ content, staggerIndex = 0 }: Props) {
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
      rightElement={urgentCount > 0 ? (
        <span className="text-xs font-medium text-red-400">{urgentCount} urgent</span>
      ) : undefined}
    >
      <div className="space-y-2">
        {top5.map((item) => {
          const Icon = ALERT_ICONS[item.alert_type] ?? Heart;
          return (
            <Link
              key={item.id}
              href={`/dashboard/vics/${item.vic_id}`}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04] group"
            >
              <div className={cn(
                "mt-0.5 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border",
                URGENCY_STYLES[item.urgency],
              )}>
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-[#C9A96E] transition-colors">
                    {item.vic_name}
                  </p>
                  <span className={cn(
                    "shrink-0 text-2xs px-1.5 py-0.5 rounded-full border font-medium",
                    URGENCY_STYLES[item.urgency],
                  )}>
                    {URGENCY_LABEL[item.urgency]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.title}</p>
                {item.suggested_action && (
                  <p className="text-2xs text-muted-foreground/60 mt-0.5 truncate italic">
                    → {item.suggested_action}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
        {moreCount > 0 && (
          <p className="text-xs text-muted-foreground/60 text-center pt-1">
            +{moreCount} more alert{moreCount > 1 ? "s" : ""}
          </p>
        )}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground/50 text-center py-4">
            No client alerts right now
          </p>
        )}
      </div>
    </AppleWidgetCard>
  );
}
