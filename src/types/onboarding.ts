/**
 * First-run onboarding — persisted on the user record (prototype: localStorage).
 */

export type OnboardingStatus = "not_started" | "in_progress" | "completed";

/** Resume points for the first-run onboarding flow. */
export type OnboardingStepId = "welcome" | "knowledge_hub" | "teams" | "completion";

export type OnboardingPathKind = "A" | "B" | "C";
