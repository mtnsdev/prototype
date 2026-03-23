import type { Team } from "@/types/teams";
import { TEAM_EVERYONE_ID } from "@/types/teams";

export const MOCK_TEAMS: Team[] = [
  {
    id: TEAM_EVERYONE_ID,
    name: "Everyone",
    memberIds: [],
    isDefault: true,
    createdBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "team-leadership",
    name: "Leadership",
    memberIds: ["1"],
    isDefault: false,
    createdBy: "admin",
    createdAt: "2026-02-01T00:00:00Z",
  },
];

/** Teams the current user can filter / share to (Everyone + teams they belong to). */
export function getVisibleTeamsForUser(userId: string | number | undefined): Team[] {
  const uid = userId != null ? String(userId) : "";
  return MOCK_TEAMS.filter((t) => t.isDefault || (uid && t.memberIds.includes(uid)));
}
