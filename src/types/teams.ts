/** Team-level capabilities (most permissive wins across a user’s teams). */
export interface TeamPolicies {
  canViewCommissions: boolean;
  canExportDocuments: boolean;
  canSendToClient: boolean;
  canRunAcuity: boolean;
  /** KV source policy keys this team may access, or all sources */
  sourceAccess: string[] | "all";
}

export interface Team {
  id: string;
  name: string;
  memberIds: string[];
  isDefault: boolean;
  policies: TeamPolicies;
  createdBy: string;
  createdAt: string;
}

/** Default agency team — all advisors are implicitly members */
export const TEAM_EVERYONE_ID = "team-everyone";
