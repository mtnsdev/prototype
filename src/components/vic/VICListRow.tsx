"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { VIC } from "@/types/vic";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import LifecycleIndicators from "./LifecycleIndicators";

type Props = {
  vic: VIC;
  vicId: string;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
  viewLevel?: "full" | "basic" | "none";
  showRequestFullAccess?: boolean;
  onRequestFullAccess?: () => void;
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  prospect: "Prospect",
  past: "Past",
  do_not_contact: "Do not contact",
};
const ACUITY_LABELS: Record<string, string> = {
  not_run: "Not run",
  running: "Running",
  complete: "Complete",
  failed: "Failed",
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

export default function VICListRow({
  vic,
  vicId,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  viewLevel = "full",
  showRequestFullAccess,
  onRequestFullAccess,
}: Props) {
  const leg = vic as unknown as { city?: string; country?: string; phone?: string; acuityStatus?: string; customTags?: string[] };
  const isBasic = viewLevel === "basic";
  const cityCountry = [vic.home_city ?? leg.city, vic.home_country ?? leg.country].filter(Boolean).join(", ") || "—";
  const email = vic.email ?? "—";
  const phone = vic.phone_primary ?? leg.phone ?? "—";
  const status = vic.relationship_status ? (STATUS_LABELS[vic.relationship_status] ?? vic.relationship_status) : "—";
  const acuityVal = vic.acuity_status ?? leg.acuityStatus;
  const acuityLabel = acuityVal ? (ACUITY_LABELS[acuityVal] ?? acuityVal) : "—";
  const tagList = vic.tags ?? leg.customTags ?? [];

  return (
    <tr className="border-b border-[rgba(255,255,255,0.06)] hover:bg-white/[0.03]">
      <td className="w-10 py-3 pl-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-white/20 bg-white/5"
        />
      </td>
      <td className="py-3">
        <div className="flex items-center gap-2">
          <LifecycleIndicators vic={vic} className="shrink-0 hidden sm:flex" />
          <Link href={`/dashboard/vics/${vicId}`} className="font-medium text-[#F5F5F5] hover:underline">
            {vic.full_name}
            {vic.preferred_name && vic.preferred_name !== vic.full_name && (
              <span className="text-[rgba(245,245,245,0.6)] font-normal"> ({vic.preferred_name})</span>
            )}
          </Link>
        </div>
      </td>
      <td className="py-3 text-sm text-[rgba(245,245,245,0.7)] hidden md:table-cell">{email}</td>
      <td className="py-3 text-sm text-[rgba(245,245,245,0.7)] hidden lg:table-cell">{phone}</td>
      <td className="py-3 text-sm text-[rgba(245,245,245,0.7)]">{isBasic ? "—" : cityCountry}</td>
      <td className="py-3 text-sm text-[rgba(245,245,245,0.6)]">{isBasic ? "—" : status}</td>
      <td className="py-3 text-sm">
        {isBasic ? "—" : acuityVal ? (
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", acuityBadgeClass(acuityVal))}>
            {acuityLabel.replace(/_/g, " ")}
          </span>
        ) : "—"}
      </td>
      <td className="py-3 text-sm max-w-[160px]">
        {isBasic ? "—" : tagList.length === 0 ? "—" : (
          <div className="flex flex-wrap gap-1">
            {tagList.slice(0, 3).map((t) => (
              <span key={t} className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-[rgba(245,245,245,0.8)]">
                {t}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-2 justify-end">
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal size={16} className="text-[rgba(245,245,245,0.6)]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#141414] border-[rgba(255,255,255,0.12)]">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/vics/${vicId}`} className="text-[rgba(245,245,245,0.9)]">View</Link>
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem onClick={onEdit} className="text-[rgba(245,245,245,0.9)]">
                <Pencil size={14} className="mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-400">
                <Trash2 size={14} className="mr-2" />
                Delete
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
      </td>
    </tr>
  );
}
