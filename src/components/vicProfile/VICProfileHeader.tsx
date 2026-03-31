"use client";

import ImageWithFallback from "@/components/ui/ImageWithFallback";
import type { VICProfile } from "@/types/vic-profile";
import { LTVBadge } from "./components/LTVBadge";

export function VICProfileHeader({ profile }: { profile: VICProfile }) {
  const name = `${profile.firstName} ${profile.lastName}`.trim();
  return (
    <div className="flex flex-wrap items-start gap-4">
      <ImageWithFallback
        fallbackType="avatar"
        alt={name}
        name={name}
        src={profile.photoUrl}
        fill={false}
        className="h-16 w-16 shrink-0 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{name}</h1>
          <LTVBadge tier={profile.ltvTier} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.location}
          {profile.occupation ? ` · ${profile.occupation}` : ""}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Primary advisor: {profile.primaryAdvisorName}
        </p>
      </div>
    </div>
  );
}
