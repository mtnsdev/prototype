"use client";

import Link from "next/link";
import type { Product } from "@/types/product";
import { getProductId } from "@/lib/products-api";
import { CATEGORY_ICONS, CATEGORY_LABELS, COUNTRY_NAMES, PARTNERSHIP_TIER_LABELS, PRICE_RANGE_DISPLAY, VERIFICATION_BADGES } from "@/config/productCategoryConfig";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import type { ProductCategory } from "@/types/product";
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
  { key: "category", label: "Category", sortable: true },
  { key: "location", label: "Location", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "partnership_tier", label: "Tier", sortable: true },
  { key: "price_range", label: "Price range", sortable: true },
  { key: "verification", label: "Verification", sortable: true },
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
    const by = key === "location" ? "city" : key === "verification" ? "verification_status" : key;
    if (["name", "city", "category", "status", "price_range", "partnership_tier", "verification_status", "updated_at"].includes(by))
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
                  className="checkbox-on-dark"
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
            const ver = (p.verification_status ?? "unverified") as keyof typeof VERIFICATION_BADGES;
            const Icon = CATEGORY_ICONS[p.category];
            return (
              <tr
                key={id}
                className="border-b border-[rgba(255,255,255,0.06)] hover:bg-white/[0.05]"
              >
                <td className="w-10 py-2 pl-4">
                  {!isEnableTab && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(id)}
                      onChange={() => onToggleSelect(id)}
                      className="checkbox-on-dark"
                    />
                  )}
                </td>
                <td className="py-2 px-2">
                  <Link href={`/dashboard/products/${id}`} className="flex items-center gap-3 min-w-0 group">
                    <span className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 ring-1 ring-white/10">
                      <ImageWithFallback
                        fallbackType="product"
                        src={p.hero_image_url}
                        alt={p.name ?? ""}
                        productCategory={p.category as ProductCategory}
                        className="w-full h-full object-cover rounded-lg opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                    </span>
                    <span className="font-semibold text-[#F5F5F5] group-hover:underline truncate">
                      {searchQuery ? highlightSearch(p.name || "—", searchQuery) : (p.name || "—")}
                    </span>
                  </Link>
                </td>
                <td className="py-2 px-2 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    {Icon && <Icon size={14} className="text-[rgba(245,245,245,0.6)]" />}
                    {CATEGORY_LABELS[p.category] ?? p.category}
                  </span>
                </td>
                <td className="py-2 px-2 text-sm text-[rgba(245,245,245,0.8)]">
                  {[p.city, (p.country && COUNTRY_NAMES[p.country]) || p.country].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="py-2 px-2">
                  <span className="text-xs px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] bg-white/5 text-[rgba(245,245,245,0.8)] capitalize">
                    {p.status ?? "—"}
                  </span>
                </td>
                <td className="py-2 px-2 text-sm">
                  <span className="text-xs px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-[rgba(245,245,245,0.8)]">
                    {p.partnership_tier ? PARTNERSHIP_TIER_LABELS[p.partnership_tier] : "—"}
                  </span>
                </td>
                <td className="py-2 px-2 text-sm">
                  {p.price_range ? PRICE_RANGE_DISPLAY[p.price_range] : "—"}
                </td>
                <td className="py-2 px-2">
                  <span className={cn("text-xs px-1.5 py-0.5 rounded border", VERIFICATION_BADGES[ver]?.variant === "default" && "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)]")}>
                    {VERIFICATION_BADGES[ver]?.label ?? ver}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[rgba(245,245,245,0.6)]">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
