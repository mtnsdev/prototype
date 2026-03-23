import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { knowledgeDocumentUiScope } from "@/lib/knowledgeDocumentScope";

/** Local session overrides for document scope (until API persists teams scope). */
export type KvScopeOverrides = Partial<Record<string, "private" | string>>;

export function effectiveUiScope(doc: KnowledgeDocument, overrides?: KvScopeOverrides): "private" | string {
  const o = overrides?.[doc.id];
  if (o !== undefined && o !== "") return o;
  return knowledgeDocumentUiScope(doc);
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
  overrides?: KvScopeOverrides
): boolean {
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
  return eff === filterScope;
}

/** Admin can change scope on advisor/agency docs; not on Enable catalog layer. */
export function canAdminRescopeDocument(doc: KnowledgeDocument): boolean {
  return doc.data_layer !== "enable";
}
