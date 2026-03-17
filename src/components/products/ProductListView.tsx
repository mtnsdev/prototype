"use client";

import Link from "next/link";
import type { Product } from "@/types/product";
import { getProductId } from "@/lib/products-api";
import { CATEGORY_LABELS, COUNTRY_NAMES, DATA_LAYER_BADGES, PARTNERSHIP_TIER_LABELS, PRICE_RANGE_DISPLAY, VERIFICATION_BADGES } from "@/config/productCategoryConfig";
import { cn } from "@/lib/utils";
import { highlightSearch } from "@/utils/searchHighlight";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COLUMNS: { key: string; label: string; sortable?: boolean; className?: string }[] = [
  { key: "_", label: "" },
  { key: "name", label: "Name", sortable: true },
  { key: "location", label: "Location", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "key_metric", label: "Key metric", sortable: false },
  { key: "price_range", label: "Price", sortable: true },
  { key: "partnership_tier", label: "Partnership", sortable: true },
  { key: "verification", label: "Verification", sortable: true },
  { key: "data_layer", label: "Layer", sortable: false },
  { key: "actions", label: "Actions", sortable: false },
];

type Props = {
  products: Product[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (by: string, order: "asc" | "desc") => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onCopyToAgency?: (p: Product) => void;
  canEdit: (p: Product) => boolean;
  canDelete: (p: Product) => boolean;
  isEnableTab?: boolean;
  searchQuery?: string;
};

function keyMetric(p: Product): string {
  const cat = p.category;
  if (cat === "accommodation" && (p as unknown as { star_rating?: number }).star_rating != null)
    return `${(p as unknown as { star_rating: number }).star_rating}★`;
  if (cat === "dmc" && (p as unknown as { destinations_covered?: string[] }).destinations_covered?.length)
    return `${(p as unknown as { destinations_covered: string[] }).destinations_covered.length} destinations`;
  if (cat === "cruise" && (p as unknown as { ship_name?: string }).ship_name)
    return (p as unknown as { ship_name: string }).ship_name;
  if (cat === "service_provider" && (p as unknown as { service_types?: string[] }).service_types?.length)
    return `${(p as unknown as { service_types: string[] }).service_types.length} services`;
  if (cat === "activity" && (p as unknown as { duration?: string }).duration)
    return (p as unknown as { duration: string }).duration;
  if (cat === "restaurant") {
    const r = p as unknown as { michelin_stars?: number; cuisine_type?: string };
    if (r.michelin_stars != null) return `${r.michelin_stars}★`;
    if (r.cuisine_type) return r.cuisine_type;
  }
  if (cat === "transportation" && (p as unknown as { vehicle_types?: string[] }).vehicle_types?.length)
    return (p as unknown as { vehicle_types: string[] }).vehicle_types.join(", ");
  return "—";
}

export default function ProductListView({
  products,
  isLoading,
  sortBy,
  sortOrder,
  onSortChange,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onCopyToAgency,
  canEdit,
  canDelete,
  isEnableTab = false,
  searchQuery,
}: Props) {
  const handleSort = (key: string) => {
    const by = key === "location" ? "city" : key;
    if (["name", "city", "category", "price_range", "partnership_tier", "verification_status", "updated_at"].includes(by))
      onSortChange(by, sortBy === by && sortOrder === "asc" ? "desc" : "asc");
  };

  const isRefetching = isLoading && products.length > 0;

  if (isLoading && products.length === 0) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto transition-opacity", isRefetching && "opacity-70")}>
      <table className="w-full min-w-[1000px]">
        <thead>
          <tr className="border-b border-[rgba(255,255,255,0.08)] text-left text-xs font-medium uppercase tracking-wider text-[rgba(245,245,245,0.5)]">
            <th className="w-10 py-3 pl-4">
              {!isEnableTab && (
                <input
                  type="checkbox"
                  checked={products.length > 0 && selectedIds.size === products.length}
                  onChange={onToggleSelectAll}
                  className="rounded border-white/20 bg-white/5"
                />
              )}
            </th>
            {COLUMNS.filter((c) => c.key !== "_").map((col) => (
              <th
                key={col.key}
                className={cn("py-3 px-2", col.className)}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className="hover:text-[#F5F5F5]"
                  >
                    {col.label} {sortBy === (col.key === "location" ? "city" : col.key) && (sortOrder === "asc" ? "↑" : "↓")}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const id = getProductId(p);
            const layer = (p.data_ownership_level ?? "Advisor") as keyof typeof DATA_LAYER_BADGES;
            const ver = (p.verification_status ?? "unverified") as keyof typeof VERIFICATION_BADGES;
            return (
              <tr
                key={id}
                className="border-b border-[rgba(255,255,255,0.06)] hover:bg-white/[0.04]"
              >
                <td className="w-10 py-2 pl-4">
                  {!isEnableTab && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(id)}
                      onChange={() => onToggleSelect(id)}
                      className="rounded border-white/20 bg-white/5"
                    />
                  )}
                </td>
                <td className="py-2 px-2">
                  <Link href={`/dashboard/products/${id}`} className="font-medium text-[#F5F5F5] hover:underline">
                    {searchQuery ? highlightSearch(p.name || "—", searchQuery) : (p.name || "—")}
                  </Link>
                </td>
                <td className="py-2 px-2 text-sm text-[rgba(245,245,245,0.8)]">
                  {[p.city, (p.country && COUNTRY_NAMES[p.country]) || p.country].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="py-2 px-2 text-sm">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                <td className="py-2 px-2 text-sm text-[rgba(245,245,245,0.7)]">{keyMetric(p)}</td>
                <td className="py-2 px-2 text-sm">
                  {p.price_range ? PRICE_RANGE_DISPLAY[p.price_range] : "—"}
                </td>
                <td className="py-2 px-2 text-sm">{p.partnership_tier ? PARTNERSHIP_TIER_LABELS[p.partnership_tier] : "—"}</td>
                <td className="py-2 px-2">
                  <span className={cn("text-xs px-1.5 py-0.5 rounded border", VERIFICATION_BADGES[ver]?.variant === "default" && "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)]")}>
                    {VERIFICATION_BADGES[ver]?.label ?? ver}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <span className={cn("text-xs px-1.5 py-0.5 rounded border", DATA_LAYER_BADGES[layer]?.className)}>
                    {DATA_LAYER_BADGES[layer]?.label ?? layer}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[rgba(245,245,245,0.6)]">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/products/${id}`}>View</Link>
                      </DropdownMenuItem>
                      {canEdit(p) && (
                        <DropdownMenuItem onClick={() => onEdit(p)}>
                          <Pencil size={14} className="mr-2" /> Edit
                        </DropdownMenuItem>
                      )}
                      {isEnableTab && onCopyToAgency && (
                        <DropdownMenuItem onClick={() => onCopyToAgency(p)}>
                          <Copy size={14} className="mr-2" /> Copy to Agency
                        </DropdownMenuItem>
                      )}
                      {canDelete(p) && (
                        <DropdownMenuItem onClick={() => onDelete(p)} className="text-red-400">
                          <Trash2 size={14} className="mr-2" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
