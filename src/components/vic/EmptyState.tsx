"use client";

import { UserPlus, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyVICs, EmptySearchResults } from "@/components/ui/empty-states";

export type EmptyStateTab = "mine" | "shared";

type Props = {
  isNoVICs: boolean;
  tab?: EmptyStateTab;
  onAddVIC?: () => void;
  onImportCSV?: () => void;
  onClearFilters?: () => void;
};

export default function EmptyState({ isNoVICs, tab = "mine", onAddVIC, onImportCSV, onClearFilters }: Props) {
  if (isNoVICs) {
    const isMine = tab === "mine";

    if (tab === "shared") {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[280px]">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground/75" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No VICs shared with you</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            No VICs have been shared with you yet. Ask a colleague to share a VIC with you.
          </p>
        </div>
      );
    }

    return (
      <div className="min-h-[280px] flex flex-col items-center justify-center">
        <EmptyVICs
          action={onAddVIC ? { label: "Add VIC", onClick: onAddVIC } : undefined}
          className="w-full px-4"
        />
        {onImportCSV && (
          <Button variant="outline" onClick={onImportCSV} className="gap-2 mt-4">
            <Upload size={16} />
            Import from CSV
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center px-4">
      <EmptySearchResults className="w-full" />
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters} className="mt-4">
          Clear filters
        </Button>
      )}
    </div>
  );
}
