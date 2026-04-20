/**
 * Prototype-only auth helpers when ENABLE_BACKEND / real proxy is not wired.
 * Use email prefix `admin@` (e.g. admin@test.com) for workspace-admin onboarding paths.
 */

export function stableUserIdFromEmail(email: string): number {
  let h = 0;
  for (let i = 0; i < email.length; i += 1) {
    h = (Math.imul(31, h) + email.charCodeAt(i)) | 0;
  }
  const n = Math.abs(h) % 2_000_000_000;
  return n === 0 ? 1 : n;
}

export function roleFromEmail(email: string): "admin" | "user" {
  const e = email.toLowerCase();
  if (e.startsWith("admin@") || e.includes("+admin@")) return "admin";
  return "user";
}

export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "User";
  const cleaned = local.replace(/[.+_]/g, " ").trim();
  if (!cleaned) return "User";
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function mockAccessToken(email: string): string {
  const payload = Buffer.from(JSON.stringify({ sub: email, mock: true, t: Date.now() }), "utf8").toString(
    "base64url"
  );
  return `mock.${payload}`;
}

export type MockUser = {
  id: number;
  email: string;
  username: string;
  agency_id: string | null;
  role: string;
  status: string;
  has_password?: boolean;
  must_change_password?: boolean;
};

export function buildMockUser(emailRaw: string): MockUser {
  const email = emailRaw.trim();
  const emailLower = email.toLowerCase();
  return {
    id: stableUserIdFromEmail(emailLower),
    email,
    username: displayNameFromEmail(emailLower),
    agency_id: "agency-1",
    role: roleFromEmail(emailLower),
    status: "active",
    has_password: true,
    must_change_password: false,
  };
}
