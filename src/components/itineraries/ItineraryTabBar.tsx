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
      className={cn(
        "flex border-b border-[rgba(255,255,255,0.08)] bg-[#0C0C0C]",
        className
      )}
    >
      {TABS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTab(value)}
          className={cn(
            "px-4 py-3 text-[13px] font-medium transition-colors border-b-2 -mb-px",
            activeTab === value
              ? "text-[#F5F5F5] border-[#F5F5F5]"
              : "text-[rgba(245,245,245,0.5)] border-transparent hover:text-[rgba(245,245,245,0.8)]"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
