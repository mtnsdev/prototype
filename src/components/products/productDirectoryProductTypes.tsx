"use client";

import {
  Building2,
  Compass,
  Globe,
  Heart,
  Home,
  Plane,
  Ship,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { DirectoryProductCategory } from "@/types/product-directory";

export type DirectoryProductTypeEntry = {
  id: DirectoryProductCategory;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
};

/** 8-type advisor catalog — colors used for badges, map pins, and filter pills. */
export const DIRECTORY_PRODUCT_TYPE_CONFIG: DirectoryProductTypeEntry[] = [
  {
    id: "hotel",
    label: "Hotel / Resort",
    icon: Building2,
    color: "#B8A082",
    bg: "rgba(184,160,130,0.15)",
    border: "rgba(184,160,130,0.25)",
  },
  {
    id: "villa",
    label: "Villa / Residence",
    icon: Home,
    color: "#A0937E",
    bg: "rgba(160,147,126,0.15)",
    border: "rgba(160,147,126,0.25)",
  },
  {
    id: "restaurant",
    label: "Restaurant",
    icon: UtensilsCrossed,
    color: "#C9A96E",
    bg: "rgba(201,169,110,0.15)",
    border: "rgba(201,169,110,0.25)",
  },
  {
    id: "dmc",
    label: "DMC",
    icon: Globe,
    color: "#82A0A0",
    bg: "rgba(130,160,160,0.15)",
    border: "rgba(130,160,160,0.25)",
  },
  {
    id: "experience",
    label: "Experience / Tour",
    icon: Compass,
    color: "#A08CAA",
    bg: "rgba(160,140,170,0.15)",
    border: "rgba(160,140,170,0.25)",
  },
  {
    id: "cruise",
    label: "Cruise",
    icon: Ship,
    color: "#8296B4",
    bg: "rgba(130,150,180,0.15)",
    border: "rgba(130,150,180,0.25)",
  },
  {
    id: "wellness",
    label: "Wellness / Spa",
    icon: Heart,
    color: "#5B8A6E",
    bg: "rgba(91,138,110,0.15)",
    border: "rgba(91,138,110,0.25)",
  },
  {
    id: "transport",
    label: "Transport",
    icon: Plane,
    color: "#9B9590",
    bg: "rgba(155,149,144,0.15)",
    border: "rgba(155,149,144,0.25)",
  },
];

export function directoryCategoryColors(type: DirectoryProductCategory | string) {
  const t = DIRECTORY_PRODUCT_TYPE_CONFIG.find((pt) => pt.id === type);
  return {
    color: t?.color ?? "#9B9590",
    bg: t?.bg ?? "rgba(155,149,144,0.15)",
    border: t?.border ?? "rgba(155,149,144,0.25)",
  };
}

export function directoryCategoryLabel(type: DirectoryProductCategory | string): string {
  return DIRECTORY_PRODUCT_TYPE_CONFIG.find((pt) => pt.id === type)?.label ?? String(type);
}

export function directoryCategoryMarkerColor(type: DirectoryProductCategory | string): string {
  return directoryCategoryColors(type).color;
}

/** Map free-text type labels (e.g. from search index) to category colors — single source for chips. */
export function inferDirectoryCategoryFromTypeLabel(typeLabel: string): DirectoryProductCategory {
  const s = typeLabel.trim().toLowerCase();
  const exact = DIRECTORY_PRODUCT_TYPE_CONFIG.find((pt) => pt.label.toLowerCase() === s);
  if (exact) return exact.id;
  if (s.includes("dmc")) return "dmc";
  if (s.includes("experience") || s.includes("tour")) return "experience";
  if (s.includes("cruise")) return "cruise";
  if (s.includes("villa")) return "villa";
  if (s.includes("restaurant")) return "restaurant";
  if (s.includes("wellness") || s.includes("spa")) return "wellness";
  if (s.includes("transport")) return "transport";
  if (s.includes("hotel") || s.includes("resort")) return "hotel";
  return "hotel";
}

export function chipStyleFromProductTypeLabel(typeLabel: string) {
  return directoryCategoryColors(inferDirectoryCategoryFromTypeLabel(typeLabel));
}
