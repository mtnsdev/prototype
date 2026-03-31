/**
 * Rep Firm Registry — first-class entity mirroring Partner Programs.
 * A RepFirm is the firm itself; RepFirmProductLink is the join record
 * connecting a firm to a DirectoryProduct (like DirectoryPartnerProgram
 * connects a program to a product).
 */

export interface RepFirm {
  id: string;
  name: string;
  /** Short tagline shown in list views. */
  tagline?: string;
  website?: string;
  logoUrl?: string;
  /** Primary contact name. */
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** Regions the firm covers (e.g. ["Europe", "Middle East"]). */
  regions: string[];
  /** Which product types they represent: hotel, villa, cruise, etc. */
  productTypes: string[];
  /** How many properties they represent (display metric). */
  propertyCount?: number;
  /** Enable-level vs agency-specific. */
  scope: "enable" | string;
  status: "active" | "inactive";
  /** ISO date strings. */
  createdAt?: string;
  updatedAt?: string;
  /** Audit metadata for admin edits (directory rep-firms tab). */
  lastEditedAt?: string;
  lastEditedById?: string;
  lastEditedByName?: string;
}

export interface RepFirmProductLink {
  id: string;
  /** References RepFirm.id */
  repFirmId: string;
  /** Display name of the firm (denormalized for card rendering). */
  repFirmName: string;
  /** The rep at this firm who handles this specific property. */
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** Scope: enable-curated vs team-specific. */
  scope?: "enable" | string;
  status?: "active" | "inactive";
  /** Optional notes about the relationship. */
  notes?: string;
  /** Audit trail. */
  lastEditedAt?: string;
  lastEditedById?: string;
  lastEditedByName?: string;
}
