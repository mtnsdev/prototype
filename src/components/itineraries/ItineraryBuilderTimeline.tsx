"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Building2,
  Car,
  Compass,
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

const TYPE_CONFIG: Record<
  ReturnType<typeof eventToBuilderKind>,
  { icon: typeof Building2; color: string; label: string }
> = {
  accommodation: { icon: Building2, color: "#B8A082", label: "Accommodation" },
  experience: { icon: Compass, color: "#A08CAA", label: "Experience" },
  transfer: { icon: Car, color: "#8296B4", label: "Transfer" },
  dining: { icon: UtensilsCrossed, color: "#82A0A0", label: "Dining" },
  note: { icon: StickyNote, color: "#6B6560", label: "Note" },
};

function DayItemCard({
  event,
  onSelect,
}: {
  event: ItineraryEvent;
  onSelect: () => void;
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
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${config.color}18` }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-compact text-foreground">{event.title}</span>
              {itemSt === "confirmed" && (
                <span className="rounded border border-[rgba(91,138,110,0.12)] bg-[rgba(91,138,110,0.08)] px-1.5 py-0.5 text-[9px] text-[#5B8A6E]">
                  Confirmed
                </span>
              )}
              {itemSt === "proposed" && (
                <span className="rounded border border-[rgba(184,151,110,0.12)] bg-[rgba(184,151,110,0.08)] px-1.5 py-0.5 text-[9px] text-[#B8976E]">
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
              <div className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-[rgba(255,255,255,0.015)] p-2 transition-colors hover:border-border">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{event.source_product_name ?? "Linked product"}</span>
                {formatProductCommission(event) && (
                  <span className="ml-auto text-[9px] text-[#B8976E]">{formatProductCommission(event)}</span>
                )}
              </div>
            )}
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
            <button type="button" className="rounded p-1 hover:bg-[rgba(255,255,255,0.04)]" aria-label="Reorder">
              <GripVertical className="h-3 w-3 text-muted-foreground/65" />
            </button>
            <button type="button" className="rounded p-1 hover:bg-[rgba(255,255,255,0.04)]" aria-label="More">
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
}: {
  days: ItineraryDay[];
  onEventSelect: (day: ItineraryDay, event: ItineraryEvent) => void;
  onToast: (msg: string) => void;
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
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-[rgba(255,255,255,0.02)]"
                      >
                        <Ico className="h-3.5 w-3.5" /> {label}
                      </button>
                    ))}
                    <div className="my-1 h-px bg-[rgba(255,255,255,0.04)]" />
                    <button
                      type="button"
                      onClick={() => {
                        onToast("Note added (mock)");
                        setOpenDayKey(null);
                        setPhase(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-[rgba(255,255,255,0.02)]"
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
                      placeholder="Search products..."
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
                            className="flex w-full items-center gap-3 rounded py-2 px-1 text-left transition-colors hover:bg-[rgba(255,255,255,0.02)]"
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
                <DayItemCard key={ev.id} event={ev} onSelect={() => onEventSelect(day, ev)} />
              ))}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onToast("Add day — coming soon")}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 px-4 text-xs text-muted-foreground transition-colors hover:border-[rgba(255,255,255,0.10)] hover:text-muted-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Day
      </button>
    </div>
  );
}
