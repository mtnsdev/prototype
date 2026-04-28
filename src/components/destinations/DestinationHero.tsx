"use client";

import { useEffect, useState } from "react";
import type { Destination } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DestinationRemoteHeroImage } from "./DestinationRemoteHeroImage";
import { destMuted } from "./destinationStyles";

export type DestinationHeroInlineEdit = {
  onPatch: (patch: Partial<Pick<Destination, "name" | "tagline" | "heroImage">>) => void;
};

type Props = {
  destination: Destination;
  /** Editor / split view: show preview badge. */
  mode?: "full" | "preview";
  /** Same layout as read-only; fields update the live preview in place. */
  inlineEdit?: DestinationHeroInlineEdit;
};

export function DestinationHero({ destination, mode = "full", inlineEdit }: Props) {
  const preview = mode === "preview" && !inlineEdit;
  const raw = destination.heroImage?.trim() ?? "";
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    setImgFailed(false);
  }, [raw]);
  const showPhoto = raw.length > 0 && !imgFailed;

  const nameTaglineRead = (
    <>
      <h1 className="text-xl font-bold tracking-tight text-foreground drop-shadow-sm md:text-2xl">
        {destination.name}
      </h1>
      <p className={cn("mt-0.5 max-w-2xl text-sm leading-snug md:text-[0.9375rem]", destMuted)}>
        {destination.tagline}
      </p>
    </>
  );

  const nameTaglineInline = (
    <div className="min-w-0 space-y-1 pr-12 md:pr-16">
      <Label htmlFor="dest-hero-inline-name" className="sr-only">
        Destination name
      </Label>
      <Input
        id="dest-hero-inline-name"
        value={destination.name}
        onChange={(e) => inlineEdit?.onPatch({ name: e.target.value })}
        autoComplete="off"
        className="h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-xl font-bold tracking-tight text-foreground shadow-none placeholder:text-foreground/45 focus-visible:ring-2 focus-visible:ring-brand-cta/35 md:text-2xl"
      />
      <Label htmlFor="dest-hero-inline-tagline" className="sr-only">
        Tagline
      </Label>
      <Input
        id="dest-hero-inline-tagline"
        value={destination.tagline}
        onChange={(e) => inlineEdit?.onPatch({ tagline: e.target.value })}
        className="h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-sm leading-snug text-muted-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-brand-cta/35 md:text-[0.9375rem]"
      />
    </div>
  );

  return (
    <section className="relative w-full overflow-hidden rounded-xl border border-border bg-card">
      {showPhoto ? (
        <div className="relative aspect-[2/1] min-h-[200px] w-full max-h-[min(42vh,380px)] overflow-hidden sm:min-h-[240px] sm:max-h-[min(45vh,420px)]">
          <DestinationRemoteHeroImage
            src={raw}
            alt=""
            className="absolute inset-0 size-full object-cover object-center"
            sizes="(max-width: 768px) 100vw, min(100vw, 1280px)"
            priority={!preview}
            onBroken={() => setImgFailed(true)}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 md:flex-row md:items-end md:justify-between md:p-5">
            <div className="min-w-0 flex-1">{inlineEdit ? nameTaglineInline : nameTaglineRead}</div>
            {preview ? (
              <p className="shrink-0 rounded-md border border-border bg-background/90 px-2 py-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                Preview
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1">
            {inlineEdit ? (
              <div className="space-y-2">
                <Label htmlFor="dest-hero-inline-name-plain" className="sr-only">
                  Destination name
                </Label>
                <Input
                  id="dest-hero-inline-name-plain"
                  value={destination.name}
                  onChange={(e) => inlineEdit.onPatch({ name: e.target.value })}
                  autoComplete="off"
                  className="h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-2xl font-bold tracking-tight text-foreground shadow-none placeholder:text-foreground/45 focus-visible:ring-2 focus-visible:ring-brand-cta/35 md:text-3xl"
                />
                <Label htmlFor="dest-hero-inline-tagline-plain" className="sr-only">
                  Tagline
                </Label>
                <Input
                  id="dest-hero-inline-tagline-plain"
                  value={destination.tagline}
                  onChange={(e) => inlineEdit.onPatch({ tagline: e.target.value })}
                  className="h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-sm text-muted-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-brand-cta/35 md:text-base"
                />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{destination.name}</h1>
                <p className={cn("mt-1 max-w-2xl text-sm md:text-base", destMuted)}>{destination.tagline}</p>
              </>
            )}
          </div>
          {preview ? (
            <p className="shrink-0 rounded-md border border-border bg-background/80 px-2 py-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              Preview
            </p>
          ) : null}
        </div>
      )}
      {inlineEdit ? (
        <div className="border-t border-border bg-muted/15 px-4 py-3 sm:px-5">
          <Label htmlFor="dest-hero-inline-url" className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
            Hero image URL
          </Label>
          <Input
            id="dest-hero-inline-url"
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={destination.heroImage ?? ""}
            onChange={(e) => inlineEdit.onPatch({ heroImage: e.target.value })}
            autoComplete="off"
            className="mt-1.5 h-9 text-sm"
          />
        </div>
      ) : null}
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
