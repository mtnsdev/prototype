"use client";

import { useEffect, useState } from "react";
import type { Destination } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { DestinationRemoteHeroImage } from "./DestinationRemoteHeroImage";
import { destMuted } from "./destinationStyles";

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
  /** All unique tags across the page (for filter chip bar). */
  allTags?: string[];
  /** Currently active tag filters. */
  activeTagFilters?: ReadonlySet<string>;
  /** Toggle a tag filter on/off. */
  onToggleTagFilter?: (tag: string) => void;
};

/** Sub-region tag chips — clickable when filter props are provided, static otherwise. */
function DestinationSubRegions({
  tags,
  variant,
  activeFilters,
  onToggle,
}: {
  tags: string[];
  variant: "overlay" | "plain";
  activeFilters?: ReadonlySet<string>;
  onToggle?: (tag: string) => void;
}) {
  if (tags.length < 2) return null;
  const interactive = activeFilters != null && onToggle != null;

  const baseOverlay = "inline-flex rounded-full border px-2.5 py-0.5 text-2xs font-medium shadow-sm backdrop-blur-sm transition-colors";
  const basePlain = "inline-flex rounded-full border px-2.5 py-0.5 text-2xs font-medium transition-colors";
  const activeClass = "border-brand-cta/40 bg-brand-cta/10 text-brand-cta";
  const inactiveOverlay = "border-white/25 bg-background/65 text-foreground hover:bg-background/80";
  const inactivePlain = "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60";

  return (
    <div className="mt-2 flex flex-wrap gap-1.5" role={interactive ? "group" : undefined} aria-label={interactive ? "Filter by sub-region" : "Countries and regions covered"}>
      {tags.map((tag) => {
        const on = interactive && activeFilters.has(tag);
        if (interactive) {
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              className={cn(
                variant === "overlay" ? baseOverlay : basePlain,
                on ? activeClass : variant === "overlay" ? inactiveOverlay : inactivePlain,
              )}
            >
              {tag}
            </button>
          );
        }
        return (
          <span
            key={tag}
            className={
              variant === "overlay"
                ? "inline-flex rounded-full border border-white/25 bg-background/65 px-2.5 py-0.5 text-2xs font-medium text-foreground shadow-sm backdrop-blur-sm"
                : "inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-2xs font-medium text-muted-foreground"
            }
          >
            {tag}
          </span>
        );
      })}
    </div>
  );
}

