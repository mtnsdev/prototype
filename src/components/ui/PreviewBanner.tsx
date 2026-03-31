"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PreviewBannerProps {
  feature: string;
  variant?: "full" | "compact";
  dismissible?: boolean;
  sampleDataOnly?: boolean;
  className?: string;
}

export default function PreviewBanner({
  feature,
  variant = "full",
  dismissible = false,
  sampleDataOnly = false,
  className,
}: PreviewBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const compact = variant === "compact";

  return (
    <div
      role="status"
      className={cn(
        "relative border-b border-border bg-card px-6 text-sm text-foreground",
        compact ? "py-2" : "py-3",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{feature} — preview</p>
          <p className="mt-0.5 text-muted-foreground">
            {sampleDataOnly
              ? "This area uses sample data. Behavior may change before release."
              : "This feature is in preview and may change."}
          </p>
        </div>
        {dismissible && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 -mr-1"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss preview notice"
          >
            <X className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}
