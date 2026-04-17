"use client";

import type { DMCPartner } from "@/data/destinations";
import { DMCPartnerCard } from "@/components/destinations/DMCPartnerCard";
import { stableItemId } from "@/lib/stableDestinationIds";

type Props = {
  partners: DMCPartner[];
  destinationSlug: string;
  sectionId: string;
};

export function PartnerCardsSection({ partners, destinationSlug, sectionId }: Props) {
  if (partners.length === 0) {
    return null;
  }
  return (
    <div className="space-y-3">
      {partners.map((p, i) => {
        const key = p.productId ?? `${p.name}-${i}`;
        const itemId = stableItemId(destinationSlug, sectionId, key);
        return (
          <DMCPartnerCard
            key={itemId}
            partner={p}
            defaultOpen={i === 0}
            itemId={itemId}
            destinationSlug={destinationSlug}
          />
        );
      })}
    </div>
  );
}
