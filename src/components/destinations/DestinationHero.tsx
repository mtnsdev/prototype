"use client";

import { useEffect, useRef, useState } from "react";
import type { Destination } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { DestinationRemoteHeroImage } from "./DestinationRemoteHeroImage";
import { destMuted } from "./destinationStyles";
import { directoryHeroOrFallbackImageUrl } from "@/components/products/productDirectoryVisual";

export type DestinationHeroInlineEdit = {
  onPatch: (patch: Partial<Pick<Destination, "name" | "tagline" | "heroImage">>) => void;
};

type HeroEditField = null | "name" | "tagline" | "heroUrl";

type Props = {
  destination: Destination;
  /** Editor / split view: show preview badge. */
  mode?: "full" | "preview";
  /** Same layout as read-only; fields update the live preview in place. */
  inlineEdit?: DestinationHeroInlineEdit;
};

export function DestinationHero({ destination, mode = "full", inlineEdit }: Props) {
  const preview = mode === "preview" && !inlineEdit;
  const [heroSrc, setHeroSrc] = useState(() =>
    directoryHeroOrFallbackImageUrl(destination.slug, destination.heroImage ?? null),
  );
  const heroRetryRef = useRef(false);
  const [heroEditField, setHeroEditField] = useState<HeroEditField>(null);

  useEffect(() => {
    heroRetryRef.current = false;
    setHeroSrc(directoryHeroOrFallbackImageUrl(destination.slug, destination.heroImage ?? null));
  }, [destination.slug, destination.heroImage]);

  const ghostTitleClassesPhoto =
    "h-auto min-h-0 w-full border-0 bg-transparent px-0 py-0 text-2xl font-bold tracking-tight text-foreground shadow-none placeholder:text-foreground/45 focus-visible:ring-2 focus-visible:ring-brand-cta/35 md:text-3xl";
  const ghostTaglineClassesPhoto =
    "h-auto min-h-0 w-full border-0 bg-transparent px-0 py-0 text-sm leading-snug text-muted-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-brand-cta/35 md:text-base";

  const editing = inlineEdit != null;

  /**
   * Same DOM/spacing for both roles — admin only adds absolutely-positioned
   * pencil overlays so the layout (and chip wrapping) is pixel-identical.
   */
  const nameTagline = (
    <>
      <div className="group/hero-name relative">
        {editing && heroEditField === "name" ? (
          <>
            <Label htmlFor="dest-hero-inline-name" className="sr-only">
              Destination name
            </Label>
            <Input
              id="dest-hero-inline-name"
              value={destination.name}
              onChange={(e) => inlineEdit!.onPatch({ name: e.target.value })}
              onBlur={() => setHeroEditField(null)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setHeroEditField(null);
                }
              }}
              autoComplete="off"
              autoFocus
              className={ghostTitleClassesPhoto}
            />
          </>
        ) : (
          <>
            <h1
              className={cn(
                "text-2xl font-bold tracking-tight text-foreground drop-shadow-md md:text-3xl",
                editing && "cursor-text",
              )}
              onClick={editing ? () => setHeroEditField("name") : undefined}
            >
              {destination.name}
            </h1>
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 size-7 rounded-md border border-white/30 bg-background/70 text-foreground shadow-sm backdrop-blur-sm opacity-0 transition-opacity hover:bg-background/90 group-hover/hero-name:opacity-100 focus-visible:opacity-100"
                aria-label="Edit destination name"
                onClick={() => setHeroEditField("name")}
              >
                <Pencil className="size-3.5" aria-hidden />
              </Button>
            ) : null}
          </>
        )}
      </div>
      <div className="group/hero-tag relative mt-0.5">
        {editing && heroEditField === "tagline" ? (
          <>
            <Label htmlFor="dest-hero-inline-tagline" className="sr-only">
              Tagline
            </Label>
            <Input
              id="dest-hero-inline-tagline"
              value={destination.tagline}
              onChange={(e) => inlineEdit!.onPatch({ tagline: e.target.value })}
              onBlur={() => setHeroEditField(null)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setHeroEditField(null);
                }
              }}
              autoComplete="off"
              autoFocus
              className={ghostTaglineClassesPhoto}
            />
          </>
        ) : (
          <>
            <p
              className={cn(
                "max-w-2xl text-sm leading-snug md:text-base",
                destMuted,
                editing && "cursor-text",
              )}
              onClick={editing ? () => setHeroEditField("tagline") : undefined}
            >
              {destination.tagline}
            </p>
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 size-7 rounded-md border border-white/30 bg-background/70 text-foreground shadow-sm backdrop-blur-sm opacity-0 transition-opacity hover:bg-background/90 group-hover/hero-tag:opacity-100 focus-visible:opacity-100"
                aria-label="Edit tagline"
                onClick={() => setHeroEditField("tagline")}
              >
                <Pencil className="size-3.5" aria-hidden />
              </Button>
            ) : null}
          </>
        )}
      </div>
    </>
  );

  return (
    <section className="relative w-full overflow-hidden bg-card">
      <div className="group/hero-photo relative aspect-[2/1] min-h-[200px] w-full max-h-[min(42vh,380px)] overflow-hidden sm:min-h-[240px] sm:max-h-[min(45vh,420px)]">
          <DestinationRemoteHeroImage
            src={heroSrc}
            alt=""
            className="absolute inset-0 size-full object-cover object-center"
            sizes="(max-width: 768px) 100vw, min(100vw, 1280px)"
            priority={!preview}
            onBroken={() => {
              if (heroRetryRef.current) return;
              heroRetryRef.current = true;
              setHeroSrc(directoryHeroOrFallbackImageUrl(`${destination.slug}-hero`, null));
            }}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent"
            aria-hidden
          />

          {editing ? (
            <div className="absolute right-3 top-3 z-10 md:right-4 md:top-4">
              {heroEditField === "heroUrl" ? (
                <div className="flex items-center gap-1.5 rounded-md border border-border bg-background/95 px-2 py-1.5 shadow-sm backdrop-blur-sm">
                  <Label htmlFor="dest-hero-inline-url" className="sr-only">
                    Hero image URL
                  </Label>
                  <Input
                    id="dest-hero-inline-url"
                    type="url"
                    inputMode="url"
                    placeholder="https://…"
                    value={destination.heroImage ?? ""}
                    onChange={(e) => inlineEdit!.onPatch({ heroImage: e.target.value })}
                    onBlur={() => setHeroEditField(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape" || e.key === "Enter") {
                        e.preventDefault();
                        setHeroEditField(null);
                      }
                    }}
                    autoComplete="off"
                    autoFocus
                    className="h-7 w-64 max-w-[60vw] text-xs"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setHeroEditField("heroUrl")}
                  className="inline-flex items-center gap-1 rounded-md border border-white/25 bg-background/70 px-2 py-1 text-2xs font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background/90"
                >
                  <Pencil className="size-3" aria-hidden />
                  Change image
                </button>
              )}
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 pr-20 md:flex-row md:items-end md:justify-between md:p-5 md:pr-24">
            <div className="min-w-0 flex-1">
              {nameTagline}
            </div>
            {preview ? (
              <p className="shrink-0 rounded-md border border-border bg-background/90 px-2 py-1 text-2xs font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                Preview
              </p>
            ) : null}
          </div>
        </div>
    </section>
  );
}
