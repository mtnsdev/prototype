"use client";

import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
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

function displayProvider(p?: string): string {
  if (!p) return "Acuity";
  const x = p.toLowerCase();
  if (x === "gemini") return "Gemini";
  if (x === "perplexity") return "Perplexity";
  if (x === "claude") return "Claude";
  return p.charAt(0).toUpperCase() + p.slice(1);
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
      return "text-muted-foreground";
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
  const provider = displayProvider(provenance.provider);
  const conf = (provenance.confidence ?? "medium") as string;
  const sourcedAt = formatSourcedDate(provenance.sourced_at);
  const titleTip = `${provider} · ${sourcedAt} · ${conf} confidence${provenance.raw_excerpt ? ` · “${provenance.raw_excerpt.slice(0, 80)}…”` : ""}`;

  const isLow = conf === "low";
  const unverified = !verified;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={titleTip}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-opacity",
            "bg-violet-500/15 text-violet-300 border",
            verified ? "border-emerald-500/40" : "border-amber-500/45",
            isLow && "opacity-60"
          )}
        >
          {verified ? (
            <Check size={10} className="text-emerald-400 shrink-0" />
          ) : (
            <Sparkles size={10} className="text-violet-400 shrink-0" />
          )}
          <span>{provider}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-violet-400 shrink-0" />
            <span className="font-medium text-foreground">{provider}</span>
          </div>
          <p className="text-xs text-muted-foreground/75">
            {sourcedAt} · <span className={confidenceColor(conf)}>{conf} confidence</span>
          </p>
          {provenance.raw_excerpt && (
            <blockquote className="text-xs text-muted-foreground border-l-2 border-violet-500/40 pl-2 italic">
              &ldquo;{provenance.raw_excerpt}&rdquo;
            </blockquote>
          )}
          <p className="text-xs text-[rgba(245,245,245,0.65)]">
            {fieldLabel ? `${fieldLabel}: ` : ""}Sourced by Acuity via {provider}. Verify before sharing with client.
          </p>
          {unverified && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-input text-foreground"
                onClick={() => {
                  setVerified(true);
                  onMarkVerified?.();
                }}
              >
                <Check size={12} className="mr-1" />
                Accept
              </Button>
              {onEdit && (
                <Button variant="outline" size="sm" className="h-7 text-xs border-input text-foreground" onClick={onEdit}>
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
