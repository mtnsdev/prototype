"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type ItineraryTab = "mine" | "agency";

const TABS: { value: ItineraryTab; label: string }[] = [
  { value: "mine", label: "My Itineraries" },
  { value: "agency", label: "Agency Itineraries" },
];

type Props = {
  activeTab: ItineraryTab;
  onTabChange?: (tab: ItineraryTab) => void;
  className?: string;
};

export default function ItineraryTabBar({ activeTab, onTabChange, className }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setTab = (tab: ItineraryTab) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("tab", tab);
    router.push(`/dashboard/itineraries?${next.toString()}`, { scroll: false });
    onTabChange?.(tab);
  };

  return (
    <div
      role="tablist"
      aria-label="Itinerary scope"
      className={cn(
        "flex shrink-0 gap-0.5 border-b border-[rgba(255,255,255,0.08)] pl-6 pr-[4.5rem]",
        className
      )}
    >
      {TABS.map(({ value, label }) => {
        const selected = activeTab === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => setTab(value)}
            className={cn(
              "relative px-3 py-2.5 text-[11px] font-medium transition-colors",
              selected ? "text-[#F5F5F5]" : "text-[#6B6560] hover:text-[#9B9590]"
            )}
          >
            {label}
            {selected ? (
              <span
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#C9A96E]"
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
