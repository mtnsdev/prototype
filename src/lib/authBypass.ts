/**
 * Local dev convenience: skip the login screen and API-backed auth.
 * Never active in production (`next build` / `next start`).
 *
 * Disable in dev: `NEXT_PUBLIC_AUTH_BYPASS=0` in `.env.local`
 */
export function isAuthBypassEnabled(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  const v = process.env.NEXT_PUBLIC_AUTH_BYPASS?.trim().toLowerCase();
  if (v === "0" || v === "false" || v === "no") return false;
  return true;
}

/** Stored when bypass is on — satisfies `auth_token` checks in the UI. */
export const AUTH_BYPASS_TOKEN = "prototype-dev-bypass";
