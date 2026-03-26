"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Itinerary } from "@/types/itinerary";
import {
  commissionDisplay,
  formatProductCommission,
  formatTripDatesDisplay,
  getBuilderDisplayStatus,
  nightsForItinerary,
} from "./itineraryBuilderUi";

function SummaryRow({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] text-[#4A4540]">{label}</span>
      {link ? (
        <span className="max-w-[60%] text-right text-[11px] text-[#C9A96E]">{value}</span>
      ) : (
        <span className="max-w-[60%] text-right text-[11px] text-[#9B9590]">{value}</span>
      )}
    </div>
  );
}

function BudgetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[#6B6560]">{label}</span>
      <span className="text-[11px] text-[#9B9590]">{value}</span>
    </div>
  );
}

export default function ItineraryBuilderSidebar({
  itinerary,
  canViewFinancials,
  internalNotes,
  onNotesChange,
}: {
  itinerary: Itinerary;
  canViewFinancials: boolean;
  internalNotes: string;
  onNotesChange: (v: string) => void;
}) {
  const nights = nightsForItinerary(itinerary);
  const travelers =
    itinerary.traveler_count != null
      ? `${itinerary.traveler_count} traveler${itinerary.traveler_count === 1 ? "" : "s"}`
      : "—";

  const commissionRows: { product: string; program: string; amount: string }[] = [];
  for (const d of itinerary.days ?? []) {
    for (const e of d.events ?? []) {
      if (!e.source_product_name) continue;
      const amt = formatProductCommission(e);
      if (!amt && !canViewFinancials) continue;
      commissionRows.push({
        product: e.source_product_name,
        program: e.source_product_category ?? "Partner program",
        amount: amt ?? "—",
      });
    }
  }

  const totalComm = commissionDisplay(itinerary, canViewFinancials);

  const acuityHref = `/dashboard/vics/${itinerary.primary_vic_id}?tab=acuity`;

  return (
    <aside className="flex w-full max-w-[340px] shrink-0 flex-col overflow-y-auto border-l border-[rgba(255,255,255,0.03)] bg-[#0a0a10] lg:w-[340px]">
      <div className="border-b border-[rgba(255,255,255,0.03)] px-5 py-4">
        <span className="mb-3 block text-[9px] font-medium uppercase tracking-[0.08em] text-[#4A4540]">Trip Summary</span>
        <div className="space-y-2.5">
          <SummaryRow
            label="Client"
            value={itinerary.primary_vic_name ?? itinerary.primary_vic_id}
            link
          />
          <SummaryRow label="Advisor" value={itinerary.primary_advisor_name ?? "—"} />
          <SummaryRow label="Travel dates" value={formatTripDatesDisplay(itinerary.trip_start_date, itinerary.trip_end_date)} />
          <SummaryRow label="Duration" value={`${nights} nights`} />
          <SummaryRow label="Destinations" value={(itinerary.destinations ?? []).join(" → ") || "—"} />
          <SummaryRow label="Travelers" value={travelers} />
          <SummaryRow label="Status" value={getBuilderDisplayStatus(itinerary)} />
        </div>
      </div>

      <div className="border-b border-[rgba(255,255,255,0.03)] px-5 py-4">
        <span className="mb-3 block text-[9px] font-medium uppercase tracking-[0.08em] text-[#4A4540]">Budget</span>
        <div className="space-y-2">
          <BudgetRow label="Accommodation" value="€8,400" />
          <BudgetRow label="Experiences" value="€2,200" />
          <BudgetRow label="Transfers" value="€800" />
          <BudgetRow label="Dining" value="€1,500" />
          <div className="my-2 h-px bg-[rgba(255,255,255,0.04)]" />
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#F5F0EB]">Total estimate</span>
            <span className="text-[14px] font-light text-[#F5F0EB]">€12,900</span>
          </div>
        </div>
      </div>

      <div className="border-b border-[rgba(255,255,255,0.03)] px-5 py-4">
        <span className="mb-3 block text-[9px] font-medium uppercase tracking-[0.08em] text-[#4A4540]">Commission</span>
        <div className="space-y-2">
          {commissionRows.length === 0 ? (
            <p className="text-[11px] text-[#6B6560]">No linked products yet.</p>
          ) : (
            commissionRows.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="block truncate text-[11px] text-[#9B9590]">{c.product}</span>
                  <span className="block text-[9px] text-[#4A4540]">{c.program}</span>
                </div>
                <span className="shrink-0 text-[11px] text-[#B8976E]">{c.amount}</span>
              </div>
            ))
          )}
          <div className="my-2 h-px bg-[rgba(255,255,255,0.04)]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#6B6560]">Total commission</span>
            <span className="text-[12px] text-[#B8976E]">{totalComm ?? "—"}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-[rgba(255,255,255,0.03)] px-5 py-4">
        <span className="mb-3 block text-[9px] font-medium uppercase tracking-[0.08em] text-[#4A4540]">Client Intelligence</span>
        <Link
          href={acuityHref}
          className="block rounded-lg border border-[rgba(201,169,110,0.08)] bg-[rgba(201,169,110,0.03)] p-3 transition-colors hover:border-[rgba(201,169,110,0.12)]"
        >
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-[#C9A96E]" />
            <span className="text-[11px] text-[#C9A96E]">Acuity Insights</span>
          </div>
          <p className="text-[10px] leading-relaxed text-[#9B9590]">
            Prefers suites with views. Strong interest in culinary experiences. Travels as family of 4 — kids enjoy guided
            activities. Always books Aman when available.
          </p>
          <span className="mt-2 inline-block text-[9px] text-[#C9A96E]">View full Acuity profile →</span>
        </Link>
      </div>

      <div className="px-5 py-4">
        <span className="mb-2 block text-[9px] font-medium uppercase tracking-[0.08em] text-[#4A4540]">Internal Notes</span>
        <textarea
          value={internalNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes about this trip..."
          rows={4}
          className="min-h-[80px] w-full resize-none rounded-lg border border-[rgba(255,255,255,0.03)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-[12px] text-[#9B9590] placeholder:text-[#4A4540] outline-none focus:border-[rgba(201,169,110,0.15)]"
        />
      </div>
    </aside>
  );
}
