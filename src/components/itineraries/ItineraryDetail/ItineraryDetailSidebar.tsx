"use client";

import Link from "next/link";
import type { Itinerary } from "@/types/itinerary";
import { formatDateRange } from "../statusConfig";

function computedTotals(itinerary: Itinerary) {
  let client = 0;
  let net = 0;
  let commission = 0;
  (itinerary.days ?? []).forEach((d) => {
    (d.events ?? []).forEach((e) => {
      if (e.client_price != null) client += e.client_price;
      if (e.net_cost != null) net += e.net_cost;
      if (e.commission_amount != null) commission += e.commission_amount;
    });
  });
  return { total_client_price: client, total_net_cost: net, total_commission: commission, total_margin: client - net };
}

type Props = {
  itinerary: Itinerary;
  canViewFinancials: boolean;
};

export default function ItineraryDetailSidebar({ itinerary, canViewFinancials }: Props) {
  const computed = computedTotals(itinerary);
  const totalClient = itinerary.total_client_price ?? computed.total_client_price;
  const totalNet = itinerary.total_net_cost ?? computed.total_net_cost;
  const totalMargin = itinerary.total_margin ?? computed.total_margin;
  const totalCommission = itinerary.total_commission ?? computed.total_commission;
  const currency = itinerary.currency === "EUR" ? "€" : itinerary.currency;
  const showFinancials = canViewFinancials || totalClient > 0 || totalNet > 0;

  return (
    <aside className="w-72 shrink-0 border-l border-[rgba(255,255,255,0.08)] bg-[#0C0C0C] p-4 overflow-y-auto max-md:w-full max-md:border-l-0 max-md:border-t max-md:order-last">
      <section className="space-y-3 mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)]">
          Trip info
        </h3>
        <div className="text-sm space-y-2">
          <div>
            <span className="text-[rgba(245,245,245,0.5)]">VIC</span>
            <p className="text-[#F5F5F5]">
              <Link
                href={`/dashboard/vics/${itinerary.primary_vic_id}`}
                className="hover:underline"
              >
                {itinerary.primary_vic_name ?? itinerary.primary_vic_id ?? "—"}
              </Link>
            </p>
          </div>
          <div>
            <span className="text-[rgba(245,245,245,0.5)]">Advisor</span>
            <p className="text-[#F5F5F5]">{itinerary.primary_advisor_name ?? itinerary.primary_advisor_id ?? "—"}</p>
          </div>
          <div>
            <span className="text-[rgba(245,245,245,0.5)]">Dates</span>
            <p className="text-[#F5F5F5]">{formatDateRange(itinerary.trip_start_date, itinerary.trip_end_date)}</p>
          </div>
          {itinerary.traveler_count != null && (
            <div>
              <span className="text-[rgba(245,245,245,0.5)]">Travelers</span>
              <p className="text-[#F5F5F5]">{itinerary.traveler_count}</p>
            </div>
          )}
          <div>
            <span className="text-[rgba(245,245,245,0.5)]">Destinations</span>
            <p className="text-[#F5F5F5]">{(itinerary.destinations ?? []).join(", ") || "—"}</p>
          </div>
        </div>
      </section>

      {showFinancials && (
        <section className="space-y-3 mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)]">
            Financial summary
          </h3>
          <div className="text-sm space-y-2">
            {totalClient > 0 && (
              <div className="flex justify-between">
                <span className="text-[rgba(245,245,245,0.5)]">Total client price</span>
                <span className="text-[#F5F5F5]">{currency} {totalClient.toLocaleString()}</span>
              </div>
            )}
            {totalNet > 0 && (
              <div className="flex justify-between">
                <span className="text-[rgba(245,245,245,0.5)]">Total net cost</span>
                <span className="text-[#F5F5F5]">{currency} {totalNet.toLocaleString()}</span>
              </div>
            )}
            {totalMargin !== 0 && (
              <div className="flex justify-between">
                <span className="text-[rgba(245,245,245,0.5)]">Margin</span>
                <span className="text-[#F5F5F5]">{currency} {totalMargin.toLocaleString()}</span>
              </div>
            )}
            {totalCommission > 0 && (
              <div className="flex justify-between">
                <span className="text-[rgba(245,245,245,0.5)]">Commission</span>
                <span className="text-[#F5F5F5]">{currency} {totalCommission.toLocaleString()}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {(itinerary.tags ?? []).length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)]">
            Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {itinerary.tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.8)]"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
