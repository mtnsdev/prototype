import type { VICPersonaBundle } from "@/types/vic-profile";
import { buildPersonaBundlesFromNormalized } from "@/lib/build-vic-persona-bundles";
import { vicMockLedgerRoot } from "@/data/vic-mock/ledger";

const personas = buildPersonaBundlesFromNormalized(vicMockLedgerRoot);

export function getAllPersonaBundles(): VICPersonaBundle[] {
  return personas;
}

/** Resolve by advisor profile id, persona key, or linked legacy `vic-*` id from the list page. */
export function getPersonaBundleByVicId(vicId: string): VICPersonaBundle | undefined {
  if (!vicId) return undefined;
  return personas.find(
    (p) => p.profile.id === vicId || p.personaKey === vicId || (p.linkedVicIds ?? []).includes(vicId)
  );
}
