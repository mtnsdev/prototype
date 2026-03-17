"use client";

import { useState, useEffect } from "react";
import { Construction, Eye, X } from "lucide-react";
import { IS_PREVIEW_MODE } from "@/config/preview";
import { cn } from "@/lib/utils";

const STORAGE_KEY_PREFIX = "preview_banner_dismissed_";

type Props = {
  feature: string;
  variant: "full" | "compact";
  dismissible?: boolean;
  /** When true, copy says this is sample data only (for Briefing, VICs, Products, Itineraries). */
  sampleDataOnly?: boolean;
};

export default function PreviewBanner({ feature, variant, dismissible = true, sampleDataOnly = false }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const storageKey = STORAGE_KEY_PREFIX + feature.replace(/\s+/g, "_").toLowerCase();

  useEffect(() => {
    if (typeof window === "undefined" || !dismissible) return;
    try {
      const stored = sessionStorage.getItem(storageKey);
      setDismissed(stored === "1");
    } catch {
      // ignore
    }
  }, [storageKey, dismissible]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(storageKey, "1");
      setDismissed(true);
    } catch {
      setDismissed(true);
    }
  };

  if (!IS_PREVIEW_MODE || dismissed) return null;

  if (variant === "compact") {
    return (
      <div className="shrink-0 px-3 py-1.5 bg-[var(--muted-amber-bg)] border-b border-[var(--muted-amber-border)] flex items-center gap-2 text-xs text-[var(--muted-amber-text)]">
        <Eye size={12} className="shrink-0" />
        <span>{sampleDataOnly ? "Sample data only" : "Preview · Demo data"}</span>
      </div>
    );
  }

  const fullSubtitle = sampleDataOnly
    ? "Everything you see here is sample data for demonstration. No real data is shown."
    : "You're viewing demo data. This section is under active development and will be connected to live data soon.";

  return (
    <div
      className={cn(
        "shrink-0 px-4 py-2.5 flex items-center gap-3 text-sm",
        "bg-[var(--muted-amber-bg)] border-b border-[var(--muted-amber-border)]",
        "bg-[length:12px_12px] bg-[linear-gradient(45deg,transparent_48%,rgba(180,160,120,0.06)_50%,transparent_52%)]"
      )}
    >
      <Construction size={18} className="text-[var(--muted-amber-text)] shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-[var(--muted-amber-text)]">
          {sampleDataOnly ? `Sample data only — ${feature}` : `Preview Mode — ${feature}`}
        </span>
        <span className="text-[var(--muted-amber-text)]/80 ml-1.5">
          {fullSubtitle}
        </span>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded text-[var(--muted-amber-text)]/80 hover:opacity-100 hover:bg-[var(--muted-amber-bg)] transition-colors"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
