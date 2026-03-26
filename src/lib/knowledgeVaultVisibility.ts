import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { documentPolicySourceId, knowledgeDocumentUiScope } from "@/lib/knowledgeDocumentScope";
import type { ResolvedUserPolicies } from "@/lib/teamsMock";
import { TEAM_EVERYONE_ID } from "@/types/teams";

/** Local session overrides for document scope (until API persists teams scope). */
export type KvScopeOverrides = Partial<Record<string, "private" | string>>;

export function effectiveUiScope(
  doc: KnowledgeDocument,
  overrides?: KvScopeOverrides
): "private" | string | "mirrors_source" {
  const o = overrides?.[doc.id];
  if (o !== undefined && o !== "") return o;
  return knowledgeDocumentUiScope(doc);
}

/** Document visible in KV list only if user’s resolved policies allow the document’s source. */
export function userHasKvSourceAccess(doc: KnowledgeDocument, resolved: ResolvedUserPolicies): boolean {
  if (resolved.accessibleSources === "all") return true;
  const key = documentPolicySourceId(doc);
  if (key == null) return true;
  return resolved.accessibleSources.includes(key);
}

export function isPrivateEffective(doc: KnowledgeDocument, overrides?: KvScopeOverrides): boolean {
  return effectiveUiScope(doc, overrides) === "private";
}

export function isPrivateKnowledgeDoc(doc: KnowledgeDocument): boolean {
  return doc.data_layer === "advisor";
}

/** Effective owner for private docs; missing ownerId → current user (legacy mock). */
export function effectivePrivateOwnerId(doc: KnowledgeDocument, currentUserId: string): string {
  return doc.ownerId ?? currentUserId;
}

export function canSeeKnowledgeDocument(
  doc: KnowledgeDocument,
  currentUserId: string,
  isAdmin: boolean,
  showAllPrivateDocs: boolean,
  overrides?: KvScopeOverrides,
  resolvedPolicies?: ResolvedUserPolicies
): boolean {
  if (resolvedPolicies && !userHasKvSourceAccess(doc, resolvedPolicies)) return false;
  if (!isPrivateEffective(doc, overrides)) return true;
  const owner = effectivePrivateOwnerId(doc, currentUserId);
  if (owner === currentUserId) return true;
  return Boolean(isAdmin && showAllPrivateDocs);
}

/** Admin oversight: other user’s private doc, shown dimmed with shield. */
export function isOversightPrivateDoc(
  doc: KnowledgeDocument,
  currentUserId: string,
  isAdmin: boolean,
  showAllPrivateDocs: boolean,
  overrides?: KvScopeOverrides
): boolean {
  if (!isAdmin || !showAllPrivateDocs || !isPrivateEffective(doc, overrides)) return false;
  const owner = effectivePrivateOwnerId(doc, currentUserId);
  return owner !== currentUserId;
}

/** Refine list when scope filter is active — e.g. exclude docs promoted to team while API still returns advisor rows. */
export function matchesKvScopeFilter(
  doc: KnowledgeDocument,
  filterScope: string | undefined,
  overrides?: KvScopeOverrides
): boolean {
  if (filterScope == null) return true;
  const eff = effectiveUiScope(doc, overrides);
  if (filterScope === "private") return eff === "private";
  if (eff === "mirrors_source") return filterScope === TEAM_EVERYONE_ID;
  return eff === filterScope;
}

/** Admin can change scope on advisor/agency docs; not on Enable catalog layer. */
export function canAdminRescopeDocument(doc: KnowledgeDocument): boolean {
  return doc.data_layer !== "enable";
}
