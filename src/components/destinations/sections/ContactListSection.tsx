"use client";

import { Globe, Mail, Phone } from "lucide-react";
import type { DestinationContactRow } from "@/lib/destinationSectionModel";
import { cn } from "@/lib/utils";
import { destMuted } from "@/components/destinations/destinationStyles";
import { QuickCopyButton } from "@/components/destinations/shared/QuickCopyButton";
import { formatContactRowBlock } from "@/lib/destinationClipboard";

type Props = {
  contacts: DestinationContactRow[];
  destinationSlug: string;
};

export function ContactListSection({ contacts, destinationSlug }: Props) {
  if (contacts.length === 0) {
    return <p className={cn("text-sm", destMuted)}>Content coming soon.</p>;
  }

  return (
    <ul className="divide-y divide-border/40">
      {contacts.map((c) => {
        const { plain, html } = formatContactRowBlock(c);
        return (
          <li key={c.id} id={`item-${c.id}`} className="flex items-center gap-2.5 scroll-mt-28 py-1.5 px-1">
            {/* Avatar circle */}
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/60 text-[11px] font-medium text-muted-foreground">
              {contactInitials(c.name)}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13px] font-medium text-foreground">{c.name}</span>
                {c.organization ? (
                  <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">{c.organization}</span>
                ) : null}
                {c.subRegion ? (
                  <span className="shrink-0 rounded-full border border-border/40 px-1.5 py-px text-[10px] text-muted-foreground">
                    {c.subRegion}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {c.role ? <span className="truncate">{c.role}</span> : null}
                {c.email ? (
                  <a
                    href={`mailto:${c.email}`}
                    className="hidden items-center gap-0.5 text-brand-cta hover:underline sm:inline-flex"
                  >
                    <Mail className="size-2.5 opacity-70" aria-hidden />
                    {c.email}
                  </a>
                ) : null}
                {c.phone ? (
                  <span className="hidden items-center gap-0.5 sm:inline-flex">
                    <Phone className="size-2.5 opacity-70" aria-hidden />
                    {c.phone}
                  </span>
                ) : null}
              </div>
            </div>
            <QuickCopyButton
              plain={plain}
              html={html}
              itemId={c.id}
              destinationSlug={destinationSlug}
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </li>
        );
      })}
    </ul>
  );
}

function contactInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
