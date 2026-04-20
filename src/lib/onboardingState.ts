import type { User } from "@/contexts/UserContext";
import type { HubSnapshot } from "@/components/onboarding/types";
import { isWorkspaceStaff } from "@/lib/workspaceRoles";

export type OnboardingPath = "A" | "B" | "C";

export type OnboardingStepId = "welcome" | "hub" | "teams" | "completion";

const USER_DONE_PREFIX = "enable_vic_user_onboarding_done_";
const WORKSPACE_INITIAL_KEY = "enable_vic_workspace_initial_setup_complete";
const POST_ONBOARDING_REDIRECT_KEY = "enable_post_onboarding_redirect";
const STARTER_CHIPS_KEY = "enable_onboarding_starter_chips";
const RESUME_PREFIX = "enable_onboarding_resume_";
const POST_ONBOARDING_NUDGE_KEY = "enable_vic_post_onboarding_nudge_skipped";

/** Landing route after onboarding completes (PRD: Chat with starter chips). */
export const POST_ONBOARDING_CHAT_PATH = "/dashboard/chat";

/** Session-only: which onboarding storyline to run (prototype / demos). */
const ONBOARDING_TRACK_KEY = "enable_vic_onboarding_track";

/** Legacy single flag — treat as current user done when migrating. */
const LEGACY_ONBOARDING_KEY = "travellustre_onboarding_complete";

export type OnboardingTrackChoice = "admin" | "advisor";

export function isWorkspaceInitialSetupComplete(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(WORKSPACE_INITIAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function setWorkspaceInitialSetupComplete(): void {
  try {
    localStorage.setItem(WORKSPACE_INITIAL_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isUserOnboardingComplete(userId: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(LEGACY_ONBOARDING_KEY) === "true") {
      return true;
    }
    return localStorage.getItem(`${USER_DONE_PREFIX}${userId}`) === "1";
  } catch {
    return false;
  }
}

export function setUserOnboardingComplete(userId: number): void {
  try {
    localStorage.setItem(`${USER_DONE_PREFIX}${userId}`, "1");
  } catch {
    /* ignore */
  }
}

export function getOnboardingTrackChoice(): OnboardingTrackChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(ONBOARDING_TRACK_KEY);
    if (v === "admin" || v === "advisor") return v;
    return null;
  } catch {
    return null;
  }
}

export function setOnboardingTrackChoice(value: OnboardingTrackChoice): void {
  try {
    sessionStorage.setItem(ONBOARDING_TRACK_KEY, value);
  } catch {
    /* ignore */
  }
}

export function clearOnboardingTrackChoice(): void {
  try {
    sessionStorage.removeItem(ONBOARDING_TRACK_KEY);
  } catch {
    /* ignore */
  }
}

export function resolveOnboardingPath(
  user: Pick<User, "role">,
  searchParams: { get: (key: string) => string | null } | null
): OnboardingPath {
  const override = searchParams?.get("onboardingPath");
  if (override === "A" || override === "B" || override === "C") {
    return override;
  }

  const track = getOnboardingTrackChoice();
  if (track === "advisor") {
    return "B";
  }
  if (track === "admin") {
    if (!isWorkspaceInitialSetupComplete()) {
      return "A";
    }
    return "C";
  }

  const staff = isWorkspaceStaff(user);
  if (!staff) {
    return "B";
  }
  if (!isWorkspaceInitialSetupComplete()) {
    return "A";
  }
  return "C";
}

export function shouldShowOnboarding(user: User | null): boolean {
  if (!user) return false;
  return !isUserOnboardingComplete(user.id);
}

export function storePostOnboardingRedirect(url: string): void {
  try {
    sessionStorage.setItem(POST_ONBOARDING_REDIRECT_KEY, url);
  } catch {
    /* ignore */
  }
}

export function takePostOnboardingRedirect(): string {
  try {
    const v = sessionStorage.getItem(POST_ONBOARDING_REDIRECT_KEY);
    sessionStorage.removeItem(POST_ONBOARDING_REDIRECT_KEY);
    return v && v.startsWith("/") ? v : "/dashboard/chat";
  } catch {
    return "/dashboard/chat";
  }
}

export function storeStarterChipsForChat(questions: string[]): void {
  try {
    sessionStorage.setItem(STARTER_CHIPS_KEY, JSON.stringify(questions));
  } catch {
    /* ignore */
  }
}

export function takeStarterChipsForChat(): string[] | null {
  try {
    const raw = sessionStorage.getItem(STARTER_CHIPS_KEY);
    sessionStorage.removeItem(STARTER_CHIPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === "string")) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearStarterChipsForChat(): void {
  try {
    sessionStorage.removeItem(STARTER_CHIPS_KEY);
  } catch {
    /* ignore */
  }
}

export function peekStarterChipsForChat(): string[] | null {
  try {
    const raw = sessionStorage.getItem(STARTER_CHIPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === "string")) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveOnboardingResume(userId: number, path: OnboardingPath, step: OnboardingStepId): void {
  try {
    sessionStorage.setItem(RESUME_PREFIX + userId, JSON.stringify({ path, step }));
  } catch {
    /* ignore */
  }
}

export function loadOnboardingResume(
  userId: number,
  path: OnboardingPath
): OnboardingStepId | null {
  try {
    const raw = sessionStorage.getItem(RESUME_PREFIX + userId);
    if (!raw) return null;
    const data = JSON.parse(raw) as { path?: OnboardingPath; step?: OnboardingStepId };
    if (data.path !== path || !data.step) return null;
    return data.step;
  } catch {
    return null;
  }
}

export function clearOnboardingResume(userId: number): void {
  try {
    sessionStorage.removeItem(RESUME_PREFIX + userId);
  } catch {
    /* ignore */
  }
}

/** After onboarding, show a one-time banner if the user skipped any integration. */
export function setPostOnboardingSkippedIntegrationsNudge(snapshot: HubSnapshot): void {
  const anySkipped =
    snapshot.skippedIntranet || snapshot.skippedShared || snapshot.skippedPersonal;
  if (!anySkipped) return;
  try {
    localStorage.setItem(POST_ONBOARDING_NUDGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function dismissPostOnboardingIntegrationNudge(): void {
  try {
    localStorage.removeItem(POST_ONBOARDING_NUDGE_KEY);
  } catch {
    /* ignore */
  }
}

export function shouldShowPostOnboardingIntegrationNudge(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(POST_ONBOARDING_NUDGE_KEY) === "1";
  } catch {
    return false;
  }
}