export function DestinationHero({ destination, mode = "full", inlineEdit, allTags, activeTagFilters, onToggleTagFilter }: Props) {
  const preview = mode === "preview" && !inlineEdit;
  const raw = destination.heroImage?.trim() ?? "";
  const [imgFailed, setImgFailed] = useState(false);
  const [heroEditField, setHeroEditField] = useState<HeroEditField>(null);

  useEffect(() => {
    setImgFailed(false);
  }, [raw]);

  const showPhoto = raw.length > 0 && !imgFailed;

  const tags = allTags && allTags.length > 0 ? allTags : (destination.subRegions ?? []);

  const nameTaglineRead = (
    <>
      <h1 className="text-xl font-bold tracking-tight text-foreground drop-shadow-sm md:text-2xl">
        {destination.name}
      </h1>
      <p className={cn("mt-0.5 max-w-2xl text-sm leading-snug md:text-[0.9375rem]", destMuted)}>
        {destination.tagline}
      </p>
      <DestinationSubRegions tags={tags} variant="overlay" activeFilters={activeTagFilters} onToggle={onToggleTagFilter} />
    </>
  );

  const ghostTitleClassesPhoto =
    "h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-xl font-bold tracking-tight text-foreground shadow-none placeholder:text-foreground/45 focus-visible:ring-2 focus-visible:ring-brand-cta/35 md:text-2xl";
  const ghostTaglineClassesPhoto =
    "h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-sm leading-snug text-muted-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-brand-cta/35 md:text-[0.9375rem]";

  const ghostTitleClassesPlain =
    "h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-2xl font-bold tracking-tight text-foreground shadow-none placeholder:text-foreground/45 focus-visible:ring-2 focus-visible:ring-brand-cta/35 md:text-3xl";
  const ghostTaglineClassesPlain =
    "h-auto min-h-0 border-0 bg-transparent px-0 py-0 text-sm text-muted-foreground shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-brand-cta/35 md:text-base";

  const nameTaglineGhostPhoto = (
    <div className="min-w-0 space-y-1 pr-12 md:pr-16">
      <div className="group/hero-name relative flex items-start gap-1">
        {heroEditField === "name" ? (
          <>
            <Label htmlFor="dest-hero-inline-name" className="sr-only">
              Destination name
            </Label>
            <Input
              id="dest-hero-inline-name"
              value={destination.name}
              onChange={(e) => inlineEdit?.onPatch({ name: e.target.value })}
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
            <h1 className="min-w-0 flex-1 text-xl font-bold tracking-tight text-foreground drop-shadow-sm md:text-2xl">
              {destination.name}
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:bg-muted/80 hover:text-foreground group-hover/hero-name:opacity-100 focus-visible:opacity-100"
              aria-label="Edit destination name"
              onClick={() => setHeroEditField("name")}
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
          </>
        )}
      </div>
      <div className="group/hero-tag relative flex items-start gap-1">
        {heroEditField === "tagline" ? (
          <>
            <Label htmlFor="dest-hero-inline-tagline" className="sr-only">
              Tagline
            </Label>
            <Input
              id="dest-hero-inline-tagline"
              value={destination.tagline}
              onChange={(e) => inlineEdit?.onPatch({ tagline: e.target.value })}
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
                "min-w-0 flex-1 text-sm leading-snug md:text-[0.9375rem]",
                destMuted,
              )}
            >
              {destination.tagline}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:bg-muted/80 hover:text-foreground group-hover/hero-tag:opacity-100 focus-visible:opacity-100"
              aria-label="Edit tagline"
              onClick={() => setHeroEditField("tagline")}
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
          </>
        )}
      </div>
      <DestinationSubRegions tags={tags} variant="overlay" activeFilters={activeTagFilters} onToggle={onToggleTagFilter} />
    </div>
  );

  const nameTaglineGhostPlain = (
    <div className="space-y-2">
      <div className="group/hero-name-plain relative flex items-start gap-1">
        {heroEditField === "name" ? (
          <>
            <Label htmlFor="dest-hero-inline-name-plain" className="sr-only">
              Destination name
            </Label>
            <Input
              id="dest-hero-inline-name-plain"
              value={destination.name}
              onChange={(e) => inlineEdit?.onPatch({ name: e.target.value })}
              onBlur={() => setHeroEditField(null)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setHeroEditField(null);
                }
              }}
              autoComplete="off"
              autoFocus
              className={ghostTitleClassesPlain}
            />
          </>
        ) : (
          <>
            <h1 className="min-w-0 flex-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {destination.name}
            </h1>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-1 size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:bg-muted/80 hover:text-foreground group-hover/hero-name-plain:opacity-100 focus-visible:opacity-100"
              aria-label="Edit destination name"
              onClick={() => setHeroEditField("name")}
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
          </>
        )}
      </div>
      <div className="group/hero-tag-plain relative flex items-start gap-1">
        {heroEditField === "tagline" ? (
          <>
            <Label htmlFor="dest-hero-inline-tagline-plain" className="sr-only">
              Tagline
            </Label>
            <Input
              id="dest-hero-inline-tagline-plain"
              value={destination.tagline}
              onChange={(e) => inlineEdit?.onPatch({ tagline: e.target.value })}
              onBlur={() => setHeroEditField(null)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setHeroEditField(null);
                }
              }}
              autoComplete="off"
              autoFocus
              className={ghostTaglineClassesPlain}
            />
          </>
        ) : (
          <>
            <p className={cn("min-w-0 flex-1 text-sm md:text-base", destMuted)}>{destination.tagline}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:bg-muted/80 hover:text-foreground group-hover/hero-tag-plain:opacity-100 focus-visible:opacity-100"
              aria-label="Edit tagline"
              onClick={() => setHeroEditField("tagline")}
            >
              <Pencil className="size-3.5" aria-hidden />
            </Button>
          </>
        )}
      </div>
      <DestinationSubRegions tags={tags} variant="plain" activeFilters={activeTagFilters} onToggle={onToggleTagFilter} />
    </div>
  );

  return (
    <section className="relative w-full overflow-hidden bg-card">
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
            <div className="min-w-0 flex-1">
              {inlineEdit ? nameTaglineGhostPhoto : nameTaglineRead}
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
          <div className="min-w-0 flex-1">
            {inlineEdit ? (
              nameTaglineGhostPlain
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{destination.name}</h1>
                <p className={cn("mt-1 max-w-2xl text-sm md:text-base", destMuted)}>{destination.tagline}</p>
                <DestinationSubRegions tags={tags} variant="plain" activeFilters={activeTagFilters} onToggle={onToggleTagFilter} />
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
          {heroEditField === "heroUrl" ? (
            <>
              <Label
                htmlFor="dest-hero-inline-url"
                className="text-2xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Hero image URL
              </Label>
              <Input
                id="dest-hero-inline-url"
                type="url"
                inputMode="url"
                placeholder="https://…"
                value={destination.heroImage ?? ""}
                onChange={(e) => inlineEdit.onPatch({ heroImage: e.target.value })}
                onBlur={() => setHeroEditField(null)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setHeroEditField(null);
                  }
                }}
                autoComplete="off"
                autoFocus
                className="mt-1.5 h-9 text-sm"
              />
            </>
          ) : (
            <button
              type="button"
              className="text-2xs font-medium uppercase tracking-wide text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              onClick={() => setHeroEditField("heroUrl")}
            >
              Edit hero image URL
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
