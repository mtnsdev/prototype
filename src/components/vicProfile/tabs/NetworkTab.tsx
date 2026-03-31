"use client";

import { useMemo } from "react";
import type { Relationship } from "@/types/vic-profile";
import { ProfileSectionCard } from "../components/ProfileSectionCard";
import { RelationshipCard } from "../components/RelationshipCard";

const ORDER: Relationship["type"][] = [
  "spouse",
  "child",
  "parent",
  "sibling",
  "extended_family",
  "assistant",
  "companion",
  "referral_source",
  "referred_client",
];

export function NetworkTab({ relationships }: { relationships: Relationship[] }) {
  const grouped = useMemo(() => {
    const m = new Map<Relationship["type"], Relationship[]>();
    for (const r of relationships) {
      const list = m.get(r.type) ?? [];
      list.push(r);
      m.set(r.type, list);
    }
    return m;
  }, [relationships]);

  if (relationships.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No household or network entries yet. Add relationships so itinerary builder can pre-fill companions.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {ORDER.filter((t) => (grouped.get(t) ?? []).length > 0).map((type) => (
        <ProfileSectionCard key={type} title={type.replace(/_/g, " ")}>
          <div className="grid gap-3 sm:grid-cols-2">
            {(grouped.get(type) ?? []).map((r) => (
              <RelationshipCard key={r.id} rel={r} />
            ))}
          </div>
        </ProfileSectionCard>
      ))}
    </div>
  );
}
