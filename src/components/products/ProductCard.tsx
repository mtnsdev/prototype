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
  DATA_LAYER_BADGES,
  PARTNERSHIP_TIER_LABELS,
  PRICE_RANGE_DISPLAY,
  PRICE_RANGE_SYMBOLS,
  VERIFICATION_BADGES,
  CATEGORY_METRICS,
} from "@/config/productCategoryConfig";
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

function keyMetricDisplay(p: Product): string {
  const cat = p.category;
  const meta = CATEGORY_METRICS[cat];
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
    return (p as unknown as { vehicle_types: string[] }).vehicle_types.slice(0, 2).join(", ");
  return meta?.label ? `${meta.label}: —` : "—";
}

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
  const layer = (product.data_ownership_level ?? "Advisor") as keyof typeof DATA_LAYER_BADGES;
  const ver = (product.verification_status ?? "unverified") as keyof typeof VERIFICATION_BADGES;
  const location = [product.city, (product.country && COUNTRY_NAMES[product.country]) || product.country].filter(Boolean).join(", ") || "—";

  if (compact) {
    return (
      <div className={cn("rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-3 flex items-center gap-3 border-l-4", accent)}>
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
    <div className={cn("relative rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] overflow-hidden border-l-4 flex flex-col min-h-[200px] hover:border-[rgba(255,255,255,0.12)] transition-colors", accent)}>
      <DemoBadge />
      {product.hero_image_url ? (
        <div className="h-28 bg-white/5 relative">
          <img src={product.hero_image_url} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center bg-white/5">
          <Icon className="h-10 w-10 text-[rgba(245,245,245,0.4)]" />
        </div>
      )}
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
            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
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
        <p className="text-sm text-[rgba(245,245,245,0.6)] truncate">{location}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.8)]">
            {CATEGORY_LABELS[product.category]}
          </span>
          {product.price_range && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-[rgba(245,245,245,0.8)]" title={PRICE_RANGE_DISPLAY[product.price_range]}>
              {PRICE_RANGE_SYMBOLS[product.price_range] ?? PRICE_RANGE_DISPLAY[product.price_range]}
            </span>
          )}
          {product.partnership_tier && product.partnership_tier !== "none" && (
            <span className="text-xs px-1.5 py-0.5 rounded border border-white/20 text-[rgba(245,245,245,0.8)]">
              {PARTNERSHIP_TIER_LABELS[product.partnership_tier]}
            </span>
          )}
          <span className={cn("text-xs px-1.5 py-0.5 rounded border", VERIFICATION_BADGES[ver]?.variant === "default" && "bg-green-500/20 text-green-400 border-green-500/30")}>
            {VERIFICATION_BADGES[ver]?.label ?? ver}
          </span>
          <span className={cn("text-xs px-1.5 py-0.5 rounded border", DATA_LAYER_BADGES[layer]?.className)}>
            {DATA_LAYER_BADGES[layer]?.label}
          </span>
          {(product.is_agency_copy ?? product.enable_product_id) && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border border-[var(--muted-info-border)]">
              Source: Enable
            </span>
          )}
        </div>
        <p className="text-xs text-[rgba(245,245,245,0.5)] mt-auto">{keyMetricDisplay(product)}</p>
      </div>
    </div>
  );
}
