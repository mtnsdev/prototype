"use client";

import type { VIC } from "@/types/vic";
import { getVICId } from "@/lib/vic-api";
import VICCard from "./VICCard";

type Props = {
  vics: VIC[];
  isLoading: boolean;
  onEdit: (vic: VIC) => void;
  onDelete: (vic: VIC) => void;
  onShare?: (vic: VIC) => void;
  canEdit: (vic: VIC) => boolean;
  canDelete: (vic: VIC) => boolean;
  canShare?: (vic: VIC) => boolean;
  viewLevel?: (vic: VIC) => "full" | "basic" | "none";
  showRequestFullAccess?: boolean;
  onRequestFullAccess?: () => void;
};

export default function VICCardView({
  vics,
  isLoading,
  onEdit,
  onDelete,
  onShare,
  canEdit,
  canDelete,
  canShare,
  viewLevel: viewLevelFn,
  showRequestFullAccess,
  onRequestFullAccess,
}: Props) {
  if (isLoading && vics.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-[rgba(255,255,255,0.03)] h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {vics.map((vic) => (
        <VICCard
          key={getVICId(vic)}
          vic={vic}
          onEdit={() => onEdit(vic)}
          onDelete={() => onDelete(vic)}
          onShare={onShare ? () => onShare(vic) : undefined}
          canEdit={canEdit(vic)}
          canDelete={canDelete(vic)}
          canShare={canShare?.(vic)}
          viewLevel={viewLevelFn?.(vic) ?? "full"}
          showRequestFullAccess={showRequestFullAccess}
          onRequestFullAccess={onRequestFullAccess}
        />
      ))}
    </div>
  );
}
