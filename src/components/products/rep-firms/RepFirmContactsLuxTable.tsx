"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import type { RepFirmContactRow } from "@/types/rep-firm";
import { Button } from "@/components/ui/button";
import { emailsForRepFirmContact, phonesForRepFirmContact } from "@/lib/repFirmContactChannels";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";
import {
  listTableClass,
  listTdClass,
  listThClass,
  listTheadRowClass,
  listTbodyRowClass,
} from "@/lib/list-ui";

function RepFirmContactEmailCell({
  contact,
  compact,
}: {
  contact: RepFirmContactRow;
  compact?: boolean;
}) {
  const toast = useToast();
  const emails = emailsForRepFirmContact(contact);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(emails.join("\n"));
      toast({ title: "Email copied", tone: "success" });
    } catch {
      toast({ title: "Could not copy", tone: "destructive" });
    }
  };

  if (emails.length === 0) {
    return <span className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-sm")}>—</span>;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
        {emails.map((email, i) => (
          <a
            key={`${email}-${i}`}
            href={`mailto:${email}`}
            className={cn(
              "w-full min-w-0 break-words [overflow-wrap:anywhere] text-[#B07A5B] underline-offset-2 hover:underline",
              compact ? "text-[10px]" : "text-2xs"
            )}
          >
            {email}
          </a>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          "h-7 w-7 shrink-0 self-start text-muted-foreground hover:text-foreground sm:mt-0.5",
          compact && "h-6 w-6"
        )}
        aria-label={emails.length > 1 ? "Copy emails" : "Copy email"}
        onClick={() => void copyEmail()}
      >
        <Copy className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
      </Button>
    </div>
  );
}

export type RepFirmContactsLuxReadonlyTableProps = {
  contacts: RepFirmContactRow[];
  /** Shown in copy-full text and optional footer. */
  firmName?: string;
  /** When set, show only first N rows until expanded. */
  maxRows?: number;
  /** Small footnote, e.g. firm attribution. */
  attribution?: string;
  compact?: boolean;
  /** Default: "{n} Contacts" */
  heading?: string | null;
  className?: string;
};

/**
 * Lux Pages–style line table: Name, Title, Phone, Email (mailto + copy). No photos.
 */
export function RepFirmContactsLuxReadonlyTable({
  contacts,
  firmName,
  maxRows,
  attribution,
  compact,
  heading,
  className,
}: RepFirmContactsLuxReadonlyTableProps) {
  const [showAll, setShowAll] = useState(false);
  if (contacts.length === 0) return null;

  const limit = maxRows != null && !showAll ? maxRows : undefined;
  const visible = limit != null ? contacts.slice(0, limit) : contacts;
  const hidden = maxRows != null ? Math.max(0, contacts.length - maxRows) : 0;

  const h =
    heading === null
      ? null
      : heading ?? `${contacts.length} Contact${contacts.length !== 1 ? "s" : ""}`;

  return (
    <div className={cn("w-full min-w-0 max-w-full", className)}>
      {h ? (
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <p
            className={cn(
              "font-semibold text-foreground",
              compact ? "text-[11px]" : "text-xs"
            )}
          >
            {h}
          </p>
        </div>
      ) : null}
      <div className={cn("min-w-0 max-w-full overflow-x-auto overscroll-x-contain", compact ? "-mx-0.5" : "")}>
        <table className={listTableClass(compact ? "min-w-[520px]" : "min-w-[560px]")}>
          <thead className={listTheadRowClass}>
            <tr>
              <th className={cn(listThClass, compact && "py-2 text-[10px]")}>Name</th>
              <th className={cn(listThClass, compact && "py-2 text-[10px]")}>Title</th>
              <th className={cn(listThClass, compact && "py-2 text-[10px]")}>Phone</th>
              <th className={cn(listThClass, "min-w-[12rem] w-[30%]", compact && "py-2 text-[10px]")}>Email</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c, i) => (
              <tr key={`${c.name}-${i}`} className={listTbodyRowClass}>
                <td
                  className={cn(
                    listTdClass,
                    compact ? "py-2 text-[10px] font-medium" : "font-medium text-foreground"
                  )}
                >
                  {c.name || "—"}
                </td>
                <td className={cn(listTdClass, compact ? "py-2 text-[10px] text-muted-foreground" : "text-muted-foreground")}>
                  {c.title?.trim() || "—"}
                </td>
                <td
                  className={cn(
                    listTdClass,
                    "tabular-nums",
                    compact ? "py-2 text-[10px] text-muted-foreground" : "text-muted-foreground"
                  )}
                >
                  {phonesForRepFirmContact(c).length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {phonesForRepFirmContact(c).map((phone, pi) => (
                        <span key={`${c.name}-ph-${pi}`}>{phone}</span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={cn(listTdClass, "min-w-[12rem] w-[30%] align-top", compact && "py-2")}>
                  <RepFirmContactEmailCell contact={c} compact={compact} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hidden > 0 && !showAll ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className={cn(
            "mt-2 text-left text-muted-foreground underline-offset-2 hover:text-foreground hover:underline",
            compact ? "text-[10px]" : "text-2xs"
          )}
        >
          Show {hidden} additional contact{hidden !== 1 ? "s" : ""}
        </button>
      ) : null}
      {attribution ? (
        <p className={cn("mt-2 text-muted-foreground", compact ? "text-[9px]" : "text-2xs")}>
          * {attribution}
        </p>
      ) : null}
    </div>
  );
}
