/**
 * Clears client-side prototype state so you can sign in again as a first-time user
 * (onboarding, workspace flags, mock auth). Call before a full page navigation to /login.
 */
export function resetPrototypeClientStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("enable_vic_workspace_initial_setup_complete");
    localStorage.removeItem("travellustre_onboarding_complete");
    localStorage.removeItem("enable_prototype_admin_view");
    localStorage.removeItem("enable_kv_admin_demo");
    localStorage.removeItem("enable_directory_admin_demo");
    localStorage.removeItem("enable_briefing_preview_advisor");
    localStorage.removeItem("enable_vic_post_onboarding_nudge_skipped");

    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith("enable_vic_user_onboarding_done_")) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) {
      localStorage.removeItem(k);
    }

    const sessionRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (!k) continue;
      if (
        k.startsWith("enable_onboarding_resume_") ||
        k === "enable_post_onboarding_redirect" ||
        k === "enable_onboarding_starter_chips" ||
        k === "enable_vic_onboarding_track"
      ) {
        sessionRemove.push(k);
      }
    }
    for (const k of sessionRemove) {
      sessionStorage.removeItem(k);
    }

    document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax";
    const secure = window.location.protocol === "https:";
    if (secure) {
      document.cookie = "auth_token=; Path=/; Max-Age=0; SameSite=Lax; Secure";
    }
  } catch {
    /* ignore */
  }
}
