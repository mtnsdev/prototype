const workspaceFirstAdminKey = (agencyId: string) =>
  `enable_workspace_${encodeURIComponent(agencyId)}_first_admin_onboarding_done`;

export function getWorkspaceFirstAdminOnboardingDone(agencyId: string | null | undefined): boolean {
  if (!agencyId || typeof window === "undefined") return false;
  try {
    return localStorage.getItem(workspaceFirstAdminKey(agencyId)) === "1";
  } catch {
    return false;
  }
}

export function setWorkspaceFirstAdminOnboardingDone(agencyId: string | null | undefined): void {
  if (!agencyId || typeof window === "undefined") return;
  try {
    localStorage.setItem(workspaceFirstAdminKey(agencyId), "1");
  } catch {
    /* ignore */
  }
}
