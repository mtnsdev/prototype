/**
 * Rep Firm Registry — first-class entity mirroring Partner Programs.
 * A RepFirm is the firm itself; RepFirmProductLink is the join record
 * connecting a firm to a DirectoryProduct.
 */

export type RepFirmSpecialty =
  | "hotels"
  | "dmcs"
  | "camps_lodges"
  | "villas"
  | "cruise"
  | "spas"
  | "transportation"
  | "tourism_board"
  | "multi";

export type RepFirmStatus = "active" | "inactive" | "prospect";

export interface RepFirmHeadquarters {
  city: string | null;
  country: string | null;
  address: string | null;
}

export interface RepFirmSocialMedia {
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
}

export interface RepFirmContactRow {
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  /** When set, supersedes single `email` for display; `email` remains first line for legacy. */
  emailAddresses?: string[];
  /** When set, supersedes single `phone` for display; `phone` remains first line for legacy. */
  phoneNumbers?: string[];
  photoUrl: string | null;
}

export interface RepFirm {
  id: string;
  name: string;
  /** Display / short line — legacy; prefer representativeNames + contacts. */
  tagline?: string;
  /** Longer firm narrative (e.g. Lux Pages); catalog shows description ?? tagline when set. */
  description?: string | null;
  /** e.g. ["Heidi LaRusso", "Camille Durand"] */
  representativeNames: string[];
  specialty: RepFirmSpecialty[];
  /** Regions covered (Lux Pages taxonomy / post-audit labels). */
  regionsCovered: string[];
  phone: string | null;
  headquarters: RepFirmHeadquarters | null;
  websiteUrl: string | null;
  portalUrl: string | null;
  /** Admin-only in UI — never overwritten by Lux sync. */
  portalCredentialsNote: string | null;
  socialMedia: RepFirmSocialMedia | null;
  contacts: RepFirmContactRow[];
  /** Advisor user id — agency-owned. */
  relationshipOwner: string | null;
  /** Agency-owned notes — never overwritten by Lux sync. */
  notes: string | null;
  status: RepFirmStatus;
  logoUrl?: string;
  /** Optional display metric — may diverge from live link count. */
  propertyCount?: number;
  /** Enable-level vs team-specific scope for the registry row. */
  scope: "enable" | string;
  /** ISO date strings. */
  createdAt?: string;
  updatedAt?: string;
  lastEditedAt?: string;
  lastEditedById?: string;
  lastEditedByName?: string;
  luxPagesId?: string | null;
  luxPagesLastSynced?: string | null;
  luxPagesLastVerified?: string | null;
  agencyId?: string;
  createdBy?: string;

  // --- Legacy fields (optional — removed after migration from localStorage) ---
  /** @deprecated Use regionsCovered */
  regions?: string[];
  /** @deprecated Use specialty */
  productTypes?: string[];
  /** @deprecated Use contacts / representativeNames */
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** @deprecated Use websiteUrl */
  website?: string;
}

export interface RepFirmProductLink {
  id: string;
  repFirmId: string;
  repFirmName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** Multiple emails for this product link when using per-product contacts. */
  contactEmails?: string[];
  /** Multiple phone numbers for this product link when using per-product contacts. */
  contactPhones?: string[];
  scope?: "enable" | string;
  status?: "active" | "inactive";
  notes?: string;
  /** e.g. "US market", "European market" */
  market?: string | null;
  lastEditedAt?: string;
  lastEditedById?: string;
  lastEditedByName?: string;
}
