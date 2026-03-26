"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, Copy } from "lucide-react";
import type { Product } from "@/types/product";
import { getProductId } from "@/lib/products-api";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_ACCENT_COLORS,
  COUNTRY_NAMES,
  PARTNERSHIP_TIER_LABELS,
  PRICE_RANGE_DISPLAY,
  PRICE_RANGE_SYMBOLS,
  VERIFICATION_BADGES,
} from "@/config/productCategoryConfig";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import type { ProductCategory } from "@/types/product";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { highlightSearch } from "@/utils/searchHighlight";
import { DemoBadge } from "@/components/ui/DemoBadge";

type Props = {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onCopyToAgency?: () => void;
  canEdit: boolean;
  canDelete: boolean;
  isEnableTab?: boolean;
  compact?: boolean;
  searchQuery?: string;
};

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  onCopyToAgency,
  canEdit,
  canDelete,
  isEnableTab = false,
  compact = false,
  searchQuery,
}: Props) {
  const id = getProductId(product);
  const Icon = CATEGORY_ICONS[product.category];
  const accent = CATEGORY_ACCENT_COLORS[product.category];
  const ver = (product.verification_status ?? "unverified") as keyof typeof VERIFICATION_BADGES;
  const location = [product.city, (product.country && COUNTRY_NAMES[product.country]) || product.country].filter(Boolean).join(", ") || "—";

  if (compact) {
    return (
      <div className={cn("rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3 flex items-center gap-3", accent)}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#F5F5F5]">
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/dashboard/products/${id}`} className="font-medium text-[#F5F5F5] hover:underline block truncate">
            {searchQuery ? highlightSearch(product.name || "—", searchQuery) : (product.name || "—")}
          </Link>
          <p className="text-xs text-[rgba(245,245,245,0.5)] truncate">{location}</p>
        </div>
        <span className="text-xs text-[rgba(245,245,245,0.6)] shrink-0">{CATEGORY_LABELS[product.category]}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] overflow-hidden flex flex-col min-h-[200px] hover:border-[rgba(255,255,255,0.14)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 transition-all duration-200", accent)}>
      <DemoBadge />
      <div className="aspect-video w-full relative overflow-hidden rounded-t-xl bg-zinc-900">
        <ImageWithFallback
          fallbackType="product"
          src={product.hero_image_url}
          alt={product.name}
          productCategory={product.category as ProductCategory}
          className="w-full h-full object-cover opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,12,12,0.4)] to-transparent pointer-events-none rounded-t-xl" />
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/dashboard/products/${id}`} className="font-semibold text-[#F5F5F5] hover:underline line-clamp-2 flex-1 min-w-0">
            {searchQuery ? highlightSearch(product.name || "—", searchQuery) : (product.name || "—")}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-[rgba(245,245,245,0.6)]">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/products/${id}`}>View</Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil size={14} className="mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {isEnableTab && onCopyToAgency && (
                <DropdownMenuItem onClick={onCopyToAgency}>
                  <Copy size={14} className="mr-2" /> Copy to Agency
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-400">
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm text-[rgba(245,245,245,0.5)]">{location}</p>
        {product.description && (
          <p className="text-sm text-[rgba(245,245,245,0.7)] line-clamp-2">{product.description}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {product.price_range && (
            <span className="text-xs text-[rgba(245,245,245,0.7)]" title={PRICE_RANGE_DISPLAY[product.price_range]}>
              {PRICE_RANGE_SYMBOLS[product.price_range] ?? PRICE_RANGE_DISPLAY[product.price_range]}
            </span>
          )}
          {product.partnership_tier && product.partnership_tier !== "none" && (
            <span className="text-xs px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.2)] text-[rgba(245,245,245,0.8)]">
              {PARTNERSHIP_TIER_LABELS[product.partnership_tier]}
            </span>
          )}
          <span className={cn("text-xs px-1.5 py-0.5 rounded border border-white/10", VERIFICATION_BADGES[ver]?.variant === "default" && "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border-[var(--muted-success-border)]")}>
            {VERIFICATION_BADGES[ver]?.label ?? ver}
          </span>
        </div>
      </div>
    </div>
  );
}
