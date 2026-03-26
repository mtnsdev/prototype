import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { DataSourceType } from "@/types/knowledge-vault";
import { TEAM_EVERYONE_ID } from "@/types/teams";

/** Policy / source-default keys (align with teams.policies.sourceAccess). */
export type KvPolicySourceId =
  | "google_drive_shared"
  | "google_drive_personal"
  | "intranet_documents"
  | "intranet_pages"
  | "email";

export const SOURCE_DEFAULT_SCOPES: Record<KvPolicySourceId, "private" | string | "mirrors_source"> = {
  google_drive_shared: TEAM_EVERYONE_ID,
  google_drive_personal: "private",
  intranet_documents: "mirrors_source",
  intranet_pages: "private",
  email: "private",
};

/** Map document source to policy key for sourceAccess checks. */
export function documentPolicySourceId(doc: KnowledgeDocument): KvPolicySourceId | null {
  return dataSourceTypeToPolicySourceId(doc.source_type);
}

/**
 * UI scope for badges: optional explicit kv_scope, else derived from data_layer + source defaults.
 */
export function knowledgeDocumentUiScope(doc: KnowledgeDocument): "private" | string | "mirrors_source" {
  if (doc.kv_scope != null && doc.kv_scope !== "") return doc.kv_scope;
  if (doc.data_layer === "advisor") return "private";
  const key = documentPolicySourceId(doc);
  if (key && SOURCE_DEFAULT_SCOPES[key] === "mirrors_source") return "mirrors_source";
  if (key && SOURCE_DEFAULT_SCOPES[key] === "private") return "private";
  return TEAM_EVERYONE_ID;
}

export function dataSourceTypeToPolicySourceId(sourceType: DataSourceType): KvPolicySourceId | null {
  switch (sourceType) {
    case DataSourceType.GoogleDriveAdmin:
      return "google_drive_shared";
    case DataSourceType.GoogleDrivePersonal:
      return "google_drive_personal";
    case DataSourceType.IntranetDocuments:
      return "intranet_documents";
    case DataSourceType.IntranetPages:
      return "intranet_pages";
    case DataSourceType.Email:
    case DataSourceType.EmailTemplate:
      return "email";
    default:
      return null;
  }
}

export function dataSourceDefaultUiScope(sourceType: DataSourceType): "private" | string | "mirrors_source" {
  const key = dataSourceTypeToPolicySourceId(sourceType);
  if (!key) return TEAM_EVERYONE_ID;
  return SOURCE_DEFAULT_SCOPES[key];
}
