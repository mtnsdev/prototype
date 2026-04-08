"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { APP_TOOLBAR_ROW } from "@/lib/dashboardChrome";
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
      className={cn(APP_TOOLBAR_ROW, "justify-start pl-5 pr-[4.5rem] md:pl-6", className)}
      role="presentation"
    >
      <SegmentedControl<ItineraryTab>
        aria-label="Itinerary scope"
        value={activeTab}
        onChange={setTab}
        options={TABS}
      />
    </div>
  );
}
