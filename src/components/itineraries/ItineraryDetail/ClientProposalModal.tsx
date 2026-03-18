"use client";

import { X, Copy, FileDown } from "lucide-react";
import type { Itinerary, ItineraryDay } from "@/types/itinerary";
import { Button } from "@/components/ui/button";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
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

export default function ClientProposalModal({ open, onClose, itinerary, onCopyLink, onDownloadPdf }: Props) {
  const showToast = useToast();
  if (!open) return null;

  const days = itinerary.days ?? [];
  const totalClient = itinerary.total_client_price ?? days.reduce((sum, d) => sum + (d.events ?? []).reduce((s, e) => s + (e.client_price ?? 0), 0), 0);
  const travelerCount = itinerary.traveler_count ?? 1;
  const perPerson = travelerCount > 0 ? Math.round(totalClient / travelerCount) : totalClient;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Client Preview</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700"
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
            className="border-gray-300 text-gray-700"
            onClick={() => {
              onDownloadPdf?.();
              showToast("PDF export coming soon");
            }}
          >
            <FileDown size={14} className="mr-1" /> Download PDF
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
      </header>

      <div className="max-w-[720px] mx-auto py-16 px-8">
        {itinerary.hero_image_url && (
          <div className="rounded-xl overflow-hidden h-[300px] -mt-4 mb-10 bg-gray-100">
            <ImageWithFallback fallbackType="trip" src={itinerary.hero_image_url} alt={itinerary.trip_name} className="w-full h-full object-cover" />
          </div>
        )}

        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">TRAVELLUSTRE</p>
        <p className="text-gray-600 mt-1">Prepared by {itinerary.primary_advisor_name ?? "Your advisor"}</p>

        <hr className="border-t border-gray-200 my-8" />

        <h1 className="text-2xl font-serif font-semibold text-gray-900">{itinerary.trip_name}</h1>
        <p className="text-gray-600 mt-2">
          {itinerary.trip_start_date && itinerary.trip_end_date
            ? `${new Date(itinerary.trip_start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(itinerary.trip_end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
            : "Dates TBD"}
          {(itinerary.destinations ?? []).length > 0 && ` · ${itinerary.destinations.join(", ")}`}
        </p>
        {travelerCount > 0 && <p className="text-gray-500 text-sm mt-1">{travelerCount} traveler{travelerCount !== 1 ? "s" : ""}</p>}

        <hr className="border-t border-gray-200 my-8" />

        {days.map((day) => (
          <section key={day.day_number} className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-2 mb-4">
              Day {day.day_number} — {formatDayDate(day.date)} {day.location && `· ${day.location}`}
            </h2>
            <ul className="space-y-4">
              {(day.events ?? []).map((ev) => (
                <li key={ev.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-gray-400 text-sm font-mono">{ev.start_time ?? "—"}</span>
                    <span className="mx-2 text-gray-300">·</span>
                    <span className="text-gray-900">{ev.title}</span>
                    {ev.thumbnail_url && (
                      <div className="mt-2 rounded-lg overflow-hidden h-[120px] w-full max-w-sm bg-gray-100">
                        <ImageWithFallback fallbackType="event" src={ev.thumbnail_url} alt={ev.title} eventType={ev.event_type} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {ev.client_price != null && ev.client_price > 0 ? (
                      <span className="text-gray-900 font-medium">€{ev.client_price.toLocaleString()}</span>
                    ) : ev.client_price === 0 ? (
                      <span className="text-gray-400 text-sm">included</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <hr className="border-t border-gray-200 my-8" />

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-2 mb-4">Trip Summary</h2>
          <div className="flex justify-between text-gray-900 font-medium">
            <span>Total</span>
            <span>€{totalClient.toLocaleString()}</span>
          </div>
          {travelerCount > 1 && (
            <div className="flex justify-between text-gray-600 text-sm mt-1">
              <span>Per person</span>
              <span>€{perPerson.toLocaleString()}</span>
            </div>
          )}
        </section>

        <hr className="border-t border-gray-200 my-8" />

        <p className="text-gray-500 text-sm">Prepared with care by</p>
        <p className="text-gray-900 font-medium">{itinerary.primary_advisor_name ?? "Your advisor"}</p>
        <p className="text-gray-600 text-sm">TravelLustre</p>
        <p className="text-gray-500 text-sm">marie@travellustre.com</p>
      </div>
    </div>
  );
}
