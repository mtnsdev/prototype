"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Bookmark, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Destination } from "@/data/destinations";
import { useChatContext } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { destMuted } from "./destinationStyles";

type Props = {
  destination: Destination;
};

export function DestinationHero({ destination }: Props) {
  const { openClaire, startNewClaireConversation } = useChatContext();
  const [saved, setSaved] = useState(false);
  const hasImage = Boolean(destination.heroImage?.trim());

  const onAsk = useCallback(() => {
    startNewClaireConversation();
    openClaire();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "claire_destination_context",
        JSON.stringify({ slug: destination.slug, name: destination.name }),
      );
    }
  }, [destination.name, destination.slug, openClaire, startNewClaireConversation]);

  return (
    <section className="relative w-full overflow-hidden rounded-xl border border-border">
      <div className="relative h-48 w-full md:h-56">
        {hasImage ? (
          <Image
            src={destination.heroImage}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{destination.name}</h1>
            <p className={cn("mt-1 max-w-2xl text-sm md:text-base", destMuted)}>{destination.tagline}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-border bg-background/55 text-foreground backdrop-blur-sm hover:bg-accent"
              aria-pressed={saved}
              aria-label={saved ? "Remove saved destination" : "Save destination"}
              onClick={() => setSaved((s) => !s)}
            >
              <Bookmark className={cn("mr-1.5 size-4", saved && "fill-brand-cta text-brand-cta")} />
              {saved ? "Saved" : "Save"}
            </Button>
            <Button type="button" size="sm" variant="cta" onClick={onAsk} aria-label={`Ask about ${destination.name}`}>
              <MessageCircle className="mr-1.5 size-4" />
              Ask about {destination.name}
            </Button>
          </div>
        </div>
      </div>
      {destination.subRegions.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-border bg-card px-5 py-3">
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
