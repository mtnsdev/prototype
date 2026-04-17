"use client";

import { Globe, Mail, Phone } from "lucide-react";
import type { DestinationContactRow } from "@/lib/destinationSectionModel";
import { cn } from "@/lib/utils";
import { destCardClass, destMuted, destMuted2 } from "@/components/destinations/destinationStyles";
import { QuickCopyButton } from "@/components/destinations/shared/QuickCopyButton";
import { formatContactRowBlock } from "@/lib/destinationClipboard";

type Props = {
  contacts: DestinationContactRow[];
  destinationSlug: string;
};

export function ContactListSection({ contacts, destinationSlug }: Props) {
  if (contacts.length === 0) {
    return <p className={cn("text-sm", destMuted)}>No contacts listed yet.</p>;
  }

  return (
    <div className="space-y-3">
      {contacts.map((c) => {
        const { plain, html } = formatContactRowBlock(c);
        return (
          <div key={c.id} id={`item-${c.id}`} className={cn(destCardClass("scroll-mt-28"), "p-4")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{c.name}</h3>
                  {c.subRegion ? (
                    <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {c.subRegion}
                    </span>
                  ) : null}
                </div>
                {c.organization ? <p className={cn("mt-0.5 text-xs", destMuted2)}>{c.organization}</p> : null}
                {c.role ? <p className={cn("mt-1 text-sm", destMuted)}>{c.role}</p> : null}
                {c.description ? (
                  <p className={cn("mt-2 text-sm", destMuted)}>{c.description}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      className="inline-flex items-center gap-1 text-brand-cta underline-offset-4 hover:underline"
                    >
                      <Mail className="size-3.5 shrink-0 opacity-80" aria-hidden />
                      {c.email}
                    </a>
                  ) : null}
                  {c.phone ? (
                    <span className={cn("inline-flex items-center gap-1", destMuted)}>
                      <Phone className="size-3.5 shrink-0" aria-hidden />
                      {c.phone}
                    </span>
                  ) : null}
                  {c.website ? (
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand-cta underline-offset-4 hover:underline"
                    >
                      Website
                      <Globe className="size-3.5 shrink-0 opacity-80" aria-hidden />
                    </a>
                  ) : null}
                </div>
                {c.links.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.links.map((l, idx) => (
                      <a
                        key={`${c.id}-${l.label}-${idx}`}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-brand-cta transition-colors hover:border-brand-cta/40 hover:bg-muted"
                      >
                        <Globe className="size-3.5 shrink-0" aria-hidden />
                        {l.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
              <QuickCopyButton
                plain={plain}
                html={html}
                itemId={c.id}
                destinationSlug={destinationSlug}
                className="shrink-0"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
