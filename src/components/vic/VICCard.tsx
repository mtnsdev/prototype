"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, Share2 } from "lucide-react";
import type { VIC } from "@/types/vic";
import { getVICId } from "@/lib/vic-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DemoBadge } from "@/components/ui/DemoBadge";

type Props = {
  vic: VIC;
  onEdit: () => void;
  onDelete: () => void;
  onShare?: () => void;
  canEdit: boolean;
  canDelete: boolean;
  canShare?: boolean;
  viewLevel?: "full" | "basic" | "none";
  showRequestFullAccess?: boolean;
  onRequestFullAccess?: () => void;
};

function acuityBadgeClass(acuity: string): string {
  switch (acuity) {
    case "complete":
      return "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border border-[var(--muted-success-border)]";
    case "running":
      return "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border border-[var(--muted-amber-border)]";
    case "not_run":
    case "failed":
    default:
      return "bg-[var(--muted-error-bg)] text-[var(--muted-error-text)] border border-[var(--muted-error-border)]";
  }
}

export default function VICCard({ vic, onEdit, onDelete, onShare, canEdit, canDelete, canShare, viewLevel = "full", showRequestFullAccess, onRequestFullAccess }: Props) {
  const vicId = getVICId(vic);
  const fullName = vic.full_name ?? "—";
  const preferredName = vic.preferred_name && vic.preferred_name !== fullName ? vic.preferred_name : null;
  const leg = vic as unknown as { city?: string; country?: string; phone?: string; acuityStatus?: string; customTags?: string[] };
  const email = vic.email ?? "";
  const phone = vic.phone_primary ?? leg.phone ?? "";
  const contact = [email, phone].filter(Boolean).join(" · ") || "—";
  const city = vic.home_city ?? leg.city ?? "";
  const country = vic.home_country ?? leg.country ?? "";
  const cityCountry = [city, country].filter(Boolean).join(", ") || "—";
  const status = vic.relationship_status ?? null;
  const acuity = vic.acuity_status ?? leg.acuityStatus ?? null;
  const tags = vic.tags ?? leg.customTags ?? [];
  const isBasic = viewLevel === "basic";

  return (
    <div className="relative rounded-xl border border-border bg-[rgba(255,255,255,0.03)] p-4 flex flex-col gap-3 hover:border-input transition-colors min-h-[140px]">
      <DemoBadge />
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/dashboard/vics/${vicId}`} className="font-semibold text-foreground hover:underline block truncate">
            {fullName}
          </Link>
          {preferredName && (
            <p className="text-xs text-muted-foreground/75 truncate">{preferredName}</p>
          )}
          <p className="text-sm text-muted-foreground truncate mt-0.5">{contact}</p>
          {!isBasic && <p className="text-xs text-muted-foreground/75 mt-0.5">{cityCountry}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
              <MoreHorizontal size={16} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/vics/${vicId}`} className="text-[rgba(245,245,245,0.9)]">View</Link>
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={onEdit} className="text-[rgba(245,245,245,0.9)]">
                <Pencil size={14} className="mr-2" /> Edit
              </DropdownMenuItem>
            )}
            {canShare && onShare && (
              <DropdownMenuItem onClick={onShare} className="text-[rgba(245,245,245,0.9)]">
                <Share2 size={14} className="mr-2" /> Share
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-[var(--muted-error-text)] focus:text-[var(--muted-error-text)]">
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            )}
            {showRequestFullAccess && onRequestFullAccess && (
              <DropdownMenuItem onClick={onRequestFullAccess} className="text-[rgba(245,245,245,0.9)]">
                Request Full Access
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {!isBasic && (
        <div className="flex flex-wrap gap-1.5">
          {status && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-2xs font-medium text-muted-foreground capitalize">
              {status.replace(/_/g, " ")}
            </span>
          )}
          {acuity && (
            <span className={cn("rounded-full px-2 py-0.5 text-2xs font-medium capitalize", acuityBadgeClass(acuity))}>
              {acuity.replace(/_/g, " ")}
            </span>
          )}
        </div>
      )}
      {!isBasic && tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-muted-foreground">
              {t}
            </span>
          ))}
          {tags.length > 4 && <span className="text-xs text-muted-foreground/75">+{tags.length - 4}</span>}
        </div>
      )}
    </div>
  );
}
