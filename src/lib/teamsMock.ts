import type { Team, TeamPolicies } from "@/types/teams";
import { TEAM_EVERYONE_ID } from "@/types/teams";

export const DEFAULT_TEAM_POLICIES: TeamPolicies = {
  canViewCommissions: true,
  canExportDocuments: true,
  canSendToClient: true,
  canRunAcuity: true,
  sourceAccess: "all",
};

export const ALL_TEAM_POLICIES: TeamPolicies = {
  canViewCommissions: true,
  canExportDocuments: true,
  canSendToClient: true,
  canRunAcuity: true,
  sourceAccess: "all",
};

export type AgencyUser = { id: string; name: string; email?: string; initials?: string; role?: string };

export const MOCK_AGENCY_USERS: AgencyUser[] = [
  { id: "1", name: "Janet", email: "janet@agency.test", initials: "JA", role: "Advisor" },
  { id: "user-janet", name: "Janet", email: "janet@agency.test", initials: "JA", role: "Advisor" },
  { id: "user-kristin", name: "Kristin", email: "kristin@agency.test", initials: "KR", role: "Advisor" },
  { id: "2", name: "Demo Admin", email: "admin@agency.test", initials: "DA", role: "Admin" },
  { id: "user-sarah", name: "Sarah Mitchell", email: "sarah@agency.test", initials: "SM", role: "Advisor" },
  { id: "user-james", name: "James Cole", email: "james@agency.test", initials: "JC", role: "Advisor" },
  { id: "user-lisa", name: "Lisa Park", email: "lisa@agency.test", initials: "LP", role: "Advisor" },
  { id: "user-mark", name: "Mark Ruiz", email: "mark@agency.test", initials: "MR", role: "Advisor" },
  { id: "user-emma", name: "Emma Stone", email: "emma@agency.test", initials: "ES", role: "Advisor" },
  { id: "user-david", name: "David Ng", email: "david@agency.test", initials: "DN", role: "Advisor" },
];

export function getMemberInitials(memberId: string): string {
  const u = MOCK_AGENCY_USERS.find((x) => x.id === memberId);
  if (!u?.name) return memberId.slice(0, 2).toUpperCase();
  const parts = u.name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return u.name.slice(0, 2).toUpperCase();
}

/** Mock teams — also used as INITIAL_MOCK_TEAMS for TeamsProvider. */
export const MOCK_TEAMS: Team[] = [
  {
    id: TEAM_EVERYONE_ID,
    name: "Everyone",
    memberIds: ["1", "user-sarah", "user-james", "user-lisa", "user-mark", "user-emma", "user-david"],
    isDefault: true,
    policies: { ...DEFAULT_TEAM_POLICIES, sourceAccess: "all" },
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "team-leadership",
    name: "Leadership",
    memberIds: ["1"],
    isDefault: false,
    policies: { ...DEFAULT_TEAM_POLICIES, sourceAccess: "all" },
    createdBy: "admin",
    createdAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "team-europe",
    name: "Europe Specialists",
    memberIds: ["1", "user-janet"],
    isDefault: false,
    policies: {
      ...DEFAULT_TEAM_POLICIES,
      sourceAccess: ["google_drive_shared", "intranet_documents", "intranet_pages", "email"],
    },
    createdBy: "admin",
    createdAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "team-honeymoon",
    name: "Honeymoon Team",
    memberIds: ["user-kristin"],
    isDefault: false,
    policies: {
      canViewCommissions: true,
      canExportDocuments: false,
      canSendToClient: true,
      canRunAcuity: true,
      sourceAccess: ["google_drive_shared", "email"],
    },
    createdBy: "admin",
    createdAt: "2026-02-12T00:00:00Z",
  },
];

export const INITIAL_MOCK_TEAMS: Team[] = MOCK_TEAMS.map((t) => ({
  ...t,
  memberIds: [...t.memberIds],
  policies: { ...t.policies, sourceAccess: t.policies.sourceAccess === "all" ? "all" : [...t.policies.sourceAccess] },
}));

export type ResolvedUserPolicies = {
  canViewCommissions: boolean;
  canExportDocuments: boolean;
  canSendToClient: boolean;
  canRunAcuity: boolean;
  accessibleSources: string[] | "all";
};

export function resolveUserPolicies(
  user: { id: string; role?: string } | null | undefined,
  teams: Team[]
): ResolvedUserPolicies {
  if (!user) {
    return {
      canViewCommissions: false,
      canExportDocuments: false,
      canSendToClient: false,
      canRunAcuity: false,
      accessibleSources: [],
    };
  }
  if (user.role === "admin") {
    return {
      canViewCommissions: true,
      canExportDocuments: true,
      canSendToClient: true,
      canRunAcuity: true,
      accessibleSources: "all",
    };
  }
  const uid = String(user.id);
  const userTeams = teams.filter((t) => t.isDefault || t.memberIds.includes(uid));
  if (userTeams.length === 0) {
    return {
      canViewCommissions: false,
      canExportDocuments: false,
      canSendToClient: false,
      canRunAcuity: false,
      accessibleSources: [],
    };
  }
  return {
    canViewCommissions: userTeams.some((t) => t.policies.canViewCommissions),
    canExportDocuments: userTeams.some((t) => t.policies.canExportDocuments),
    canSendToClient: userTeams.some((t) => t.policies.canSendToClient),
    canRunAcuity: userTeams.some((t) => t.policies.canRunAcuity),
    accessibleSources: userTeams.some((t) => t.policies.sourceAccess === "all")
      ? "all"
      : [...new Set(userTeams.flatMap((t) => (Array.isArray(t.policies.sourceAccess) ? t.policies.sourceAccess : [])))],
  };
}

/** Teams the current user can filter / share to (Everyone + teams they belong to). */
export function getVisibleTeamsForUser(userId: string | number | undefined): Team[] {
  const uid = userId != null ? String(userId) : "";
  return MOCK_TEAMS.filter((t) => t.isDefault || (uid && t.memberIds.includes(uid)));
}
