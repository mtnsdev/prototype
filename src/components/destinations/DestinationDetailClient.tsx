"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Destination } from "@/data/destinations";
import { usePermissions } from "@/hooks/usePermissions";
import {
  DESTINATION_STORAGE_EVENT,
  destinationPublishedStorageKey,
  hasDraftDestination,
  loadPublishedDestination,
} from "@/lib/destinationLocalEdits";
import { Button } from "@/components/ui/button";
import { DestinationDetailView } from "./DestinationDetailView";
import { Pencil } from "lucide-react";

type Props = {
  canonical: Destination;
};

export function DestinationDetailClient({ canonical }: Props) {
  const { isAdmin } = usePermissions();
  const slug = canonical.slug;
  const [destination, setDestination] = useState<Destination>(() => loadPublishedDestination(slug, canonical));
  const [hasDraft, setHasDraft] = useState(() =>
    typeof window !== "undefined" ? hasDraftDestination(slug) : false,
  );

  const refreshPublished = useCallback(() => {
    setDestination(loadPublishedDestination(slug, canonical));
    setHasDraft(hasDraftDestination(slug));
  }, [slug, canonical]);

  useEffect(() => {
    refreshPublished();
  }, [refreshPublished]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === destinationPublishedStorageKey(slug)) refreshPublished();
    };
    window.addEventListener(DESTINATION_STORAGE_EVENT, refreshPublished);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(DESTINATION_STORAGE_EVENT, refreshPublished);
      window.removeEventListener("storage", onStorage);
    };
  }, [slug, refreshPublished]);

  return (
    <DestinationDetailView
      destination={destination}
      headerAside={
        isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            {hasDraft ? (
              <span className="rounded-md border border-brand-cta/30 bg-brand-cta/10 px-2 py-1 text-2xs font-medium text-brand-cta">
                Unpublished draft
              </span>
            ) : null}
            <Button type="button" variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={`/dashboard/products/destinations/${slug}/edit`}>
                <Pencil className="size-3.5" aria-hidden />
                Edit destination
              </Link>
            </Button>
          </div>
        ) : null
      }
    />
  );
}
