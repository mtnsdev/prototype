"use client";

import { Gift, MessageCircle } from "lucide-react";
import type { GiftLog, SpecialRequest, TouchPoint } from "@/types/vic-profile";
import { ProfileSectionCard } from "../components/ProfileSectionCard";
import { EngagementBadge } from "../components/EngagementBadge";
import { formatCurrency, formatShortDate } from "@/lib/vic-profile-helpers";

export function CommunicationsTab({
  touchPoints,
  specialRequests,
  giftLogs,
}: {
  touchPoints: TouchPoint[];
  specialRequests: SpecialRequest[];
  giftLogs: GiftLog[];
}) {
  const sortedTouch = [...touchPoints].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">Engagement health</span>
        <EngagementBadge touchPoints={touchPoints} />
      </div>

      <ProfileSectionCard title="Touchpoints">
        {sortedTouch.length === 0 ? (
          <p className="text-sm text-muted-foreground">No touchpoints logged.</p>
        ) : (
          <ul className="space-y-2">
            {sortedTouch.map((t) => (
              <li key={t.id} className="flex gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{t.title}</p>
                  <p className="text-2xs text-muted-foreground">
                    {formatShortDate(t.date)} · {t.type} · {t.direction}
                    {t.contactPerson ? ` · via ${t.contactPerson}` : ""}
                  </p>
                  {t.details ? <p className="mt-1 text-xs text-muted-foreground">{t.details}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ProfileSectionCard>

      <ProfileSectionCard title="Special requests">
        {specialRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No special requests.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {specialRequests.map((s) => (
              <li key={s.id} className="rounded-lg border border-border px-3 py-2">
                <p className="text-foreground">{s.request}</p>
                <p className="text-2xs text-muted-foreground">
                  {formatShortDate(s.date)} · {s.status} · {s.source}
                </p>
              </li>
            ))}
          </ul>
        )}
      </ProfileSectionCard>

      <ProfileSectionCard title="Gifts">
        {giftLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No gifts logged.</p>
        ) : (
          <ul className="space-y-2">
            {giftLogs.map((g) => (
              <li key={g.id} className="flex gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <Gift className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-foreground">{g.description}</p>
                  <p className="text-2xs text-muted-foreground">
                    {formatShortDate(g.date)}
                    {g.propertyOrPartner ? ` · ${g.propertyOrPartner}` : ""}
                    {g.cost != null ? ` · ${formatCurrency(g.cost)}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ProfileSectionCard>
    </div>
  );
}
