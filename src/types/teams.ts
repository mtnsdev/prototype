export interface Team {
  id: string;
  name: string;
  memberIds: string[];
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
}

/** Default agency team — all advisors are implicitly members */
export const TEAM_EVERYONE_ID = "team-everyone";
