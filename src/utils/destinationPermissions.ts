/**
 * Destination guide permissions (frontend). Agency destination notes: same rules as other agency-wide
 * content — backend must enforce on write when wired to API.
 */

import { isWorkspaceStaffRole } from "@/lib/workspaceRoles";

export type DestinationNotesUser = {
  role: string;
  agency_id?: string | null;
};

/**
 * Agency leads / ops can create and edit shared destination notes for their agency.
 * Advisors and other roles in the same agency can read only.
 */
export function canManageAgencyDestinationNotes(user: DestinationNotesUser | null): boolean {
  if (!user?.agency_id) return false;
  const r = (user.role ?? "").toLowerCase();
  if (r === "owner") return true;
  return isWorkspaceStaffRole(user.role);
}

/** Anyone signed into an agency workspace can see that agency’s notes (prototype: same storage bucket). */
export function canViewAgencyDestinationNotes(user: DestinationNotesUser | null): boolean {
  return Boolean(user?.agency_id);
}
