import { getMockDocuments } from "@/components/knowledge-vault/knowledgeVaultMockData";
import type { DestinationDocument } from "@/data/destinations";

function kvFileTypeToDest(ft: string): DestinationDocument["type"] {
  const t = ft.toLowerCase();
  if (t === "xlsx" || t === "xls") return "xlsx";
  if (t === "docx" || t === "doc") return "docx";
  if (t === "pptx" || t === "ppt") return "pptx";
  return "pdf";
}

/** Search mock Knowledge Vault documents for destination section file linking. */
export function searchKnowledgeVaultDocumentsForPicker(query: string, limit = 50): DestinationDocument[] {
  const q = query.trim().toLowerCase();
  const docs = getMockDocuments();
  const hay = (d: (typeof docs)[number]) =>
    `${d.title} ${d.content_summary ?? ""} ${(d.tags ?? []).join(" ")}`.toLowerCase();
  const filtered = !q ? docs.slice(0, limit) : docs.filter((d) => hay(d).includes(q)).slice(0, limit);
  return filtered.map((d) => ({
    name: d.title,
    type: kvFileTypeToDest(d.file_type),
    kvDocumentId: d.id,
  }));
}
