/** Known agency IDs → display name (extend when adding tenants). */
const AGENCY_LABELS: Record<string, string> = {
  "tl-demo": "Travel Lustre",
};

/**
 * Human-readable workspace label for chrome (header, etc.).
 */
export function workspaceDisplayName(agencyId: string | null | undefined): string {
  if (!agencyId?.trim()) return "Workspace";
  const key = agencyId.trim();
  const mapped = AGENCY_LABELS[key];
  if (mapped) return mapped;
  return key
    .split(/[-_]/g)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ");
}
