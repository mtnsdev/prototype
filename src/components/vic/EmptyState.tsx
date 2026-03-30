"use client";

import { UserPlus, Upload, Users, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export type EmptyStateTab = "mine" | "shared" | "agency";

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
    const copy =
      tab === "shared"
        ? { title: "No VICs shared with you", body: "No VICs have been shared with you yet. Ask a colleague to share a VIC with you." }
        : tab === "agency"
          ? { title: "No VICs in agency directory", body: "No VICs are published to the agency directory yet." }
          : { title: "No VICs yet", body: "Add your first VIC to get started." };
    const Icon = tab === "shared" ? Users : tab === "agency" ? FolderOpen : UserPlus;

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[280px]">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground/75" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">{copy.title}</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{copy.body}</p>
        {isMine && (
          <div className="flex flex-wrap gap-3 justify-center">
            {onAddVIC && (
              <Button onClick={onAddVIC} className="gap-2">
                <UserPlus size={16} />
                Add VIC
              </Button>
            )}
            {onImportCSV && (
              <Button variant="outline" onClick={onImportCSV} className="gap-2">
                <Upload size={16} />
                Import from CSV
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[200px]">
      <p className="text-sm text-muted-foreground mb-4">
        No VICs match your search. Try different keywords or clear your filters.
      </p>
      {onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
