"use client";

import Link from "next/link";
import {
  UserPlus,
  Route,
  Package,
  Search,
  Sparkles,
  FileDown,
  Zap,
} from "lucide-react";
import AppleWidgetCard from "../AppleWidgetCard";
import BriefingEmptyState from "../BriefingEmptyState";
import type { QuickStartContent } from "@/types/briefing";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  UserPlus,
  Route,
  Package,
  Search,
  Sparkles,
  FileDown,
  Zap,
};

const ROUTES: Record<string, string> = {
  "Add VIC": "/dashboard/vics",
  "Create Itinerary": "/dashboard/itineraries?create=1",
  "Browse Products": "/dashboard/products",
  "Search Knowledge": "/dashboard/knowledge-vault",
  "Acuity Lookup": "/dashboard/vics",
  "Run Acuity on VIC": "/dashboard/vics",
  "Import CSV": "/dashboard/vics",
};

type Props = {
  content: QuickStartContent;
  staggerIndex?: number;
};

export default function QuickStartWidget({ content, staggerIndex = 0 }: Props) {
  const actions = (content.actions ?? []).slice(0, 6);

  if (actions.length === 0) {
    return (
      <AppleWidgetCard
        accent="gray"
        icon={<Zap size={20} />}
        title="Quick Start"
        staggerIndex={staggerIndex}
      >
        <BriefingEmptyState
          icon={<Zap />}
          title="No shortcuts yet"
          description="Quick links to VICs, itineraries, and search will show here when configured."
        />
      </AppleWidgetCard>
    );
  }

  return (
    <AppleWidgetCard
      accent="gray"
      icon={<Zap size={20} />}
      title="Quick Start"
      staggerIndex={staggerIndex}
    >
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => {
          const Icon = ICON_MAP[action.icon] ?? Zap;
          const href = ROUTES[action.label] ?? action.route ?? "#";
          const isAcuityVic =
            action.label === "Acuity Lookup" || action.label === "Run Acuity on VIC";
          return (
            <Link
              key={action.label}
              href={href}
              className={cn(
                "group flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isAcuityVic
                  ? "border-[var(--muted-accent-border)] bg-[var(--muted-accent-bg)] hover:bg-muted/35"
                  : "border-transparent bg-muted/15 hover:bg-muted/35"
              )}
            >
              <Icon
                size={24}
                className={cn(
                  "transition-colors",
                  isAcuityVic
                    ? "text-[var(--muted-accent-text)] group-hover:text-foreground"
                    : "text-muted-foreground/90 group-hover:text-foreground"
                )}
              />
              {isAcuityVic ? (
                <span className="mt-2 text-center text-2xs font-medium leading-tight text-[var(--muted-accent-text)]">
                  Acuity Lookup
                </span>
              ) : (
                <span className="mt-2 w-full truncate text-xs text-muted-foreground/90 transition-colors group-hover:text-foreground">
                  {action.label
                    .replace("Create Itinerary", "Create Itin.")
                    .replace("Browse Products", "Browse Prods.")
                    .replace("Search Knowledge", "Search Knowl.")}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </AppleWidgetCard>
  );
}
