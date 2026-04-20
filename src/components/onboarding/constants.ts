import type { HubSnapshot } from "@/components/onboarding/types";

/** Prototype agency label when no CRM name is wired. */
export const PROTOTYPE_AGENCY_NAME = "Dal Luxury Travel";

export const DEFAULT_STARTER_QUESTIONS = [
  "What luxury hotels do we have preferred rates with in Japan?",
  "Summarize our commission structure for Virtuoso properties",
  "What DMCs do we work with in Italy?",
  "What are our top selling points for safaris in Botswana?",
];

/**
 * Prefer questions that match connected sources; pad to four from defaults.
 */
export function getStarterQuestionsForHub(snapshot: HubSnapshot): string[] {
  const picked: string[] = [];
  const add = (q: string) => {
    if (picked.includes(q) || picked.length >= 4) return;
    picked.push(q);
  };

  if (snapshot.intranetConnected) {
    add("What luxury hotels do we have preferred rates with in Japan?");
    add("Summarize our commission structure for Virtuoso properties");
  }
  if (snapshot.sharedDriveConnected) {
    add("What DMCs do we work with in Italy?");
  }
  if (snapshot.personalConnected) {
    add("What are our top selling points for safaris in Botswana?");
  }

  for (const q of DEFAULT_STARTER_QUESTIONS) {
    add(q);
  }

  return picked.slice(0, 4);
}
