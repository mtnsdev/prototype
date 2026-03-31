"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/EmptyState";
import type { VICPersonaBundle } from "@/types/vic-profile";
import { ProfileSectionCard } from "../components/ProfileSectionCard";
import { AdvisoryBanner } from "../components/AdvisoryBanner";
import {
  confidenceRank,
  formatShortDate,
  upcomingKeyDates,
} from "@/lib/vic-profile-helpers";
import { cn } from "@/lib/utils";
import type { ActivityEvent } from "@/types/vic-profile";

function activityIconLabel(e: ActivityEvent): string {
  if (e.sourceIcon === "axus") return "A";
  if (e.sourceIcon === "tripsuite") return "T";
  if (e.sourceIcon === "virtuoso") return "V";
  return "·";
}

export function OverviewTab({
  bundle,
  vicPageId,
}: {
  bundle: VICPersonaBundle;
  vicPageId: string;
}) {
  const router = useRouter();
  const { profile, advisories, trips, domains, activity, keyDates } = {
    profile: bundle.profile,
    advisories: bundle.advisories.filter((a) => a.status === "active"),
    trips: bundle.trips,
    domains: bundle.domains,
    activity: bundle.activity,
    keyDates: bundle.profile.keyDates,
  };

  const upcoming = [...trips]
    .filter((t) => t.status === "confirmed")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 2);

  const allSignals = domains.flatMap((d) => d.signals);
  const quickPrefs = [...allSignals]
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const cr = confidenceRank(b.confidence) - confidenceRank(a.confidence);
      if (cr !== 0) return cr;
      return new Date(b.lastConfirmed).getTime() - new Date(a.lastConfirmed).getTime();
    })
    .slice(0, 5);

  const recent = [...activity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const keyUpcoming = upcomingKeyDates(keyDates);

  return (
    <div className="space-y-6">
      <ProfileSectionCard title="Client snapshot">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-2xs uppercase text-muted-foreground">Client since</p>
            <p className="text-sm text-foreground">{formatShortDate(profile.clientSince)}</p>
          </div>
          {profile.referredBy ? (
            <div>
              <p className="text-2xs uppercase text-muted-foreground">Referred by</p>
              <p className="text-sm text-foreground">
                {profile.referredBy.name}{" "}
                <span className="text-muted-foreground">({profile.referredBy.type})</span>
              </p>
            </div>
          ) : null}
          {profile.tags.length > 0 ? (
            <div className="min-w-0 flex-1">
              <p className="text-2xs uppercase text-muted-foreground">Tags</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {profile.tags.map((t) => (
                  <span key={t} className="rounded-full bg-muted/50 px-2 py-0.5 text-2xs text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </ProfileSectionCard>

      {advisories.length > 0 ? (
        <ProfileSectionCard title="Active advisories">
          <div className="space-y-3">
            {advisories.map((a) => (
              <AdvisoryBanner key={a.id} advisory={a} />
            ))}
          </div>
        </ProfileSectionCard>
      ) : null}

      <ProfileSectionCard title="Upcoming travel">
        {upcoming.length === 0 ? (
          <EmptyState
            icon={Plane}
            title="No upcoming travel"
            description="Create a proposal to get the next journey on the calendar."
            action={{
              label: "Open Active travel",
              onClick: () => {
                router.replace(`/dashboard/vics/${vicPageId}/advisor-profile?tab=activeTravel`);
              },
            }}
          />
        ) : (
          <ul className="space-y-2 text-sm">
            {upcoming.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                <span className="font-medium text-foreground">{t.name ?? t.id}</span>
                <span className="text-xs text-muted-foreground">
                  {formatShortDate(t.startDate)} – {formatShortDate(t.endDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ProfileSectionCard>

      <ProfileSectionCard title="Quick preferences">
        {quickPrefs.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Add preferences to build client intelligence"
            description="Capture signals in Intelligence or pin items from proposals and trips."
            action={{
              label: "Open Intelligence",
              onClick: () => {
                router.replace(`/dashboard/vics/${vicPageId}/advisor-profile?tab=intelligence`);
              },
            }}
          />
        ) : (
          <ul className="space-y-2">
            {quickPrefs.map((s) => (
              <li
                key={s.id}
                className={cn(
                  "rounded-lg border border-border px-3 py-2 text-sm",
                  s.confidence === "low" && "opacity-60"
                )}
              >
                <span className="text-foreground">{s.value}</span>
                <span className="ml-2 text-2xs uppercase text-muted-foreground">{s.confidence}</span>
              </li>
            ))}
          </ul>
        )}
      </ProfileSectionCard>

      <ProfileSectionCard title="Recent activity">
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((e) => (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-2xs text-muted-foreground">
                  {activityIconLabel(e)}
                </span>
                <div>
                  <p className="text-foreground">{e.title}</p>
                  <p className="text-2xs text-muted-foreground">
                    {formatShortDate(e.timestamp)} · {e.type.replace(/_/g, " ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ProfileSectionCard>

      {keyUpcoming.length > 0 ? (
        <ProfileSectionCard title="Key dates (next up)">
          <ul className="space-y-1 text-sm">
            {keyUpcoming.map((k) => (
              <li key={`${k.label}-${k.date}`} className="flex justify-between gap-2">
                <span className="text-foreground">{k.label}</span>
                <span className="text-muted-foreground">{formatShortDate(k.date)}</span>
              </li>
            ))}
          </ul>
        </ProfileSectionCard>
      ) : null}

      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={`/dashboard/vics/${vicPageId}`}>Classic VIC record</Link>
        </Button>
      </div>
    </div>
  );
}
