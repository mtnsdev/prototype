"use client";

import {
  Building2,
  FileText,
  MapPin,
  Ship,
  Utensils,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { destMuted, destMuted2 } from "./destinationStyles";

export type DestinationSectionId =
  | "dmc"
  | "restaurants"
  | "hotels"
  | "yacht"
  | "tourism"
  | "documents";

type Item = { id: DestinationSectionId; label: string; icon: LucideIcon };

const BASE: Item[] = [
  { id: "dmc", label: "DMC Partners", icon: Users },
  { id: "restaurants", label: "Restaurants", icon: Utensils },
  { id: "hotels", label: "Hotels", icon: Building2 },
  { id: "tourism", label: "Tourism & Regions", icon: MapPin },
  { id: "documents", label: "Documents", icon: FileText },
];

type Props = {
  active: DestinationSectionId;
  onChange: (id: DestinationSectionId) => void;
  showYacht: boolean;
  stats: { dmcs: number; restaurants: number; hotels: number; documents: number };
};

export function DestinationSectionNav({ active, onChange, showYacht, stats }: Props) {
  const items: Item[] = showYacht
    ? [
        BASE[0]!,
        BASE[1]!,
        BASE[2]!,
        { id: "yacht" as const, label: "Yacht Charters", icon: Ship },
        BASE[3]!,
        BASE[4]!,
      ]
    : BASE;

  return (
    <div className="flex w-full flex-col gap-4 lg:sticky lg:top-4 lg:w-[200px] lg:shrink-0 lg:self-start">
      <nav
        aria-label="Destination sections"
        className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : cn(destMuted, "hover:bg-muted/60 hover:text-foreground"),
              )}
            >
              <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </nav>
      <div
        className="hidden rounded-xl border border-border bg-card p-4 lg:block"
        aria-label="Quick stats"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quick stats</p>
        <ul className={cn("mt-3 space-y-2 text-sm", destMuted2)}>
          <li className="flex justify-between gap-2">
            <span>DMCs</span>
            <span className="font-medium text-foreground">{stats.dmcs}</span>
          </li>
          <li className="flex justify-between gap-2">
            <span>Restaurants</span>
            <span className="font-medium text-foreground">{stats.restaurants}</span>
          </li>
          <li className="flex justify-between gap-2">
            <span>Hotels</span>
            <span className="font-medium text-foreground">{stats.hotels}</span>
          </li>
          <li className="flex justify-between gap-2">
            <span>Documents</span>
            <span className="font-medium text-foreground">{stats.documents}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
