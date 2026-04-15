import type { DirectoryAmenityTag } from "@/types/product-directory";

export type PartnerProgramType =
  | "preferred_partner"
  | "consortium"
  | "direct"
  | "wholesaler"
  | "other";

export type ProgramStatus = "active" | "expiring" | "expired" | "paused" | "archived";

export type CommissionKind = "percentage" | "flat" | "tiered" | "variable";

export type LinkCommissionStatus = "active" | "expiring" | "expired";

export interface ProgramAgencyContact {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface Program {
  id: string;
  name: string;
  network: string | null;
  type: PartnerProgramType;
  termsSummary: string | null;
  commissionRate: string;
  commissionType: CommissionKind;
  commissionCurrency: string;
  amenities: DirectoryAmenityTag[];
  hasPropertyLevelOverrides: boolean;
  agencyContact: ProgramAgencyContact;
  agreementStart: string | null;
  renewalDate: string | null;
  status: ProgramStatus;
  notes: string | null;
  agencyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductProgramLink {
  id: string;
  programId: string;
  productId: string;
  /** Display / override — null means fall back to program default when overrides are enabled. */
  commissionRate: string | null;
  commissionType: CommissionKind | null;
  currency: string | null;
  effectiveFrom: string;
  expiresAt: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  /** Property-level amenity override when program.hasPropertyLevelOverrides. */
  amenities: DirectoryAmenityTag[] | null;
  status: LinkCommissionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Derived at runtime for display / commission rules — not persisted on `Promotion`. */
export type PromotionDerivedKind = "rate_override" | "bonus" | "seasonal" | "volume_incentive";

export type PromotionRateType = "percentage" | "flat";

export type VolumeMetric = "room_nights" | "bookings" | "revenue";

export interface Promotion {
  id: string;
  programId: string;
  productIds: string[] | "all";
  name: string;
  rateValue: string;
  rateType: PromotionRateType;
  stacksWithBase: boolean;
  bookingWindowStart: string | null;
  bookingWindowEnd: string | null;
  travelWindowStart: string | null;
  travelWindowEnd: string | null;
  volumeThreshold: number | null;
  volumeMetric: VolumeMetric | null;
  volumeRetroactive: boolean;
  eligibilityNotes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PartnerProgramsSnapshot {
  programs: Program[];
  links: ProductProgramLink[];
  promotions: Promotion[];
}
