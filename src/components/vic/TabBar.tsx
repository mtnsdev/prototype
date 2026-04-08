"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { APP_TOOLBAR_ROW } from "@/lib/dashboardChrome";
import { cn } from "@/lib/utils";

export type VICTab = "mine" | "shared";

const TABS: { value: VICTab; label: string }[] = [
  { value: "mine", label: "My VICs" },
  { value: "shared", label: "Shared with Me" },
];

type Props = {
  activeTab: VICTab;
  onTabChange?: (tab: VICTab) => void;
  className?: string;
};

export default function TabBar({ activeTab, onTabChange, className }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setTab = (tab: VICTab) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("tab", tab);
    router.push(`/dashboard/vics?${next.toString()}`, { scroll: false });
    onTabChange?.(tab);
  };

  return (
    <div
      className={cn(APP_TOOLBAR_ROW, "justify-start pl-5 pr-[4.5rem] md:pl-6", className)}
      role="presentation"
    >
      <SegmentedControl<VICTab>
        aria-label="VIC scope"
        value={activeTab}
        onChange={setTab}
        options={TABS}
      />
    </div>
  );
}
