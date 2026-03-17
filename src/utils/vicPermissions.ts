/**
 * VIC permission helpers (Section 11).
 * All functions take current user and optional agency context.
 */

import type { VIC, SharedAccess, SharingLevel } from "@/types/vic";

export type CurrentUser = {
  id: number | string;
  role: string;
  agency_id?: string | null;
};

/**
 * Can the user view this VIC at all?
 * - Owner (assigned_advisor_id or created_by), shared_with (any level), or agency directory (is_shared_to_agency).
 */
function ownerId(vic: VIC): string | undefined {
  const id = vic.created_by ?? (vic as { createdBy?: string }).createdBy;
  return id != null ? String(id) : undefined;
}

export function canViewVIC(user: CurrentUser | null, vic: VIC | null): boolean {
  if (!user || !vic) return false;
  const uid = String(user.id);
  if (ownerId(vic) === uid || (vic.assigned_advisor_id != null && String(vic.assigned_advisor_id) === uid)) return true;
  if (vic.shared_with?.some((s: SharedAccess) => String(s.advisor_id) === uid)) return true;
  if (vic.is_shared_to_agency && user.agency_id) return true;
  if (user.role === "admin" && user.agency_id) return true;
  return false;
}

/**
 * Can the user edit this VIC?
 * - Owner (assigned_advisor_id or created_by), or shared_with with access_level "edit", or admin.
 */
export function canEditVIC(user: CurrentUser | null, vic: VIC | null): boolean {
  if (!user || !vic) return false;
  const uid = String(user.id);
  if (user.role === "admin") return true;
  if (ownerId(vic) === uid || (vic.assigned_advisor_id != null && String(vic.assigned_advisor_id) === uid)) return true;
  const shared = vic.shared_with?.find((s: SharedAccess) => String(s.advisor_id) === uid);
  return shared?.access_level === "edit";
}

/**
 * Can the user delete this VIC?
 * - Owner (assigned_advisor_id or created_by) or admin.
 */
export function canDeleteVIC(user: CurrentUser | null, vic: VIC | null): boolean {
  if (!user || !vic) return false;
  const uid = String(user.id);
  if (user.role === "admin") return true;
  return ownerId(vic) === uid || (vic.assigned_advisor_id != null && String(vic.assigned_advisor_id) === uid);
}

/**
 * Can the user change sharing (share modal, change level, add/remove advisors)?
 * - Owner or admin.
 */
export function canShareVIC(user: CurrentUser | null, vic: VIC | null): boolean {
  if (!user || !vic) return false;
  const uid = String(user.id);
  if (user.role === "admin") return true;
  return ownerId(vic) === uid || (vic.assigned_advisor_id != null && String(vic.assigned_advisor_id) === uid);
}

/**
 * Can the user see unmasked PII (passport, KTN, full membership_id)?
 * - Owner, or shared_with with sharing_level "full", or admin.
 */
export function canViewSensitiveFields(user: CurrentUser | null, vic: VIC | null): boolean {
  if (!user || !vic) return false;
  const uid = String(user.id);
  if (user.role === "admin") return true;
  const oid = ownerId(vic);
  if (oid === uid) return true;
  const aid = vic.assigned_advisor_id != null ? String(vic.assigned_advisor_id) : undefined;
  if (aid === uid) return true;
  const shared = vic.shared_with?.find((s: SharedAccess) => String(s.advisor_id) === uid);
  return shared?.access_level === "edit" && vic.sharing_level === "full";
}

/**
 * Effective view level for this user on this VIC: "full" | "basic" | "none".
 * - "full": owner or shared with full/edit, or admin.
 * - "basic": shared with basic (name + contact only).
 * - "none": no access.
 */
export function getVICViewLevel(user: CurrentUser | null, vic: VIC | null): "full" | "basic" | "none" {
  if (!user || !vic) return "none";
  const uid = String(user.id);
  if (user.role === "admin") return "full";
  if (vic.assigned_advisor_id === uid || ownerId(vic) === uid) return "full";
  if (vic.is_shared_to_agency && user.agency_id) return "basic"; // agency directory read-only
  const shared = vic.shared_with?.find((s: SharedAccess) => String(s.advisor_id) === uid);
  if (!shared) return "none";
  if (vic.sharing_level === "full" || shared.access_level === "edit") return "full";
  if (vic.sharing_level === "basic") return "basic";
  return "none";
}
