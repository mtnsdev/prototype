"use client";

import { useEffect, useState } from "react";
import type { Destination } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { DestinationRemoteHeroImage } from "./DestinationRemoteHeroImage";
import { destMuted } from "./destinationStyles";

type Props = {
  destination: Destination;
  /** Editor / split view: show preview badge. */
  mode?: "full" | "preview";
};

export function DestinationHero({ destination, mode = "full" }: Props) {
  const preview = mode === "preview";
  const raw = destination.heroImage?.trim() ?? "";
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    setImgFailed(false);
  }, [raw]);
  const showPhoto = raw.length > 0 && !imgFailed;

  return (
    <section className="relative w-full overflow-hidden rounded-xl border border-border bg-card">
      {showPhoto ? (
        <div className="relative aspect-[5/3] w-full min-h-[200px] sm:aspect-[21/9] sm:min-h-[240px]">
          <DestinationRemoteHeroImage
            src={raw}
            alt=""
            className="absolute inset-0 size-full"
            sizes="(max-width: 768px) 100vw, min(100vw, 1280px)"
            priority={!preview}
            onBroken={() => setImgFailed(true)}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground drop-shadow-sm md:text-3xl">
                {destination.name}
              </h1>
              <p className={cn("mt-1 max-w-2xl text-sm md:text-base", destMuted)}>{destination.tagline}</p>
            </div>
            {preview ? (
              <p className="shrink-0 rounded-md border border-border bg-background/90 px-2 py-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                Preview
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{destination.name}</h1>
            <p className={cn("mt-1 max-w-2xl text-sm md:text-base", destMuted)}>{destination.tagline}</p>
          </div>
          {preview ? (
            <p className="shrink-0 rounded-md border border-border bg-background/80 px-2 py-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              Preview
            </p>
          ) : null}
        </div>
      )}
      {destination.subRegions.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-border bg-muted/20 px-5 py-3">
          {destination.subRegions.map((r) => (
            <span
              key={r}
              className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
            >
              {r}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
