import test from "node:test";
import assert from "node:assert/strict";
import { canViewVIC, canEditVIC, getVICViewLevel } from "../src/utils/vicPermissions";
import type { VIC } from "../src/types/vic";
import type { Team, TeamPolicies } from "../src/types/teams";

const TEST_POLICIES: TeamPolicies = {
  canViewCommissions: true,
  canExportDocuments: true,
  canSendToVic: true,
  canRunAcuity: true,
  sourceAccess: "all",
};

function team(id: string, memberIds: string[]): Team {
  return {
    id,
    name: id,
    memberIds,
    isDefault: false,
    policies: TEST_POLICIES,
    createdBy: "test",
    createdAt: "2026-01-01T00:00:00Z",
  };
}

const TEAMS: Team[] = [team("team-sellers", ["5", "user-alice"])];

const baseVic = (): VIC =>
  ({
    id: "v1",
    full_name: "Test",
    sharing_level: "full",
    created_by: "99",
    shared_with: [],
    shared_with_teams: [
      {
        team_id: "team-sellers",
        team_name: "Sellers",
        access_level: "view",
        shared_at: "2026-01-01T00:00:00Z",
      },
    ],
  }) as VIC;

test("canViewVIC is true when user is member of a shared team", () => {
  const vic = baseVic();
  const u = { id: "5", role: "advisor", agency_id: "a1" };
  assert.equal(canViewVIC(u, vic, { teams: TEAMS }), true);
});

test("canViewVIC is false when user not in shared team and not owner", () => {
  const vic = baseVic();
  const u = { id: "999", role: "advisor", agency_id: "a1" };
  assert.equal(canViewVIC(u, vic, { teams: TEAMS }), false);
});

test("canEditVIC is true when team share grants edit", () => {
  const vic = baseVic();
  vic.shared_with_teams = [{ ...vic.shared_with_teams![0]!, access_level: "edit" }];
  const u = { id: "user-alice", role: "advisor", agency_id: "a1" };
  assert.equal(canEditVIC(u, vic, { teams: TEAMS }), true);
});

test("canEditVIC is false when team share is view only", () => {
  const vic = baseVic();
  const u = { id: "5", role: "advisor", agency_id: "a1" };
  assert.equal(canEditVIC(u, vic, { teams: TEAMS }), false);
});

test("getVICViewLevel returns full for team view share when sharing_level is full", () => {
  const vic = baseVic();
  const u = { id: "5", role: "advisor", agency_id: "a1" };
  assert.equal(getVICViewLevel(u, vic, { teams: TEAMS }), "full");
});
