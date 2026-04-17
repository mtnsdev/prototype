import type { FreshnessTone } from "@/data/destinations";
import { cn } from "@/lib/utils";

const LABEL: Record<FreshnessTone, string> = {
  green: "Updated in the last 90 days",
  neutral: "Activity in the last 12 months",
  amber: "No recent updates (12+ months)",
};

export function FreshnessIndicator({
  tone,
  className,
}: {
  tone?: FreshnessTone;
  className?: string;
}) {
  if (tone == null) return null;
  const dot =
    tone === "green" ? "bg-emerald-400" : tone === "amber" ? "bg-amber-400" : "bg-muted-foreground/40";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground", className)}
      title={LABEL[tone]}
    >
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />
      <span className="sr-only">{LABEL[tone]}</span>
    </span>
  );
}
