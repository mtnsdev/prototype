/**
 * Product Cards — category metrics, subcategories, and visual config (Sections 7 & 12).
 */

import type { ProductCategory, VerificationStatus, PartnershipTier, PriceRange, DataOwnershipLevel } from "@/types/product";
import type { LucideIcon } from "lucide-react";
import {
  Bed,
  MapPin,
  Ship,
  Briefcase,
  Compass,
  UtensilsCrossed,
  Car,
} from "lucide-react";

// ─── CATEGORY_METRICS (Section 7) — key metric per category for cards ─────

export type CategoryMetricKey =
  | "star_rating"
  | "destinations_covered"
  | "ship_name"
  | "service_types"
  | "duration"
  | "michelin_stars"
  | "cuisine_type"
  | "vehicle_types";

export const CATEGORY_METRICS: Record<ProductCategory, { key: CategoryMetricKey; label: string }> = {
  accommodation: { key: "star_rating", label: "Star rating" },
  dmc: { key: "destinations_covered", label: "Destinations" },
  cruise: { key: "ship_name", label: "Ship" },
  service_provider: { key: "service_types", label: "Services" },
  activity: { key: "duration", label: "Duration" },
  restaurant: { key: "michelin_stars", label: "Michelin" },
  transportation: { key: "vehicle_types", label: "Vehicles" },
};

// ─── CATEGORY_ICONS (Section 7) ────────────────────────────────────────────

export const CATEGORY_ICONS: Record<ProductCategory, LucideIcon> = {
  accommodation: Bed,
  dmc: MapPin,
  cruise: Ship,
  service_provider: Briefcase,
  activity: Compass,
  restaurant: UtensilsCrossed,
  transportation: Car,
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  accommodation: "Accommodation",
  dmc: "DMC",
  cruise: "Cruise",
  service_provider: "Service Provider",
  activity: "Activity",
  restaurant: "Restaurant",
  transportation: "Transportation",
};

// ─── SUBCATEGORY_OPTIONS (Section 12) ─────────────────────────────────────

export const SUBCATEGORY_OPTIONS: Record<ProductCategory, string[]> = {
  accommodation: [
    "Hotel",
    "Resort",
    "Villa",
    "Apartment",
    "Lodge",
    "Boutique",
    "B&B",
    "Other",
  ],
  dmc: [
    "Incoming",
    "Outgoing",
    "MICE",
    "Incentive",
    "Other",
  ],
  cruise: [
    "Ocean",
    "River",
    "Expedition",
    "Yacht",
    "Other",
  ],
  service_provider: [
    "Concierge",
    "Ground handler",
    "Insurance",
    "Visa",
    "Other",
  ],
  activity: [
    "Tours",
    "Experiences",
    "Adventure",
    "Cultural",
    "Wellness",
    "Other",
  ],
  restaurant: [
    "Fine dining",
    "Casual",
    "Café",
    "Private dining",
    "Other",
  ],
  transportation: [
    "Car",
    "Coach",
    "Private transfer",
    "Chauffeur",
    "Helicopter",
    "Other",
  ],
};

// ─── VERIFICATION_BADGES (Section 7) ───────────────────────────────────────

export const VERIFICATION_BADGES: Record<VerificationStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  unverified: { label: "Unverified", variant: "secondary" },
  pending: { label: "Pending", variant: "outline" },
  verified: { label: "Verified", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

// ─── PARTNERSHIP_TIER (Section 7) ───────────────────────────────────────────

export const PARTNERSHIP_TIER_COLORS: Record<PartnershipTier, string> = {
  preferred: "text-[var(--muted-amber-text)] bg-[var(--muted-amber-bg)] border-[var(--muted-amber-border)]",
  partner: "text-[var(--muted-info-text)] bg-[var(--muted-info-bg)] border-[var(--muted-info-border)]",
  standard: "text-[rgba(245,245,245,0.7)] bg-white/10 border-[rgba(255,255,255,0.12)]",
  none: "text-[rgba(245,245,245,0.5)] bg-white/5 border-[rgba(255,255,255,0.08)]",
};

export const PARTNERSHIP_TIER_LABELS: Record<PartnershipTier, string> = {
  preferred: "Platinum",
  partner: "Gold",
  standard: "Silver",
  none: "None",
};

// ─── PRICE_RANGE_DISPLAY (Section 7) ──────────────────────────────────────

export const PRICE_RANGE_DISPLAY: Record<PriceRange, string> = {
  budget: "Budget",
  mid: "Mid",
  premium: "Premium",
  luxury: "Luxury",
  ultra_luxury: "Ultra Luxury",
};

export const PRICE_RANGE_SYMBOLS: Record<PriceRange, string> = {
  budget: "€",
  mid: "€€",
  premium: "€€€",
  luxury: "€€€€",
  ultra_luxury: "€€€€",
};

// ISO country code → display name for list/card location
export const COUNTRY_NAMES: Record<string, string> = {
  FR: "France", JP: "Japan", IT: "Italy", MV: "Maldives", GB: "United Kingdom", MC: "Monaco", TR: "Turkey", ES: "Spain", CH: "Switzerland", US: "United States",
};

// ─── DATA_LAYER_BADGES (Section 7) ────────────────────────────────────────

export const DATA_LAYER_BADGES: Record<DataOwnershipLevel, { label: string; className: string }> = {
  Enable: { label: "Enable", className: "bg-[var(--muted-info-bg)] text-[var(--muted-info-text)] border-[var(--muted-info-border)]" },
  Agency: { label: "Agency", className: "bg-[var(--muted-success-bg)] text-[var(--muted-success-text)] border-[var(--muted-success-border)]" },
  Advisor: { label: "Advisor", className: "bg-[var(--muted-amber-bg)] text-[var(--muted-amber-text)] border-[var(--muted-amber-border)]" },
};

/** Muted top accent for luxury UI — low-chroma stone/zinc, not saturated primaries */
export const CATEGORY_ACCENT_COLORS: Record<ProductCategory, string> = {
  accommodation: "border-t border-t-stone-500/45",
  dmc: "border-t border-t-stone-400/35",
  cruise: "border-t border-t-zinc-500/40",
  service_provider: "border-t border-t-neutral-500/35",
  activity: "border-t border-t-zinc-600/45",
  restaurant: "border-t border-t-stone-600/40",
  transportation: "border-t border-t-neutral-600/40",
};
