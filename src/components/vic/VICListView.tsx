"use client";

import type { VIC } from "@/types/vic";
import { getVICId } from "@/lib/vic-api";
import VICListRow from "./VICListRow";
import { cn } from "@/lib/utils";

type Props = {
  vics: VIC[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (by: string, order: "asc" | "desc") => void;
  selectedVicIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (vic: VIC) => void;
  onDelete: (vic: VIC) => void;
  canEdit: (vic: VIC) => boolean;
  canDelete: (vic: VIC) => boolean;
  viewLevel?: (vic: VIC) => "full" | "basic" | "none";
  showRequestFullAccess?: boolean;
  onRequestFullAccess?: () => void;
};

const COLUMNS: { key: string; label: string; sortable?: boolean; className?: string }[] = [
  { key: "_", label: "" },
  { key: "full_name", label: "Name", sortable: true },
  { key: "email", label: "Email", sortable: true, className: "hidden md:table-cell" },
  { key: "phone", label: "Phone", sortable: false, className: "hidden lg:table-cell" },
  { key: "city_country", label: "City / Country", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "acuity", label: "Acuity", sortable: true },
  { key: "tags", label: "Tags", sortable: false },
  { key: "actions", label: "Actions", sortable: false },
];

export default function VICListView({
  vics,
  isLoading,
  sortBy,
  sortOrder,
  onSortChange,
  selectedVicIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  viewLevel: viewLevelFn,
  showRequestFullAccess,
  onRequestFullAccess,
}: Props) {
  const sortKey = (colKey: string) => {
    if (colKey === "city_country") return "city";
    if (colKey === "status") return "relationship_status";
    if (colKey === "acuity") return "acuity_status";
    return colKey;
  };
  const handleSort = (key: string) => {
    const by = sortKey(key);
    if (by === key || ["full_name", "email", "createdAt", "city", "relationship_status", "acuity_status"].includes(by)) {
      onSortChange(by, sortBy === by && sortOrder === "asc" ? "desc" : "asc");
    }
  };

  const isRefetching = isLoading && vics.length > 0;

  return (
    <div className={cn("overflow-x-auto transition-opacity", isRefetching && "opacity-70")}>
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.08)] text-left text-xs font-medium uppercase tracking-wider text-[rgba(245,245,245,0.5)]">
            <th className="w-10 py-3 pl-4">
              <input
                type="checkbox"
                checked={vics.length > 0 && selectedVicIds.size === vics.length}
                onChange={onToggleSelectAll}
                className="rounded border-white/20 bg-white/5"
              />
            </th>
            {COLUMNS.slice(1).map((col) => (
              <th key={col.key} className={cn("py-3 pr-2", col.className)}>
                {col.sortable ? (
                  <button type="button" onClick={() => handleSort(col.key)} className="hover:text-[rgba(245,245,245,0.8)]">
                    {col.label} {sortBy === sortKey(col.key) ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && vics.length === 0 ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-[rgba(255,255,255,0.06)]">
                  <td className="w-10 py-3 pl-4"><div className="h-4 w-4 rounded bg-white/10 animate-pulse" /></td>
                  <td className="py-3"><div className="h-4 w-28 bg-white/10 rounded animate-pulse" /></td>
                  <td className="py-3 hidden md:table-cell"><div className="h-4 w-36 bg-white/10 rounded animate-pulse" /></td>
                  <td className="py-3 hidden lg:table-cell"><div className="h-4 w-24 bg-white/10 rounded animate-pulse" /></td>
                  <td className="py-3"><div className="h-4 w-32 bg-white/10 rounded animate-pulse" /></td>
                  <td className="py-3"><div className="h-4 w-16 bg-white/10 rounded animate-pulse" /></td>
                  <td className="py-3"><div className="h-4 w-20 bg-white/10 rounded animate-pulse" /></td>
                  <td className="py-3"><div className="h-4 w-24 bg-white/10 rounded animate-pulse" /></td>
                  <td className="py-2 pr-4"><div className="h-8 w-8 bg-white/10 rounded animate-pulse" /></td>
                </tr>
              ))}
            </>
          ) : (
            vics.map((vic) => {
              const id = getVICId(vic);
              return (
                <VICListRow
                  key={id}
                  vic={vic}
                  vicId={id}
                  isSelected={selectedVicIds.has(id)}
                  onToggleSelect={() => onToggleSelect(id)}
                  onEdit={() => onEdit(vic)}
                  onDelete={() => onDelete(vic)}
                  canEdit={canEdit(vic)}
                  canDelete={canDelete(vic)}
                  viewLevel={viewLevelFn?.(vic) ?? "full"}
                  showRequestFullAccess={showRequestFullAccess}
                  onRequestFullAccess={onRequestFullAccess}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
