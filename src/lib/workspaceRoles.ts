import type { User } from "@/contexts/UserContext";

/** Roles that can manage workspace-wide settings and agency content (settings admin section, etc.). */
export function isWorkspaceStaffRole(role: string | null | undefined): boolean {
    return role === "admin" || role === "agency_admin";
}

export function isWorkspaceStaff(user: Pick<User, "role"> | null | undefined): boolean {
    return user != null && isWorkspaceStaffRole(user.role);
}
