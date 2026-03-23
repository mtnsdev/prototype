import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { TEAM_EVERYONE_ID } from "@/types/teams";

/** Maps legacy API `data_layer` to Teams UI scope for badges and filters. */
export function knowledgeDocumentUiScope(doc: KnowledgeDocument): "private" | string {
  if (doc.data_layer === "advisor") return "private";
  return TEAM_EVERYONE_ID;
}
