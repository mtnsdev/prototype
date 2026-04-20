"use client";

import Link from "next/link";
import {
  Bed,
  UtensilsCrossed,
  Car,
  Star,
  Plane,
  Clock,
  Compass,
  StickyNote,
  X,
  Pencil,
  ExternalLink,
  Building2,
} from "lucide-react";
import type { ItineraryEvent, ItineraryDay } from "@/types/itinerary";
import { Button } from "@/components/ui/button";
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

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  tentative: "Tentative",
  cancelled: "Cancelled",
};

type Props = {
  event: ItineraryEvent;
  day: ItineraryDay;
  itineraryId: string;
  allDays: ItineraryDay[];
  onClose: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
};

export default function EventDetailPanel({
  event,
  day,
  itineraryId,
  allDays,
  onClose,
  onEdit,
  onRemove,
}: Props) {
  const Icon = EVENT_ICONS[event.event_type] ?? StickyNote;
  const timeStr =
    event.start_time && event.end_time
      ? `${event.start_time} – ${event.end_time}`
      : event.start_time ?? "—";
  const vicPrice = event.vic_price ?? 0;
  const supplierCost = event.net_cost ?? Math.round(vicPrice * 0.75);
  const margin = vicPrice - supplierCost;
  const marginPct = vicPrice > 0 ? Math.round((margin / vicPrice) * 100) : 0;

  return (
    <div className="w-full max-w-[400px] h-full flex flex-col bg-background border-l border-border shadow-xl animate-in slide-in-from-right duration-200">
      <header className="shrink-0 flex items-center justify-between gap-2 p-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[rgba(245,245,245,0.9)] shrink-0">
            <Icon size={18} />
          </div>
          <h2 className="text-sm font-semibold text-foreground truncate">{event.title}</h2>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground" onClick={onClose}>
          <X size={18} />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75 mb-2">Details</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground/75">Time</span>
              <span className="text-foreground">{timeStr}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-muted-foreground/75">Status</span>
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded border",
                  event.status === "confirmed" && "border-[var(--muted-success-border)] text-[var(--muted-success-text)]",
                  event.status === "tentative" && "border-[var(--muted-amber-border)] text-[var(--muted-amber-text)]",
                  event.status === "cancelled" && "border-[var(--muted-error-border)] text-[var(--muted-error-text)]"
                )}
              >
                {STATUS_LABELS[event.status] ?? event.status}
              </span>
            </div>
            {event.description && (
              <p className="text-muted-foreground pt-1">{event.description}</p>
            )}
            {event.source_product_name && (
              <div className="flex justify-between items-center gap-2 pt-1">
                <span className="text-muted-foreground/75">Supplier</span>
                <Link
                  href={`/dashboard/products/${event.source_product_id}`}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {event.source_product_name}
                  <ExternalLink size={12} />
                </Link>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground/75">Confirmation</span>
              <span className="text-foreground text-xs">
                {event.confirmation_number ?? "Pending"}
              </span>
            </div>
          </div>
        </section>

        {(vicPrice > 0 || supplierCost > 0) && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75 mb-2">Financial</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground/75">VIC price</span>
                <span className="text-foreground">€{vicPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground/75">Supplier cost</span>
                <span className="text-foreground">€{supplierCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/5">
                <span className="text-muted-foreground/75">Margin</span>
                <span className="text-foreground">€{margin.toLocaleString()} ({marginPct}%)</span>
              </div>
            </div>
          </section>
        )}

        {event.source_product_id && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75 mb-2">Linked product</h3>
            <Link
              href={`/dashboard/products/${event.source_product_id}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white/[0.03] hover:bg-foreground/[0.06] transition-colors"
            >
              <span className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center bg-muted-foreground/10 ring-1 ring-border/60 text-muted-foreground">
                <Building2 size={18} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{event.source_product_name}</p>
                <p className="text-xs text-muted-foreground/75">{event.source_product_category}</p>
              </div>
              <ExternalLink size={14} className="text-muted-foreground/75 shrink-0" />
            </Link>
          </section>
        )}

        {event.custom_notes && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/75 mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground bg-white/[0.03] rounded-lg p-3 border border-border">
              {event.custom_notes}
            </p>
          </section>
        )}
      </div>

      <footer className="shrink-0 p-4 border-t border-border space-y-2">
        <Button variant="outline" size="sm" className="w-full border-input text-foreground" onClick={onEdit}>
          <Pencil size={14} className="mr-2" /> Edit event
        </Button>
        <div className="flex gap-2">
          <select
            className="flex-1 text-xs bg-white/5 border border-input rounded-lg px-3 py-2 text-foreground"
            defaultValue=""
            onChange={(e) => e.target.value && (window as unknown as { __moveEventDay?: (dayNum: number) => void }).__moveEventDay?.(Number(e.target.value))}
          >
            <option value="">Move to day…</option>
            {allDays.map((d) => (
              <option key={d.day_number} value={d.day_number}>
                Day {d.day_number}
              </option>
            ))}
          </select>
          <select
            className="flex-1 text-xs bg-white/5 border border-input rounded-lg px-3 py-2 text-foreground"
            defaultValue={event.status}
          >
            <option value="confirmed">Confirmed</option>
            <option value="tentative">Tentative</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <Button variant="outline" size="sm" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={onRemove}>
          Remove event
        </Button>
      </footer>
    </div>
  );
}
