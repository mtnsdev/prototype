"use client";

import { useState } from "react";
import { Sparkles, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FieldProvenance } from "@/types/vic";
import { cn } from "@/lib/utils";

function formatSourcedDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function confidenceColor(confidence: string | undefined): string {
  switch (confidence?.toLowerCase()) {
    case "high":
      return "text-[var(--muted-success-text)]";
    case "medium":
      return "text-[var(--muted-amber-text)]";
    case "low":
      return "text-[var(--muted-error-text)]";
    default:
      return "text-[rgba(245,245,245,0.7)]";
  }
}

type Props = {
  provenance: FieldProvenance;
  fieldLabel?: string;
  onMarkVerified?: () => void;
  onEdit?: () => void;
};

export default function AcuitySourceBadge({ provenance, fieldLabel, onMarkVerified, onEdit }: Props) {
  const [verified, setVerified] = useState(!!provenance.verified);
  const provider = provenance.provider ?? "Acuity";
  const sourcedAt = formatSourcedDate(provenance.sourced_at);
  const tooltip = "Sourced by Acuity via " + provider + " · " + sourcedAt;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={tooltip}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            "bg-[var(--muted-accent-bg)] text-[var(--muted-accent-text)] border border-[var(--muted-accent-border)]",
            "hover:bg-[rgba(155,150,170,0.18)] transition-colors cursor-pointer"
          )}
        >
          {verified ? <Check size={10} className="text-[var(--muted-success-text)] shrink-0" /> : <Sparkles size={10} className="shrink-0" />}
          <span>{provider}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 bg-[#1a1a1a] border-[rgba(255,255,255,0.1)] p-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[var(--muted-accent-text)] shrink-0" />
            <span className="font-medium text-[#F5F5F5]">{provider}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[rgba(245,245,245,0.5)]">Confidence:</span>
            <span className={cn("font-medium", confidenceColor(provenance.confidence))}>
              {(provenance.confidence ?? "—").charAt(0).toUpperCase() + (provenance.confidence ?? "—").slice(1)}
            </span>
          </div>
          <p className="text-xs text-[rgba(245,245,245,0.6)]">
            Date sourced: {sourcedAt}
          </p>
          <p className="text-xs text-[rgba(245,245,245,0.7)]">
            This field was populated by Acuity Intelligence using {provider}. Verify before sharing with client.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-white/10 text-[#F5F5F5]"
              onClick={() => {
                setVerified(true);
                onMarkVerified?.();
              }}
            >
              <Check size={12} className="mr-1" />
              Mark as Verified
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-white/10 text-[#F5F5F5]"
                onClick={onEdit}
              >
                <Pencil size={12} className="mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
