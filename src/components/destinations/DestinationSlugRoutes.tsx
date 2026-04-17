"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createStubDestination,
  destinationIsVisibleForViewer,
  getDestinationBySlug,
  type Destination,
} from "@/data/destinations";
import { useUser } from "@/contexts/UserContext";
import {
  DESTINATION_STORAGE_EVENT,
  listCustomDestinationSlugs,
  loadPublishedDestination,
} from "@/lib/destinationLocalEdits";
import { DestinationDetailClient } from "./DestinationDetailClient";
import { DestinationDetailSkeleton } from "./DestinationDetailSkeleton";
import { DestinationEditorDynamic } from "./editor/DestinationEditorDynamic";
import { Button } from "@/components/ui/button";

function DestinationAccessDenied() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="max-w-md text-sm text-muted-foreground">
        This destination guide isn&apos;t available for your agency. Contact an admin if you believe this is a mistake.
      </p>
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href="/dashboard/products/destinations">Back to destinations</Link>
      </Button>
    </div>
  );
}

function DestinationNotFound({ context }: { context: "view" | "edit" }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="max-w-md text-sm text-muted-foreground">
        {context === "edit"
          ? "This destination is not in the catalog and no saved guide was found for this link."
          : "No destination matches this address. It may have been removed or never created in this browser."}
      </p>
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href="/dashboard/products/destinations">Back to destinations</Link>
      </Button>
    </div>
  );
}

function useResolvedCustomDestination(slug: string, active: boolean): "pending" | Destination | null {
  const [state, setState] = useState<"pending" | Destination | null>(() => (active ? "pending" : null));

  useEffect(() => {
    if (!active) {
      setState(null);
      return;
    }
    const load = () => {
      if (!listCustomDestinationSlugs().includes(slug)) {
        setState(null);
        return;
      }
      const stub = createStubDestination(slug, slug, "");
      setState(loadPublishedDestination(slug, stub));
    };
    load();
    window.addEventListener(DESTINATION_STORAGE_EVENT, load);
    return () => window.removeEventListener(DESTINATION_STORAGE_EVENT, load);
  }, [slug, active]);

  return state;
}

/** When the slug is not in static `BY_SLUG`, load published data for user-created guides. */
export function DestinationDetailResolve({ slug }: { slug: string }) {
  const { user } = useUser();
  const agencyId = user?.agency_id ?? null;
  const staticCanon = getDestinationBySlug(slug);
  const resolved = useResolvedCustomDestination(slug, !staticCanon);

  if (staticCanon && !destinationIsVisibleForViewer(staticCanon, agencyId)) {
    return <DestinationAccessDenied />;
  }

  if (staticCanon) return <DestinationDetailClient canonical={staticCanon} />;
  if (resolved === "pending") return <DestinationDetailSkeleton />;
  if (!resolved) return <DestinationNotFound context="view" />;
  if (!destinationIsVisibleForViewer(resolved, agencyId)) return <DestinationAccessDenied />;
  return <DestinationDetailClient canonical={resolved} />;
}

export function DestinationEditorResolve({ slug }: { slug: string }) {
  const { user } = useUser();
  const agencyId = user?.agency_id ?? null;
  const staticCanon = getDestinationBySlug(slug);
  const resolved = useResolvedCustomDestination(slug, !staticCanon);

  if (staticCanon && !destinationIsVisibleForViewer(staticCanon, agencyId)) {
    return <DestinationAccessDenied />;
  }

  if (staticCanon) return <DestinationEditorDynamic canonical={staticCanon} />;
  if (resolved === "pending") {
    return (
      <div className="flex min-h-[40vh] flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }
  if (!resolved) return <DestinationNotFound context="edit" />;
  if (!destinationIsVisibleForViewer(resolved, agencyId)) return <DestinationAccessDenied />;
  return <DestinationEditorDynamic canonical={resolved} />;
}
