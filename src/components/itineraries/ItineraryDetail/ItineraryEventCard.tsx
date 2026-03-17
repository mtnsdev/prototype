"use client";

import Link from "next/link";
import { Bed, UtensilsCrossed, Car, Star, Plane, Clock, Compass, StickyNote, MoreHorizontal } from "lucide-react";
import type { ItineraryEvent } from "@/types/itinerary";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const EVENT_ICONS: Record<ItineraryEvent["event_type"], React.ComponentType<{ size?: number; className?: string }>> = {
  stay: Bed,
  meal: UtensilsCrossed,
  transfer: Car,
  activity: Star,
  experience: Compass,
  flight: Plane,
  free_time: Clock,
  note: StickyNote,
};

type Props = {
  event: ItineraryEvent;
  itineraryId: string;
  dayNumber: number;
  canEdit: boolean;
  canViewFinancials: boolean;
  onUpdate: () => void;
  onEdit?: () => void;
};

export default function ItineraryEventCard({
  event,
  itineraryId,
  dayNumber,
  canEdit,
  canViewFinancials,
  onUpdate,
  onEdit,
}: Props) {
  const Icon = EVENT_ICONS[event.event_type] ?? StickyNote;
  const timeRange =
    event.start_time && event.end_time
      ? `${event.start_time} – ${event.end_time}`
      : event.start_time
        ? event.start_time
        : "";

  const leftBorderClass =
    event.status === "cancelled"
      ? "border-l-4 border-l-[var(--muted-error-text)]"
      : event.status === "tentative"
        ? "border-l-4 border-l-[var(--muted-amber-text)] border-l-dashed"
        : "border-l-4 border-l-[var(--muted-success-text)]";

  const currency = "€";

  return (
    <div
      className={cn(
        "rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3 flex items-start gap-3",
        leftBorderClass,
        event.status === "cancelled" && "line-through opacity-80"
      )}
    >
      <div className="shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[rgba(245,245,245,0.8)]">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#F5F5F5]">{event.title}</p>
        {timeRange ? (
          <p className="text-xs text-[rgba(245,245,245,0.6)] mt-0.5">{timeRange}</p>
        ) : (
          <p className="text-xs text-[rgba(245,245,245,0.4)] mt-0.5">No time set</p>
        )}
        {event.description && (
          <p className="text-xs text-[rgba(245,245,245,0.5)] mt-1">{event.description}</p>
        )}
        {event.confirmation_number && (
          <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.8)] mt-1">
            Conf: #{event.confirmation_number}
          </span>
        )}
        {event.source_product_id && (
          <Link
            href={`/dashboard/products/${event.source_product_id}`}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.8)] hover:bg-white/15 mt-1.5"
          >
            {event.source_product_name ?? event.source_product_category ?? "Product"} →
          </Link>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        {canViewFinancials && event.client_price != null && event.client_price > 0 && (
          <span className="font-semibold text-[#F5F5F5]">{currency}{event.client_price.toLocaleString()}</span>
        )}
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[rgba(245,245,245,0.5)]">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
              <DropdownMenuItem onClick={() => onEdit?.()}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdate()} className="text-red-400">Remove</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>Move to another day</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {}}>Change status</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
