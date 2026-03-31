/**
 * VIC permission helpers (Section 11).
 * All functions take current user and optional agency context.
 */

import type { Team } from "@/types/teams";
import type { VIC, SharedAccess, TeamSharedAccess } from "@/types/vic";

export type CurrentUser = {
  id: number | string;
  role: string;
  agency_id?: string | null;
};

/** When provided, team-based shares on the VIC are evaluated (shared_with_teams). */
export type VicPermissionContext = {
  teams?: Team[];
};

function userTeamIds(uid: string, teams: Team[] | undefined): Set<string> {
  if (!teams?.length) return new Set();
  const ids = new Set<string>();
  for (const t of teams) {
    if (t.memberIds.some((m) => String(m) === uid)) ids.add(t.id);
  }
  return ids;
}

function teamShareForUser(vic: VIC, uid: string, teams: Team[] | undefined): TeamSharedAccess | undefined {
  if (!teams?.length || !vic.shared_with_teams?.length) return undefined;
  const memberOf = userTeamIds(uid, teams);
  return vic.shared_with_teams.find((s) => memberOf.has(s.team_id));
}

/**
 * Can the user view this VIC at all?
 * - Owner (assigned_advisor_id or created_by), shared_with (any level), or agency directory (is_shared_to_agency).
 */
function ownerId(vic: VIC): string | undefined {
  const id = vic.created_by ?? (vic as { createdBy?: string }).createdBy;
  return id != null ? String(id) : undefined;
}

export function canViewVIC(user: CurrentUser | null, vic: VIC | null, ctx?: VicPermissionContext): boolean {
  if (!user || !vic) return false;
  const uid = String(user.id);
  if (ownerId(vic) === uid || (vic.assigned_advisor_id != null && String(vic.assigned_advisor_id) === uid)) return true;
  if (vic.shared_with?.some((s: SharedAccess) => String(s.advisor_id) === uid)) return true;
  if (teamShareForUser(vic, uid, ctx?.teams)) return true;
  if (vic.is_shared_to_agency && user.agency_id) return true;
  if (user.role === "admin" && user.agency_id) return true;
  return false;
}

/**
 * Can the user edit this VIC?
 * - Owner (assigned_advisor_id or created_by), or shared_with with access_level "edit", or admin.
 */
export function canEditVIC(user: CurrentUser | null, vic: VIC | null, ctx?: VicPermissionContext): boolean {
  if (!user || !vic) return false;
  const uid = String(user.id);
  if (user.role === "admin") return true;
  if (ownerId(vic) === uid || (vic.assigned_advisor_id != null && String(vic.assigned_advisor_id) === uid)) return true;
  const shared = vic.shared_with?.find((s: SharedAccess) => String(s.advisor_id) === uid);
  if (shared?.access_level === "edit") return true;
  return teamShareForUser(vic, uid, ctx?.teams)?.access_level === "edit";
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
 *
 * March 31 decision: sharing is all-or-nothing. If user can view the VIC,
 * they see everything including sensitive fields. No basic/full split.
 */
export function canViewSensitiveFields(user: CurrentUser | null, vic: VIC | null, ctx?: VicPermissionContext): boolean {
  return canViewVIC(user, vic, ctx);
}

/**
 * Effective view level for this user on this VIC: "full" | "none".
 *
 * March 31 decision: no "basic" tier. If shared, recipient sees everything.
 * The "basic" level is removed — canViewVIC() returning true always means full access.
 */
export function getVICViewLevel(user: CurrentUser | null, vic: VIC | null, ctx?: VicPermissionContext): "full" | "basic" | "none" {
  if (canViewVIC(user, vic, ctx)) return "full";
  return "none";
}
