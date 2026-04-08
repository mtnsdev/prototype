"use client";

import { useRouter } from "next/navigation";
import { Bed, UtensilsCrossed, Car, Star, Plane, Clock, Compass, StickyNote, MoreHorizontal, Building2 } from "lucide-react";
import type { ItineraryEvent, ItineraryDay } from "@/types/itinerary";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/contexts/ToastContext";
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

function marginColor(marginPct: number): string {
  if (marginPct >= 20) return "text-[var(--muted-success-text)]";
  if (marginPct >= 10) return "text-[var(--muted-amber-text)]";
  return "text-[var(--muted-error-text)]";
}

type Props = {
  event: ItineraryEvent;
  day: ItineraryDay;
  itineraryId: string;
  dayNumber: number;
  canEdit: boolean;
  canViewFinancials: boolean;
  onUpdate: () => void;
  onEdit?: () => void;
  onEventClick?: () => void;
};

export default function ItineraryEventCard({
  event,
  day,
  itineraryId,
  dayNumber,
  canEdit,
  canViewFinancials,
  onUpdate,
  onEdit,
  onEventClick,
}: Props) {
  const router = useRouter();
  const showToast = useToast();
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
  const vicPrice = event.vic_price ?? 0;
  const supplierCost = event.net_cost ?? (vicPrice > 0 ? Math.round(vicPrice * 0.75) : 0);
  const marginPct = vicPrice > 0 ? Math.round(((vicPrice - supplierCost) / vicPrice) * 100) : 0;

  const SourceIcon =
    (event.source_product_category ?? "").toLowerCase() === "hotel" ||
    (event.source_product_category ?? "").toLowerCase() === "villa"
      ? Bed
      : (event.source_product_category ?? "").toLowerCase() === "restaurant" ||
          (event.source_product_category ?? "").toLowerCase() === "meal"
        ? UtensilsCrossed
        : (event.source_product_category ?? "").toLowerCase() === "transport"
          ? Car
          : (event.source_product_category ?? "").toLowerCase() === "experience" ||
              (event.source_product_category ?? "").toLowerCase() === "activity"
            ? Compass
            : Building2;

  return (
    <div
      role={onEventClick ? "button" : undefined}
      tabIndex={onEventClick ? 0 : undefined}
      onClick={onEventClick}
      onKeyDown={onEventClick ? (e) => e.key === "Enter" && onEventClick() : undefined}
      className={cn(
        "rounded-lg border border-border bg-[rgba(255,255,255,0.03)] p-3 flex items-start gap-3",
        leftBorderClass,
        event.status === "cancelled" && "line-through opacity-80",
        onEventClick && "cursor-pointer hover:bg-white/[0.04] transition-colors"
      )}
    >
      <div className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-muted-foreground/10 ring-1 ring-border/60 text-muted-foreground">
        <Icon size={20} className="shrink-0" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{event.title}</p>
        {timeRange ? (
          <p className="text-xs text-muted-foreground mt-0.5">{timeRange}</p>
        ) : null}
        {event.description && (
          <p className="text-xs text-muted-foreground/75 mt-1 line-clamp-2">{event.description}</p>
        )}
        {event.confirmation_number && (
          <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground mt-1">
            Conf: #{event.confirmation_number}
          </span>
        )}
        {event.source_product_id && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/products?selected=${event.source_product_id}`);
            }}
            className="mt-1 flex items-center gap-2 rounded-md border border-border/50 bg-white/[0.02] px-2 py-1 text-left text-[10px] hover:bg-white/[0.04]"
          >
            <SourceIcon className="h-3 w-3 text-brand-cta" aria-hidden />
            <span className="text-foreground">{event.source_product_name ?? "Product"}</span>
            <span className="text-muted-foreground">View in directory →</span>
          </button>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-0.5 text-right" onClick={(e) => e.stopPropagation()}>
        {event.vic_price != null && event.vic_price > 0 ? (
          <>
            <span className="font-medium text-foreground">{currency}{event.vic_price.toLocaleString()}</span>
            {canViewFinancials && marginPct > 0 && (
              <span className={cn("text-2xs", marginColor(marginPct))}>{marginPct}% margin</span>
            )}
          </>
        ) : event.vic_price === 0 ? (
          <span className="text-xs text-muted-foreground/75">included</span>
        ) : null}
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/75">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.()}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdate()} className="text-[var(--muted-error-text)]">Remove</DropdownMenuItem>
              <DropdownMenuItem disabled className="text-muted-foreground">
                Move: drag the grip on the timeline
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => showToast("Change status — available in the next release")}>Change status</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
