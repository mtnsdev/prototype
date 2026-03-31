"use client";

import type { ActionItem, Proposal, Trip } from "@/types/vic-profile";
import { ProfileSectionCard } from "../components/ProfileSectionCard";
import { TripCard } from "../components/TripCard";
import { CountdownBadge } from "../components/CountdownBadge";
import { formatShortDate } from "@/lib/vic-profile-helpers";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function proposalStatusClass(s: Proposal["status"]): string {
  if (s === "accepted") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  if (s === "declined" || s === "expired") return "border-border bg-muted/30 text-muted-foreground";
  if (s === "reviewing" || s === "sent") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  return "border-border bg-muted/25 text-foreground";
}

export function ActiveTravelTab({
  trips,
  proposals,
  actionItems,
}: {
  trips: Trip[];
  proposals: Proposal[];
  actionItems: ActionItem[];
}) {
  const now = new Date();
  const inPipeline = proposals.filter((p) =>
    ["draft", "sent", "reviewing"].includes(p.status)
  );
  const confirmed = [...trips]
    .filter((t) => t.status === "confirmed")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const msDay = 86400000;
  const departingSoon = confirmed.filter((t) => {
    const dep = new Date(t.startDate).getTime();
    const days = (dep - now.getTime()) / msDay;
    return days >= 0 && days <= 30;
  });

  const travelingNow = trips.filter((t) => {
    const a = new Date(t.startDate).getTime();
    const b = new Date(t.endDate).getTime();
    const n = now.getTime();
    return (t.status === "in_progress" || t.status === "confirmed") && n >= a && n <= b;
  });

  const postTrip = trips.filter((t) => {
    if (t.status !== "completed") return false;
    const end = new Date(t.endDate).getTime();
    const daysSince = (now.getTime() - end) / msDay;
    return daysSince >= 0 && daysSince <= 14;
  });

  const itemsForTrip = (tripId: string) => actionItems.filter((a) => a.tripId === tripId);

  return (
    <div className="space-y-6">
      <ProfileSectionCard title="In progress proposals">
        {inPipeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No proposals in the pipeline.</p>
        ) : (
          <ul className="space-y-3">
            {inPipeline.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm",
                  proposalStatusClass(p.status)
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{p.title}</span>
                  <span className="rounded-md border border-border/60 px-2 py-0.5 text-2xs uppercase">
                    {p.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.summary}</p>
                <p className="mt-1 text-2xs text-muted-foreground">
                  {p.daysSinceStatusChange} days since last status change
                </p>
              </li>
            ))}
          </ul>
        )}
      </ProfileSectionCard>

      <ProfileSectionCard title="Confirmed bookings">
        {confirmed.length === 0 ? (
          <p className="text-sm text-muted-foreground">No confirmed bookings.</p>
        ) : (
          <div className="space-y-3">
            {confirmed.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </div>
        )}
      </ProfileSectionCard>

      <ProfileSectionCard title="Departing soon (≤ 30 days)">
        {departingSoon.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing departing in the next 30 days.</p>
        ) : (
          <div className="space-y-4">
            {departingSoon.map((t) => {
              const items = itemsForTrip(t.id).filter((x) => x.status !== "completed");
              return (
                <div key={t.id} className="rounded-xl border border-amber-500/35 bg-amber-500/5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{t.name}</span>
                    <CountdownBadge departureIso={t.startDate} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatShortDate(t.startDate)} – {formatShortDate(t.endDate)}
                  </p>
                  <div className="mt-3">
                    <p className="text-2xs font-medium uppercase text-muted-foreground">Outstanding</p>
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No open action items.</p>
                    ) : (
                      <ul className="mt-1 space-y-1 text-sm">
                        {items.map((a) => (
                          <li
                            key={a.id}
                            className={cn(
                              "flex justify-between gap-2",
                              a.status === "overdue" && "text-amber-300"
                            )}
                          >
                            <span>{a.title}</span>
                            {a.dueDate ? (
                              <span className="text-2xs text-muted-foreground">
                                Due {formatShortDate(a.dueDate)}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ProfileSectionCard>

      {travelingNow.length > 0 ? (
        <ProfileSectionCard title="Currently traveling">
          <div className="space-y-2 text-sm">
            {travelingNow.map((t) => (
              <div key={t.id} className="rounded-lg border border-border bg-background p-3">
                <p className="font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  Through {formatShortDate(t.endDate)} · Today’s segments: see itinerary in Ops
                </p>
              </div>
            ))}
          </div>
        </ProfileSectionCard>
      ) : null}

      {postTrip.length > 0 ? (
        <ProfileSectionCard title="Post-trip follow-up (≤ 14 days)">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {postTrip.map((t) => (
              <li key={t.id} className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <span className="font-medium text-foreground">{t.name}</span> — returned{" "}
                {formatShortDate(t.endDate)}. Prompts: thank-you, feedback request, referral ask.
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary">
                    Log thank-you
                  </Button>
                  <Button type="button" size="sm" variant="outline">
                    Request feedback
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </ProfileSectionCard>
      ) : null}
    </div>
  );
}
