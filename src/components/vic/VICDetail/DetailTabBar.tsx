"use client";

import { cn } from "@/lib/utils";

export type DetailTabId =
  | "overview"
  | "identity"
  | "relationship"
  | "preferences"
  | "linked_entities"
  | "sharing"
  | "governance";

export const DETAIL_TABS: { id: DetailTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "identity", label: "Identity" },
  { id: "relationship", label: "Relationship" },
  { id: "preferences", label: "Preferences & documents" },
  { id: "linked_entities", label: "Linked Entities" },
  { id: "sharing", label: "Sharing" },
  { id: "governance", label: "Governance" },
];

type Props = {
  activeTab: DetailTabId;
  onTabChange: (tab: DetailTabId) => void;
};

export default function DetailTabBar({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border -mx-1 overflow-x-auto">
      {DETAIL_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
            activeTab === tab.id
              ? "text-foreground border-[#F5F5F5]"
              : "text-muted-foreground/75 border-transparent hover:text-muted-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
