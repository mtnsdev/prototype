"use client";

import type { VIC } from "@/types/vic";
import { getVICId } from "@/lib/vic-api";
import VICListRow from "./VICListRow";
import { cn } from "@/lib/utils";
import {
  listSurfaceWithState,
  listTableClass,
  listTheadRowClass,
  listTdCheckboxClass,
  listTdClass,
  listThCheckboxClass,
  listThClass,
  listTbodyRowClass,
} from "@/lib/list-ui";

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
    <div className={cn(listSurfaceWithState({ refetching: isRefetching }), "transition-opacity")}>
      <table className={listTableClass("min-w-[900px]")}>
        <thead>
          <tr className={listTheadRowClass}>
            <th className={listThCheckboxClass} scope="col">
              <input
                type="checkbox"
                checked={vics.length > 0 && selectedVicIds.size === vics.length}
                onChange={onToggleSelectAll}
                className="checkbox-on-dark"
              />
            </th>
            {COLUMNS.slice(1).map((col) => (
              <th key={col.key} className={cn(listThClass, col.className)} scope="col">
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className="rounded-md hover:bg-foreground/[0.06] hover:text-foreground"
                  >
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
                <tr key={i} className={listTbodyRowClass}>
                  <td className={listTdCheckboxClass}>
                    <div className="h-4 w-4 rounded bg-white/10 animate-pulse" />
                  </td>
                  <td className={listTdClass}>
                    <div className="h-4 w-28 rounded bg-white/10 animate-pulse" />
                  </td>
                  <td className={cn(listTdClass, "hidden md:table-cell")}>
                    <div className="h-4 w-36 rounded bg-white/10 animate-pulse" />
                  </td>
                  <td className={cn(listTdClass, "hidden lg:table-cell")}>
                    <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                  </td>
                  <td className={listTdClass}>
                    <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
                  </td>
                  <td className={listTdClass}>
                    <div className="h-4 w-16 rounded bg-white/10 animate-pulse" />
                  </td>
                  <td className={listTdClass}>
                    <div className="h-4 w-20 rounded bg-white/10 animate-pulse" />
                  </td>
                  <td className={cn(listTdClass, "pr-4 text-right")}>
                    <div className="ml-auto h-8 w-8 rounded bg-white/10 animate-pulse" />
                  </td>
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
