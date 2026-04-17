"use client";

import { Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { destMuted } from "@/components/destinations/destinationStyles";

type Props = {
  count: number;
  /** Mock endorser lines for prototype display. */
  endorsers?: { name: string; date: string }[];
  className?: string;
};

export function EndorsementBadge({ count, endorsers, className }: Props) {
  if (count <= 0) return null;
  const mock =
    endorsers ??
    [
      { name: "Advisor A.", date: "Mar 2026" },
      { name: "Advisor B.", date: "Feb 2026" },
    ].slice(0, Math.min(3, count));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-7 gap-1 rounded-full border-border bg-muted/30 px-2 text-[10px] font-medium text-muted-foreground hover:bg-muted/50",
            className,
          )}
        >
          <Users className="size-3" aria-hidden />
          <span className="tabular-nums">{count}</span>
          <span className="hidden sm:inline">recommend</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 text-sm">
        <p className="font-medium text-foreground">{count} advisors recommend</p>
        <p className={cn("mt-1 text-xs", destMuted)}>Display-only mock — toggle wires in Drop 2.</p>
        <ul className="mt-2 space-y-1.5">
          {mock.map((e) => (
            <li key={e.name} className="flex justify-between gap-2 text-xs">
              <span className="text-foreground">{e.name}</span>
              <span className={destMuted}>{e.date}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
