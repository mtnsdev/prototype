"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview" as const, label: "Overview" },
  { id: "location" as const, label: "Location & Access" },
  { id: "commercial" as const, label: "Commercial" },
  { id: "content" as const, label: "Content & Media" },
  { id: "suitability" as const, label: "VIC suitability" },
  { id: "category" as const, label: "Category Details" },
  { id: "governance" as const, label: "Governance" },
];

export type ProductDetailTabId = (typeof TABS)[number]["id"];

type Props = {
  activeTab: ProductDetailTabId;
  onTabChange: (tab: ProductDetailTabId) => void;
  canViewCommercial?: boolean;
};

export default function ProductDetailTabBar({ activeTab, onTabChange, canViewCommercial = true }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const setTab = (tab: ProductDetailTabId) => {
    onTabChange(tab);
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("tab", tab);
    router.replace(`${pathname ?? ""}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex border-b border-border bg-background overflow-x-auto">
      {TABS.map((tab) => {
        const hidden = tab.id === "commercial" && !canViewCommercial;
        if (hidden) return null;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTab(tab.id)}
            className={cn(
              "px-4 py-3 text-compact font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
              activeTab === tab.id
                ? "text-foreground border-[#F5F5F5]"
                : "text-muted-foreground/75 border-transparent hover:text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
