import type { KnowledgeDocument } from "@/types/knowledge-vault";
import { DataSourceType } from "@/types/knowledge-vault";

/**
 * Reference copy for admins — replace with tenant-config / CMS in production.
 * Covers: offboarding, custody, confidentiality, audit expectations, RAG, overrides, multi-layer rules.
 */
export const KV_OFFBOARDING_PLAYBOOK = {
  title: "Knowledge Vault — governance & offboarding",
  bullets: [
    "Offboarding: only agency admins (or your defined role) may change access, export, reassign logical ownership, or delete documents tied to former users.",
    "Private documents of departed users: default to admin custody (visible to admins for review). Retention windows and auto-archive should be set in org policy (e.g. 30 / 90 days) before purge.",
    "Shared or agency-wide content from a departed contributor: content usually remains available under current access; legal/comms should decide if a review queue is required before it stays discoverable.",
    "Search & RAG: documents flagged for access review or from departed owners may be ranked lower or excluded from retrieval until reviewed (demo mock applies a search penalty only).",
    "Audit: production should persist every access change (who, when, document id, before/after) to an immutable audit store; the in-app log below is session-only and includes vault documents plus email threads and attachments.",
    "Session overrides vs server: UI overrides apply immediately in this preview; when the API exists, server state wins on load and local unsynced overrides should be discarded or merged explicitly.",
    "Data layers: Enable catalog and Virtuoso-style network content ignore per-user offboarding for ownership (no personal “owner departed” custody). Advisor/agency/manual/email-sourced docs use offboarding rules.",
  ],
} as const;

/** Whether offboarding / custody / leaver messaging applies to this document. */
export function offboardingRulesApplyToDocument(doc: KnowledgeDocument): boolean {
  if (doc.data_layer === "enable") return false;
  if (doc.source_type === DataSourceType.Virtuoso) return false;
  return true;
}

/**
 * Mock search ranking: higher = sort later in results when search is active (RAG analogue).
 * 0 = normal, 1 = departed owner, 2 = pending access review.
 */
export function kvMockSearchRankingPenalty(doc: KnowledgeDocument): number {
  if (!offboardingRulesApplyToDocument(doc)) return 0;
  if (doc.requires_access_review) return 2;
  if (doc.owner_departed) return 1;
  return 0;
}
