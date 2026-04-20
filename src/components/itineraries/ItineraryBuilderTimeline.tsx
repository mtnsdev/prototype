"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Building2,
  Car,
  Compass,
  Flame,
  GripVertical,
  MoreHorizontal,
  Plus,
  StickyNote,
  UtensilsCrossed,
} from "lucide-react";
import type { Itinerary, ItineraryDay, ItineraryEvent } from "@/types/itinerary";
import { FAKE_PRODUCTS } from "@/components/products/fakeData";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import {
  dayLabelDate,
  eventItemStatusLabel,
  eventToBuilderKind,
  formatProductCommission,
} from "./itineraryBuilderUi";
import { getAdvisoriesForProduct } from "@/components/products/productDirectoryAdvisoryMock";

const TYPE_CONFIG: Record<ReturnType<typeof eventToBuilderKind>, { icon: typeof Building2 }> = {
  accommodation: { icon: Building2 },
  experience: { icon: Compass },
  transfer: { icon: Car },
  dining: { icon: UtensilsCrossed },
  note: { icon: StickyNote },
};

function DayItemCard({
  event,
  onSelect,
  canViewCommissions,
}: {
  event: ItineraryEvent;
  onSelect: () => void;
  canViewCommissions: boolean;
}) {
  const kind = eventToBuilderKind(event);
  const config = TYPE_CONFIG[kind];
  const Icon = config.icon;
  const itemSt = eventItemStatusLabel(event);
  const timeStr =
    event.start_time && event.end_time
      ? `${event.start_time} – ${event.end_time}`
      : event.start_time ?? undefined;
  const loc = event.pickup_location ?? event.dropoff_location;
  const activeAdvisories = event.source_product_id
    ? getAdvisoriesForProduct(event.source_product_id).filter((a) => a.status === "active")
    : [];
  const leadAdvisory = activeAdvisories[0];
  const isExpiringSoon = (() => {
    if (!leadAdvisory?.validUntil) return false;
    const end = new Date(leadAdvisory.validUntil).getTime();
    if (Number.isNaN(end)) return false;
    const remainingMs = end - Date.now();
    return remainingMs >= 0 && remainingMs <= 14 * 24 * 60 * 60 * 1000;
  })();
  const advisoryValueLabel =
    leadAdvisory == null
      ? ""
      : leadAdvisory.incentiveType === "bonus_flat"
        ? `+$${leadAdvisory.incentiveValue ?? 0}`
        : leadAdvisory.incentiveType === "tier_upgrade"
          ? "Tier upgrade"
          : `+${leadAdvisory.incentiveValue ?? 0}%`;
  const advisoryExpiry =
    leadAdvisory?.validUntil != null
      ? new Date(leadAdvisory.validUntil).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className="group/item rounded-xl border border-border bg-popover transition-all hover:border-border"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted-foreground/12 ring-1 ring-border/50">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-compact text-foreground">{event.title}</span>
              {itemSt === "confirmed" && (
                <span className="rounded border border-[var(--muted-success-border)] bg-[var(--muted-success-bg)] px-1.5 py-0.5 text-[9px] text-[var(--muted-success-text)]">
                  Confirmed
                </span>
              )}
              {itemSt === "proposed" && (
                <span className="rounded border border-[var(--muted-amber-border)] bg-[var(--muted-amber-bg)] px-1.5 py-0.5 text-[9px] text-[var(--muted-amber-text)]">
                  Proposed
                </span>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-2xs text-muted-foreground">
              {timeStr && <span>{timeStr}</span>}
              {loc && <span>· {loc}</span>}
            </div>
            {event.description && (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/65">{event.description}</p>
            )}
            {(event.source_product_name || event.source_product_id) && (
              <div className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-foreground/[0.025] p-2 transition-colors hover:border-border">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{event.source_product_name ?? "Linked product"}</span>
                {formatProductCommission(event) && (
                  <span className="ml-auto text-[9px] text-brand-cta">{formatProductCommission(event)}</span>
                )}
              </div>
            )}
            {leadAdvisory && canViewCommissions ? (
              <div className="mt-1 flex items-center gap-1.5 rounded-md border border-[var(--muted-amber-border)] bg-[var(--muted-amber-bg)] px-2 py-1 text-[10px] text-[var(--muted-amber-text)]">
                <Flame className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
                <span>
                  {leadAdvisory.title}: {advisoryValueLabel}
                  {advisoryExpiry ? <> · expires {advisoryExpiry}</> : null}
                </span>
                {isExpiringSoon ? <span className="ml-1 opacity-90">· expiring soon</span> : null}
              </div>
            ) : null}
            {event.custom_notes &&
              event.event_type === "stay" &&
              event.source_product_name &&
              !event.custom_notes.includes("FSPP") && (
                <p className="mt-1.5 text-xs italic text-muted-foreground">&ldquo;{event.custom_notes}&rdquo;</p>
              )}
            {event.custom_notes && !event.source_product_name && (
              <p className="mt-1.5 text-xs italic text-muted-foreground">&ldquo;{event.custom_notes}&rdquo;</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
            <button type="button" className="rounded p-1 hover:bg-foreground/[0.05]" aria-label="Reorder">
              <GripVertical className="h-3 w-3 text-muted-foreground/65" />
            </button>
            <button type="button" className="rounded p-1 hover:bg-foreground/[0.05]" aria-label="More">
              <MoreHorizontal className="h-3 w-3 text-muted-foreground/65" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type AddPhase = "menu" | "product" | null;
type AddKind = "accommodation" | "experience" | "transfer" | "dining" | "note";

export default function ItineraryBuilderTimeline({
  days,
  onEventSelect,
  onToast,
  canViewCommissions,
}: {
  days: ItineraryDay[];
  onEventSelect: (day: ItineraryDay, event: ItineraryEvent) => void;
  onToast: (msg: string) => void;
  canViewCommissions: boolean;
}) {
  const [openDayKey, setOpenDayKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<AddPhase>(null);
  const [addKind, setAddKind] = useState<AddKind | null>(null);
  const [productQ, setProductQ] = useState("");
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openDayKey) return;
    const onDoc = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpenDayKey(null);
        setPhase(null);
        setAddKind(null);
        setProductQ("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openDayKey]);

  const productResults = useMemo(() => {
    const q = productQ.trim().toLowerCase();
    let list: Product[] = [...FAKE_PRODUCTS];
    if (addKind === "accommodation") list = list.filter((p) => p.category === "accommodation");
    if (addKind === "experience") list = list.filter((p) => p.category !== "accommodation");
    if (!q) return list.slice(0, 8);
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.city ?? "").toLowerCase().includes(q) ||
          (p.country ?? "").toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [productQ, addKind]);

  const dayKey = (d: ItineraryDay, i: number) => `${d.day_number}-${i}-${d.date ?? ""}`;

  const selectProduct = (p: Product) => {
    onToast(`Linked “${p.name}” — commission ${p.commission_rate != null ? `${p.commission_rate}%` : "on file"}`);
    setOpenDayKey(null);
    setPhase(null);
    setAddKind(null);
    setProductQ("");
  };

  return (
    <div className="flex-1 space-y-1 overflow-y-auto px-6 py-4">
      {days.map((day, index) => {
        const k = dayKey(day, index);
        const menuOpen = openDayKey === k;
        return (
          <div key={k} className="group">
            <div className="sticky top-0 z-10 mb-3 flex items-center gap-3 bg-inset py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(201,169,110,0.08)]">
                <span className="text-sm font-light text-brand-cta">{index + 1}</span>
              </div>
              <div>
                <span className="text-compact text-foreground">Day {index + 1}</span>
                <span className="ml-2 text-2xs text-muted-foreground/65">{dayLabelDate(day)}</span>
              </div>
              {day.location && <span className="ml-2 text-2xs text-muted-foreground">{day.location}</span>}
              <div className="relative ml-auto" ref={menuOpen ? popRef : null}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDayKey(menuOpen ? null : k);
                    setPhase(menuOpen ? null : "menu");
                    setAddKind(null);
                    setProductQ("");
                  }}
                  className={cn(
                    "text-2xs text-brand-cta transition-opacity hover:text-[#D4B87E]",
                    menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                >
                  + Add item
                </button>
                {menuOpen && phase === "menu" && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-border bg-popover py-1 shadow-xl">
                    {(
                      [
                        ["accommodation", Building2, "Accommodation"],
                        ["experience", Compass, "Experience"],
                        ["transfer", Car, "Transfer"],
                        ["dining", UtensilsCrossed, "Dining"],
                      ] as const
                    ).map(([kind, Ico, label]) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => {
                          setAddKind(kind);
                          setPhase(kind === "accommodation" || kind === "experience" ? "product" : "menu");
                          if (kind === "transfer" || kind === "dining") {
                            onToast(`Add ${label} — draft item created (mock)`);
                            setOpenDayKey(null);
                            setPhase(null);
                          }
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-foreground/[0.03]"
                      >
                        <Ico className="h-3.5 w-3.5" /> {label}
                      </button>
                    ))}
                    <div className="my-1 h-px bg-foreground/[0.05]" />
                    <button
                      type="button"
                      onClick={() => {
                        onToast("Note added (mock)");
                        setOpenDayKey(null);
                        setPhase(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-foreground/[0.03]"
                    >
                      <StickyNote className="h-3.5 w-3.5" /> Note
                    </button>
                  </div>
                )}
                {menuOpen && phase === "product" && addKind && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-xl border border-border bg-popover p-4 shadow-xl">
                    <p className="mb-2 text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
                      Product directory
                    </p>
                    <input
                      autoFocus
                      value={productQ}
                      onChange={(e) => setProductQ(e.target.value)}
                      placeholder="Search products…"
                      className="w-full border-b border-border bg-transparent pb-2 text-compact text-foreground placeholder:text-muted-foreground/65 outline-none focus:border-brand-cta"
                    />
                    <div className="mt-2 max-h-48 overflow-y-auto">
                      {productResults.map((p) => {
                        const loc = [p.city, p.country].filter(Boolean).join(", ") || "—";
                        const comm = p.commission_rate != null ? `${p.commission_rate}%` : null;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectProduct(p)}
                            className="flex w-full items-center gap-3 rounded py-2 px-1 text-left transition-colors hover:bg-foreground/[0.03]"
                          >
                            <span className="text-sm text-foreground">{p.name}</span>
                            <span className="text-2xs text-muted-foreground/65">{loc}</span>
                            {comm && <span className="ml-auto text-[9px] text-[#B8976E]">{comm}</span>}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhase("menu")}
                      className="mt-2 text-2xs text-muted-foreground hover:text-muted-foreground"
                    >
                      ← Back
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-4 space-y-3 border-l border-border pl-7 pb-6">
              {(day.events ?? []).map((ev) => (
                <DayItemCard
                  key={ev.id}
                  event={ev}
                  onSelect={() => onEventSelect(day, ev)}
                  canViewCommissions={canViewCommissions}
                />
              ))}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onToast("Add day — coming soon")}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 px-4 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-muted-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Day
      </button>
    </div>
  );
}
