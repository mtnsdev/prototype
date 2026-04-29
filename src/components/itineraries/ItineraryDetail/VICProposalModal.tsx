"use client";

import { X, Copy, FileDown } from "lucide-react";
import type { Itinerary } from "@/types/itinerary";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/ToastContext";

function formatDayDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  } catch {
    return dateStr;
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  itinerary: Itinerary;
  onCopyLink?: () => void;
  onDownloadPdf?: () => void;
};

export default function VICProposalModal({ open, onClose, itinerary, onCopyLink, onDownloadPdf }: Props) {
  const showToast = useToast();
  if (!open) return null;

  const days = itinerary.days ?? [];
  const totalVic = itinerary.total_vic_price ?? days.reduce((sum, d) => sum + (d.events ?? []).reduce((s, e) => s + (e.vic_price ?? 0), 0), 0);
  const travelerCount = itinerary.traveler_count ?? 1;
  const perPerson = travelerCount > 0 ? Math.round(totalVic / travelerCount) : totalVic;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">VIC preview</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground"
            onClick={() => {
              onCopyLink?.();
              showToast("Link copied — Coming soon");
            }}
          >
            <Copy size={14} className="mr-1" /> Copy Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground"
            onClick={() => {
              onDownloadPdf?.();
              showToast("PDF export coming soon");
            }}
          >
            <FileDown size={14} className="mr-1" /> Download PDF
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] px-8 py-16">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">TRAVELLUSTRE</p>
        <p className="mt-1 text-muted-foreground">Prepared by {itinerary.primary_advisor_name ?? "Your advisor"}</p>

        <hr className="my-8 border-t border-border" />

        <h1 className="font-serif text-2xl font-semibold text-foreground">{itinerary.trip_name}</h1>
        <p className="mt-2 text-muted-foreground">
          {itinerary.trip_start_date && itinerary.trip_end_date
            ? `${new Date(itinerary.trip_start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(itinerary.trip_end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
            : "Dates TBD"}
          {(itinerary.destinations ?? []).length > 0 && ` · ${itinerary.destinations.join(", ")}`}
        </p>
        {travelerCount > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {travelerCount} traveler{travelerCount !== 1 ? "s" : ""}
          </p>
        )}

        <hr className="my-8 border-t border-border" />

        {days.map((day) => (
          <section key={day.day_number} className="mb-10">
            <h2 className="mb-4 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Day {day.day_number} — {formatDayDate(day.date)} {day.location && `· ${day.location}`}
            </h2>
            <ul className="space-y-4">
              {(day.events ?? []).map((ev) => (
                <li key={ev.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-sm text-muted-foreground">{ev.start_time ?? "—"}</span>
                    <span className="mx-2 text-muted-foreground/40">·</span>
                    <span className="text-foreground">{ev.title}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    {ev.vic_price != null && ev.vic_price > 0 ? (
                      <span className="font-medium text-foreground">€{ev.vic_price.toLocaleString()}</span>
                    ) : ev.vic_price === 0 ? (
                      <span className="text-sm text-muted-foreground">included</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <hr className="my-8 border-t border-border" />

        <section>
          <h2 className="mb-4 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trip Summary
          </h2>
          <div className="flex justify-between font-medium text-foreground">
            <span>Total</span>
            <span>€{totalVic.toLocaleString()}</span>
          </div>
          {travelerCount > 1 && (
            <div className="mt-1 flex justify-between text-sm text-muted-foreground">
              <span>Per person</span>
              <span>€{perPerson.toLocaleString()}</span>
            </div>
          )}
        </section>

        <hr className="my-8 border-t border-border" />

        <p className="text-sm text-muted-foreground">Prepared with care by</p>
        <p className="font-medium text-foreground">{itinerary.primary_advisor_name ?? "Your advisor"}</p>
        <p className="text-sm text-muted-foreground">TravelLustre</p>
        <p className="text-sm text-muted-foreground">marie@travellustre.com</p>
      </div>
    </div>
  );
}
