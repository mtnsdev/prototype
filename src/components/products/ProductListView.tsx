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
import {
  listMutedCellClass,
  listPrimaryTextClass,
  listSurfaceClass,
  listScrollClass,
  listTableClass,
  listTdCheckboxClass,
  listTdClass,
  listThCheckboxClass,
  listThClass,
  listTheadRowClass,
  listTbodyRowClass,
  listSurfaceWithState,
} from "@/lib/list-ui";

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
      <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden p-3")}>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(listSurfaceWithState({ refetching: isRefetching }), "transition-opacity")}>
      <table className={listTableClass("min-w-[1000px]")}>
        <thead>
          <tr className={listTheadRowClass}>
            <th className={listThCheckboxClass} scope="col">
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
              <th key={col.key} className={cn(listThClass, col.className)} scope="col">
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className="rounded-md hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    {col.label}{" "}
                    {sortBy === (col.key === "location" ? "city" : col.key) && (sortOrder === "asc" ? "↑" : "↓")}
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
              <tr key={id} className={listTbodyRowClass}>
                <td className={listTdCheckboxClass}>
                  {!isEnableTab && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(id)}
                      onChange={() => onToggleSelect(id)}
                      className="checkbox-on-dark"
                    />
                  )}
                </td>
                <td className={listTdClass}>
                  <Link href={`/dashboard/products/${id}`} className="group flex min-w-0 items-center gap-3">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.06] ring-1 ring-white/[0.08]">
                      <ImageWithFallback
                        fallbackType="product"
                        src={p.hero_image_url}
                        alt={p.name ?? ""}
                        productCategory={p.category as ProductCategory}
                        className="h-full w-full rounded-lg object-cover opacity-90 transition-opacity group-hover:opacity-100"
                      />
                    </span>
                    <span className={cn(listPrimaryTextClass, "truncate group-hover:underline")}>
                      {searchQuery ? highlightSearch(p.name || "—", searchQuery) : p.name || "—"}
                    </span>
                  </Link>
                </td>
                <td className={listTdClass}>
                  <span className="inline-flex items-center gap-1.5">
                    {Icon && <Icon size={14} className="text-muted-foreground" />}
                    {CATEGORY_LABELS[p.category] ?? p.category}
                  </span>
                </td>
                <td className={cn(listTdClass, listMutedCellClass)}>
                  {[p.city, (p.country && COUNTRY_NAMES[p.country]) || p.country].filter(Boolean).join(", ") || "—"}
                </td>
                <td className={listTdClass}>
                  <span className="rounded border border-border-strong bg-muted/30 px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                    {p.status ?? "—"}
                  </span>
                </td>
                <td className={listTdClass}>
                  <span className="rounded border border-border-strong px-1.5 py-0.5 text-xs text-muted-foreground">
                    {p.partnership_tier ? PARTNERSHIP_TIER_LABELS[p.partnership_tier] : "—"}
                  </span>
                </td>
                <td className={listTdClass}>{p.price_range ? PRICE_RANGE_DISPLAY[p.price_range] : "—"}</td>
                <td className={listTdClass}>
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-xs",
                      VERIFICATION_BADGES[ver]?.variant === "default" &&
                        "border-[var(--muted-success-border)] bg-[var(--muted-success-bg)] text-[var(--muted-success-text)]"
                    )}
                  >
                    {VERIFICATION_BADGES[ver]?.label ?? ver}
                  </span>
                </td>
                <td className={listTdClass}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
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
