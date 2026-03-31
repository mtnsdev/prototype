"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CountdownBadge({
  departureIso,
  className,
}: {
  departureIso: string;
  className?: string;
}) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const dep = new Date(departureIso).getTime();
    setDays(Math.ceil((dep - Date.now()) / 86400000));
  }, [departureIso]);
  if (days == null || days < 0) return null;
  return (
    <span
      className={cn(
        "inline-flex rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-amber-200",
        className
      )}
    >
      {days === 0 ? "Departs today" : `${days}d to departure`}
    </span>
  );
}
