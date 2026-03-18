/**
 * Knowledge Vault mock data — 7 sources, 28 sample docs (847 total indexed in health).
 */

import {
  DataSourceType,
  DocumentType,
  type DataSource,
  type KnowledgeDocument,
  type IngestionHealth,
  type KnowledgeDocumentListParams,
  type KnowledgeDocumentListResponse,
} from "@/types/knowledge-vault";
import type { PipelineStage } from "@/types/itinerary";

const now = new Date();
const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

export const VAULT_TOTAL_DOCUMENTS = 860;
/** Sum of visible docs per connected source + email templates */
export const VAULT_VISIBLE_DOCUMENTS = 714;
export const VAULT_VISIBLE_COUNT_TOOLTIP =
  "You have access to 711 of 860 total documents across all sources. Document visibility is based on your Claromentis access groups and data layer permissions.";

export type WebResult = {
  title: string;
  snippet: string;
  domain: string;
  timeAgo: string;
  url: string;
};

export const MOCK_WEB_RESULTS_DEFAULT: WebResult[] = [
  {
    title: "Japan Visa Requirements Updated March 2026",
    snippet:
      "New e-visa system launched for EU passport holders. Simplified application process now available online with 72-hour processing.",
    domain: "japan-travel.gov.jp",
    timeAgo: "2 days ago",
    url: "#",
  },
  {
    title: "Aman Resorts Announces New Property in Kyoto",
    snippet:
      "Opening Q4 2026, the 24-suite property will feature traditional machiya architecture with modern luxury amenities.",
    domain: "aman.com",
    timeAgo: "1 week ago",
    url: "#",
  },
  {
    title: "Best Family Resorts in Maldives — 2026 Guide",
    snippet:
      "Our curated list of top 10 family-friendly resorts with kids clubs, shallow lagoons, and multi-bedroom villas.",
    domain: "travelandleisure.com",
    timeAgo: "3 weeks ago",
    url: "#",
  },
];

export function getMockDataSources(): DataSource[] {
  return [
    {
      id: "src-gdrive-admin",
      name: "Google Drive — Shared",
      source_type: DataSourceType.GoogleDriveAdmin,
      icon: "Cloud",
      description:
        "Agency-wide shared drive managed by admins. Webinar transcripts, DMC directories, supplier rate sheets, training materials.",
      status: "connected",
      last_sync: twoMinAgo,
      document_count: 245,
      total_size_mb: 1240,
      sync_frequency: "daily",
      health_score: 95,
      connected_at: "2025-01-15T10:00:00Z",
    },
    {
      id: "src-gdrive-personal",
      name: "Google Drive — Personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      icon: "Cloud",
      description:
        "Your personal Google Drive. Private notes, client research, personal trip planning documents.",
      status: "connected",
      last_sync: twoMinAgo,
      document_count: 67,
      total_size_mb: 340,
      sync_frequency: "daily",
      health_score: 92,
      connected_at: "2025-01-20T14:00:00Z",
    },
    {
      id: "src-claro-docs",
      name: "Claromentis — Documents",
      source_type: DataSourceType.ClaromentisDocuments,
      icon: "Database",
      description:
        "Files and documents from your Claromentis intranet. Synced with permission-based access control.",
      status: "connected",
      last_sync: oneHourAgo,
      document_count: 312,
      document_visible_count: 198,
      total_size_mb: 2100,
      sync_frequency: "daily",
      health_score: 82,
      connected_at: "2025-02-01T09:00:00Z",
    },
    {
      id: "src-claro-pages",
      name: "Claromentis — Pages",
      source_type: DataSourceType.ClaromentisPages,
      icon: "Database",
      description:
        "Wiki-style pages and articles from your Claromentis intranet. Knowledge base articles, how-to guides, internal wikis.",
      status: "connected",
      last_sync: oneHourAgo,
      document_count: 175,
      document_visible_count: 140,
      total_size_mb: 85,
      sync_frequency: "daily",
      health_score: 74,
      connected_at: "2025-02-01T09:30:00Z",
    },
    {
      id: "src-manual",
      name: "Manual Uploads",
      source_type: DataSourceType.ManualUpload,
      icon: "Upload",
      description: "Advisor and agency uploads",
      status: "connected",
      last_sync: null,
      document_count: 34,
      total_size_mb: 156,
      sync_frequency: "manual",
      health_score: 100,
      connected_at: "2024-06-01T00:00:00Z",
    },
    {
      id: "src-virtuoso",
      name: "Virtuoso Network",
      source_type: DataSourceType.Virtuoso,
      icon: "Sparkles",
      description: "Virtuoso partner content",
      status: "connected",
      last_sync: oneWeekAgo,
      document_count: 14,
      total_size_mb: 42,
      sync_frequency: "weekly",
      health_score: 45,
      connected_at: "2025-03-01T12:00:00Z",
    },
    {
      id: "src-web",
      name: "Saved from Web",
      source_type: DataSourceType.WebScrape,
      icon: "Globe",
      description: "Articles and pages you saved from external web searches",
      status: "connected",
      last_sync: twoMinAgo,
      document_count: 3,
      total_size_mb: 1,
      sync_frequency: "manual",
      health_score: 100,
      connected_at: "2026-03-01T00:00:00Z",
    },
    {
      id: "src-email",
      name: "Email Ingestion",
      source_type: DataSourceType.Email,
      icon: "Mail",
      description: "Email attachments and threads",
      status: "disconnected",
      last_sync: null,
      document_count: 0,
      total_size_mb: 0,
      sync_frequency: "manual",
      health_score: 0,
      connected_at: "",
    },
    {
      id: "src-email-templates",
      name: "Email Templates",
      source_type: DataSourceType.EmailTemplate,
      icon: "Mail",
      description: "Sales cycle email templates",
      status: "connected",
      last_sync: twoMinAgo,
      document_count: 13,
      total_size_mb: 1,
      sync_frequency: "manual",
      health_score: 100,
      connected_at: "2025-06-01T00:00:00Z",
    },
  ];
}

const TEMPL_TS = "2026-01-15T10:00:00.000Z";

function buildEmailTemplateDocuments(): KnowledgeDocument[] {
  const src = "src-email-templates";
  const name = "Email Templates";
  const base = {
    source_id: src,
    source_type: DataSourceType.EmailTemplate,
    source_name: name,
    data_layer: "agency" as const,
    file_type: "email",
    file_size_kb: 4,
    ingestion_status: "indexed" as const,
    ingested_at: TEMPL_TS,
    last_updated: TEMPL_TS,
    linked_products: [] as { id: string; name: string }[],
    linked_vics: [] as { id: string; name: string }[],
  };
  const defs: { id: string; title: string; summary: string; tags: string[]; pipeline_stage: PipelineStage }[] = [
    {
      id: "tmpl-001",
      title: "Client Inquiry Response",
      summary:
        "Initial response to a new client inquiry — introduces services and next steps.",
      tags: ["lead", "first-contact"],
      pipeline_stage: "lead",
    },
    {
      id: "tmpl-002",
      title: "Summary of Request (How We Work)",
      summary: "Explains service fees, process, and what the client can expect. Sent after initial inquiry.",
      tags: ["discovery", "onboarding", "fees"],
      pipeline_stage: "discovery",
    },
    {
      id: "tmpl-003",
      title: "New Client Request to DMC",
      summary: "Request sent to DMC/partner with client preferences, dates, and budget for itinerary creation.",
      tags: ["proposal", "partner", "dmc"],
      pipeline_stage: "proposal",
    },
    {
      id: "tmpl-004",
      title: "Client Proposal",
      summary: "Formal proposal email presenting itinerary options and pricing to the client.",
      tags: ["proposal", "pricing"],
      pipeline_stage: "proposal",
    },
    {
      id: "tmpl-005",
      title: "Revised Client Proposal",
      summary: "Updated proposal after client feedback — highlights what changed from the original.",
      tags: ["revision", "iteration"],
      pipeline_stage: "revision",
    },
    {
      id: "tmpl-006",
      title: "Invoice Email",
      summary: "Sends invoice to client for deposit or full payment with payment instructions.",
      tags: ["committed", "payment", "invoice"],
      pipeline_stage: "committed",
    },
    {
      id: "tmpl-007",
      title: "Partner Confirmation",
      summary: "Confirms booking with DMC/partner after client commitment and payment.",
      tags: ["committed", "partner", "booking"],
      pipeline_stage: "committed",
    },
    {
      id: "tmpl-008",
      title: "Client Next Steps",
      summary: "Post-commitment email outlining what happens next: documents needed, concierge requests, timeline.",
      tags: ["committed", "onboarding"],
      pipeline_stage: "committed",
    },
    {
      id: "tmpl-009",
      title: "Travel Protection Quote",
      summary: "Sends travel insurance/protection quote and options to client.",
      tags: ["preparing", "insurance"],
      pipeline_stage: "preparing",
    },
    {
      id: "tmpl-010",
      title: "Hotel / Partner Re-Confirmation",
      summary: "Re-confirms all bookings with hotels and partners 2-3 weeks before travel.",
      tags: ["preparing", "partner", "confirmation"],
      pipeline_stage: "preparing",
    },
    {
      id: "tmpl-011",
      title: "VIP Email to Partners (Hotels)",
      summary: "Sends VIP guest details to hotels — preferences, special occasions, dietary needs.",
      tags: ["preparing", "vip", "partner"],
      pipeline_stage: "preparing",
    },
    {
      id: "tmpl-012",
      title: "Bon Voyage",
      summary: "Pre-departure email with final details, emergency contacts, and well-wishes.",
      tags: ["final_review", "pre-travel"],
      pipeline_stage: "final_review",
    },
    {
      id: "tmpl-013",
      title: "Welcome Home",
      summary: "Post-trip follow-up thanking the client, requesting feedback, and planting the seed for the next trip.",
      tags: ["post_travel", "follow-up", "review"],
      pipeline_stage: "post_travel",
    },
  ];
  return defs.map((x) => ({
    ...base,
    id: x.id,
    title: x.title,
    content_summary: x.summary,
    tags: x.tags,
    pipeline_stage: x.pipeline_stage,
  }));
}

export function getEmailTemplatesForPipelineStage(stage: PipelineStage): { id: string; title: string }[] {
  return buildEmailTemplateDocuments()
    .filter((d) => d.pipeline_stage === stage)
    .map((d) => ({ id: d.id, title: d.title }));
}

function d(daysAgo: number): string {
  const x = new Date(now);
  x.setDate(x.getDate() - daysAgo);
  return x.toISOString();
}

const GSHARED = "Google Drive — Shared";
const GPERSONAL = "Google Drive — Personal";
const CLARO_DOC = "Claromentis — Documents";
const CLARO_PAGE = "Claromentis — Pages";
const MANUAL = "Manual Uploads";
const VIRT = "Virtuoso Network";
const WEB_SRC_NAME = "Saved from Web";

function buildSavedWebDocuments(): KnowledgeDocument[] {
  return [
    {
      id: "web-001",
      title: "Japan Visa Requirements Updated March 2026",
      source_id: "src-web",
      source_type: DataSourceType.WebScrape,
      source_name: WEB_SRC_NAME,
      data_layer: "advisor",
      file_type: "html",
      file_size_kb: Math.round(0.02 * 1024),
      tags: ["japan", "visa", "policy"],
      ingestion_status: "indexed",
      last_updated: "2026-03-16T10:00:00Z",
      source_url: "japan-travel.gov.jp",
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "web-002",
      title: "Aman Resorts Announces New Property in Kyoto",
      source_id: "src-web",
      source_type: DataSourceType.WebScrape,
      source_name: WEB_SRC_NAME,
      data_layer: "advisor",
      file_type: "html",
      file_size_kb: Math.round(0.05 * 1024),
      tags: ["hotel", "japan", "new-opening"],
      ingestion_status: "indexed",
      last_updated: "2026-03-10T14:00:00Z",
      source_url: "aman.com",
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "web-003",
      title: "Best Family Resorts in Maldives — 2026 Guide",
      source_id: "src-web",
      source_type: DataSourceType.WebScrape,
      source_name: WEB_SRC_NAME,
      data_layer: "advisor",
      file_type: "html",
      file_size_kb: Math.round(0.08 * 1024),
      tags: ["maldives", "hotel", "destination"],
      ingestion_status: "indexed",
      last_updated: "2026-02-25T09:00:00Z",
      source_url: "travelandleisure.com",
      linked_products: [],
      linked_vics: [],
    },
  ];
}

/** Normalize + infer tags for sidebar facets (user-managed style). */
function enrichDocumentTags(doc: KnowledgeDocument): KnowledgeDocument {
  const tags = new Set(
    doc.tags.map((t) => t.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
  );
  const title = doc.title.toLowerCase();
  const add = (...xs: string[]) => xs.forEach((x) => tags.add(x));
  if (title.includes("maldives") || [...tags].some((t) => t.includes("maldives"))) {
    add("maldives", "hotel", "destination");
  }
  if (title.includes("japan") || title.includes("kyoto") || title.includes("visa")) {
    add("japan");
  }
  if (title.includes("four seasons") && (title.includes("rate") || title.includes("q1"))) {
    add("rate-sheet", "hotel", "france");
  }
  if (title.includes("rate") && title.includes("sheet")) add("rate-sheet");
  if (title.includes("dmc") || title.includes("partner agreement")) {
    add("dmc", "contract");
  }
  if (title.includes("contract") || title.includes("agreement")) add("contract");
  if (title.includes("policy") || title.includes("escalation") || title.includes("process")) {
    add("policy", "training");
  }
  if (title.includes("training") || title.includes("virtuoso travel week") || title.includes("webinar")) {
    add("training");
  }
  if (title.includes("smith") || title.includes("client report") || title.includes("trip research")) {
    add("client-report");
  }
  if (title.includes("one&only") || title.includes("reethi") || title.includes("property profile")) {
    add("hotel", "maldives", "partner-program");
  }
  if (title.includes("france") || title.includes("paris") || title.includes("nice")) add("france");
  if (title.includes("virtuoso") && !title.includes("rate")) add("partner-program");
  if (doc.source_type === DataSourceType.WebScrape) {
    doc.tags.forEach((t) => tags.add(t.toLowerCase()));
  }
  return { ...doc, tags: [...tags].filter(Boolean) };
}

const SIDEBAR_TAG_ORDER = [
  "hotel",
  "rate-sheet",
  "destination",
  "policy",
  "contract",
  "training",
  "partner-program",
  "maldives",
  "france",
  "japan",
  "client-report",
  "dmc",
];

export function getVaultSidebarTags(): { name: string; count: number }[] {
  const docs = getMockDocumentsRaw().map(enrichDocumentTags);
  const c = new Map<string, number>();
  for (const d of docs) {
    if (d.source_type === DataSourceType.WebScrape) continue;
    for (const t of d.tags) {
      c.set(t, (c.get(t) ?? 0) + 1);
    }
  }
  const primary = SIDEBAR_TAG_ORDER.filter((name) => (c.get(name) ?? 0) > 0).map((name) => ({
    name,
    count: c.get(name)!,
  }));
  const rest = [...c.entries()]
    .filter(([k]) => !SIDEBAR_TAG_ORDER.includes(k))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([name, count]) => ({ name, count }));
  return [...primary, ...rest];
}

function getMockDocumentsRaw(): KnowledgeDocument[] {
  return [
    {
      id: "doc-gda-1",
      title: "Maldives Destination Deep Dive",
      source_id: "src-gdrive-admin",
      source_type: DataSourceType.GoogleDriveAdmin,
      source_name: GSHARED,
      data_layer: "agency",
      document_type: DocumentType.DestinationGuide,
      file_type: "pdf",
      file_size_kb: 2100,
      content_summary:
        "Deep dive on Maldivian luxury stays including atolls, seaplane transfers, and family-friendly overwater options. Summarizes Virtuoso-preferred properties and seasonal pricing patterns advisors use when quoting multi-island itineraries.",
      tags: ["luxury", "beach", "Asia", "Maldives"],
      ingestion_status: "indexed",
      ingested_at: d(2),
      last_updated: d(2),
      freshness: "fresh",
      quality_score: 94,
      linked_products: [{ id: "p-maldives", name: "Maldives Overwater Escape" }],
      linked_vics: [{ id: "fake-vic-1", name: "Jordan Chen" }],
    },
    {
      id: "doc-gda-2",
      title: "Tuscany Wine Country Guide",
      source_id: "src-gdrive-admin",
      source_type: DataSourceType.GoogleDriveAdmin,
      source_name: GSHARED,
      data_layer: "agency",
      document_type: DocumentType.DestinationGuide,
      file_type: "pdf",
      file_size_kb: 3200,
      content_summary:
        "Regional guide covering Chianti, Montalcino, and boutique agriturismi with driving times and harvest-season notes. Includes winery appointment etiquette and sample three-day tasting routes for FIT clients.",
      tags: ["Europe", "Italy", "wine", "luxury"],
      ingestion_status: "indexed",
      ingested_at: d(10),
      last_updated: d(10),
      freshness: "recent",
      quality_score: 88,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-gda-3",
      title: "Four Seasons Rate Sheet Q1 2026",
      source_id: "src-gdrive-admin",
      source_type: DataSourceType.GoogleDriveAdmin,
      source_name: GSHARED,
      data_layer: "agency",
      document_type: DocumentType.RateSheet,
      file_type: "xlsx",
      file_size_kb: 480,
      content_summary:
        "Consolidated net and BAR references for Four Seasons properties across key leisure markets for Q1. Notes blackout dates and Virtuoso value-adds so advisors can align quotes with agency contract terms.",
      tags: ["rates", "Four Seasons", "luxury"],
      ingestion_status: "indexed",
      ingested_at: d(1),
      last_updated: d(1),
      freshness: "fresh",
      quality_score: 91,
      linked_products: [{ id: "p-fs", name: "Four Seasons Collection" }],
      linked_vics: [],
    },
    {
      id: "doc-gda-4",
      title: "DMC Partner Agreement — Southeast Asia",
      source_id: "src-gdrive-admin",
      source_type: DataSourceType.GoogleDriveAdmin,
      source_name: GSHARED,
      data_layer: "agency",
      document_type: DocumentType.Contract,
      file_type: "pdf",
      file_size_kb: 620,
      content_summary:
        "Executed agreement covering Thailand, Vietnam, and Cambodia ground services, liability caps, and payment milestones. Legal summary highlights what advisors may promise clients versus DMC scope.",
      tags: ["DMC", "Asia", "contracts"],
      ingestion_status: "indexed",
      ingested_at: d(55),
      last_updated: d(55),
      freshness: "aging",
      quality_score: 82,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-gda-5",
      title: "Virtuoso Travel Week 2025 — Key Takeaways",
      source_id: "src-gdrive-admin",
      source_type: DataSourceType.GoogleDriveAdmin,
      source_name: GSHARED,
      data_layer: "agency",
      document_type: DocumentType.TrainingMaterial,
      file_type: "pdf",
      file_size_kb: 890,
      content_summary:
        "Session notes from consortium keynotes and supplier speed-dating. Captures new preferred partners, sustainability talking points, and booking deadlines advisors should reference in follow-ups.",
      tags: ["Virtuoso", "training", "webinar"],
      ingestion_status: "indexed",
      ingested_at: d(14),
      last_updated: d(14),
      freshness: "recent",
      quality_score: 86,
      linked_products: [],
      linked_vics: [{ id: "fake-vic-2", name: "Alex Rivera" }],
    },
    {
      id: "doc-gda-6",
      title: "Weekly Team Call — March 11 2026 Transcript",
      source_id: "src-gdrive-admin",
      source_type: DataSourceType.GoogleDriveAdmin,
      source_name: GSHARED,
      data_layer: "agency",
      document_type: DocumentType.TrainingMaterial,
      file_type: "pdf",
      file_size_kb: 120,
      content_summary:
        "Transcript of this week’s agency stand-up covering pipeline wins, supplier escalations, and Enable rollout reminders. Searchable for action items and owner names mentioned on the call.",
      tags: ["team call", "transcript", "weekly"],
      ingestion_status: "indexed",
      ingested_at: d(0),
      last_updated: d(0),
      freshness: "fresh",
      quality_score: 79,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-gdp-1",
      title: "Smith Family — Japan Trip Research",
      source_id: "src-gdrive-personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      source_name: GPERSONAL,
      data_layer: "advisor",
      document_type: DocumentType.ClientReport,
      file_type: "docx",
      file_size_kb: 340,
      content_summary:
        "Private working notes on rail passes, ryokan shortlist, and kid-friendly activities for the Smith family spring trip. Includes rough day-by-day pacing and links to properties under consideration.",
      tags: ["Japan", "Asia", "family", "research"],
      ingestion_status: "indexed",
      ingested_at: d(1),
      last_updated: d(1),
      freshness: "fresh",
      quality_score: 72,
      linked_products: [],
      linked_vics: [{ id: "fake-vic-3", name: "Smith Family" }],
    },
    {
      id: "doc-gdp-2",
      title: "My Preferred DMC Contacts",
      source_id: "src-gdrive-personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      source_name: GPERSONAL,
      data_layer: "advisor",
      document_type: DocumentType.PartnerDirectory,
      file_type: "xlsx",
      file_size_kb: 88,
      content_summary:
        "Personal spreadsheet of ground operators and cell numbers built over years of FIT work. Not visible to other advisors; sync is advisor-scoped per Enable privacy rules.",
      tags: ["DMC", "contacts", "personal"],
      ingestion_status: "failed",
      last_updated: d(3),
      freshness: "recent",
      quality_score: 60,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-gdp-3",
      title: "Safari Lodge Comparison Notes",
      source_id: "src-gdrive-personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      source_name: GPERSONAL,
      data_layer: "advisor",
      document_type: DocumentType.DestinationGuide,
      file_type: "docx",
      file_size_kb: 256,
      content_summary:
        "Side-by-side notes on game-drive density, pool villas, and family tents across Serengeti and Masai Mara camps. Used to prep proposals before pulling official property profiles from shared drives.",
      tags: ["Africa", "safari", "luxury", "notes"],
      ingestion_status: "indexed",
      ingested_at: d(2),
      last_updated: d(2),
      freshness: "fresh",
      quality_score: 75,
      linked_products: [{ id: "p-safari", name: "East Africa Safari" }],
      linked_vics: [],
    },
    {
      id: "doc-gdp-4",
      title: "Honeymoon Packages — Draft Ideas",
      source_id: "src-gdrive-personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      source_name: GPERSONAL,
      data_layer: "advisor",
      document_type: DocumentType.MarketingCollateral,
      file_type: "docx",
      file_size_kb: 180,
      content_summary:
        "Draft copy blocks and image placeholders for romance-themed packages. Still internal; merge into agency templates once approved by marketing lead.",
      tags: ["honeymoon", "romance", "draft"],
      ingestion_status: "indexed",
      ingested_at: d(48),
      last_updated: d(48),
      freshness: "aging",
      quality_score: 68,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-cd-1",
      title: "Aman Tokyo — Property Profile",
      source_id: "src-claro-docs",
      source_type: DataSourceType.ClaromentisDocuments,
      source_name: CLARO_DOC,
      data_layer: "agency",
      document_type: DocumentType.PropertyProfile,
      file_type: "pdf",
      file_size_kb: 1200,
      content_summary:
        "Official intranet profile for Aman Tokyo covering room categories, Virtuoso amenities, and neighborhood dining. Pulled from Claromentis document library with permission group restrictions applied at sync.",
      tags: ["Aman", "Japan", "Asia", "luxury", "city"],
      ingestion_status: "indexed",
      ingested_at: d(1),
      last_updated: d(1),
      freshness: "fresh",
      quality_score: 93,
      linked_products: [{ id: "p-aman-tokyo", name: "Aman Tokyo" }],
      linked_vics: [],
    },
    {
      id: "doc-cd-2",
      title: "Belmond Hotel Caruso — Property Profile",
      source_id: "src-claro-docs",
      source_type: DataSourceType.ClaromentisDocuments,
      source_name: CLARO_DOC,
      data_layer: "agency",
      document_type: DocumentType.PropertyProfile,
      file_type: "pdf",
      file_size_kb: 980,
      content_summary:
        "Ravello cliffside positioning, pool and dining highlights, and transfer guidance from Naples. Synced file reflects latest sales notes from the Europe supplier desk.",
      tags: ["Belmond", "Italy", "Europe", "luxury"],
      ingestion_status: "indexed",
      ingested_at: d(12),
      last_updated: d(12),
      freshness: "recent",
      quality_score: 90,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-cd-3",
      title: "One&Only Reethi Rah — Property Profile",
      source_id: "src-claro-docs",
      source_type: DataSourceType.ClaromentisDocuments,
      source_name: CLARO_DOC,
      data_layer: "agency",
      document_type: DocumentType.PropertyProfile,
      file_type: "pdf",
      file_size_kb: 1100,
      content_summary:
        "Beach and overwater villa matrix, kids’ club hours, and seaplane timing. Advisors use this alongside rate sheets when building Maldives multi-property stays.",
      tags: ["One&Only", "Maldives", "Asia", "beach"],
      ingestion_status: "processing",
      last_updated: d(0),
      freshness: "fresh",
      quality_score: 88,
      linked_products: [{ id: "p-oorr", name: "One&Only Reethi Rah" }],
      linked_vics: [],
    },
    {
      id: "doc-cd-4",
      title: "Agency Commission Policy 2026",
      source_id: "src-claro-docs",
      source_type: DataSourceType.ClaromentisDocuments,
      source_name: CLARO_DOC,
      data_layer: "agency",
      document_type: DocumentType.Policy,
      file_type: "pdf",
      file_size_kb: 220,
      content_summary:
        "Published commission splits, override rules, and disclosure requirements effective January 2026. Mandatory reference before quoting net rates to clients.",
      tags: ["policy", "commission", "rates"],
      ingestion_status: "indexed",
      ingested_at: d(3),
      last_updated: d(3),
      freshness: "fresh",
      quality_score: 95,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-cd-5",
      title: "Preferred Partner Directory — Europe",
      source_id: "src-claro-docs",
      source_type: DataSourceType.ClaromentisDocuments,
      source_name: CLARO_DOC,
      data_layer: "agency",
      document_type: DocumentType.PartnerDirectory,
      file_type: "xlsx",
      file_size_kb: 410,
      content_summary:
        "Spreadsheet of contracted DMCs and hotel reps by country with escalation paths. Updated quarterly from supplier relations; visibility follows Claromentis group membership.",
      tags: ["Europe", "partners", "DMC"],
      ingestion_status: "indexed",
      ingested_at: d(9),
      last_updated: d(9),
      freshness: "recent",
      quality_score: 84,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-cd-6",
      title: "New Advisor Onboarding Pack",
      source_id: "src-claro-docs",
      source_type: DataSourceType.ClaromentisDocuments,
      source_name: CLARO_DOC,
      data_layer: "agency",
      document_type: DocumentType.TrainingMaterial,
      file_type: "pdf",
      file_size_kb: 5600,
      content_summary:
        "Bundled PDFs covering CRM hygiene, booking tools, and first-30-days checklist. HR uploads revisions to Claromentis; Enable mirrors only pages the new hire can access.",
      tags: ["training", "onboarding", "new hire"],
      ingestion_status: "indexed",
      ingested_at: d(62),
      last_updated: d(62),
      freshness: "aging",
      quality_score: 80,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-cd-7",
      title: "Advisor Private Notes — FIT SOP",
      source_id: "src-claro-docs",
      source_type: DataSourceType.ClaromentisDocuments,
      source_name: CLARO_DOC,
      data_layer: "advisor",
      document_type: DocumentType.InternalMemo,
      file_type: "pdf",
      file_size_kb: 95,
      content_summary:
        "Example of advisor-scoped Claromentis content: personal SOP checklist mirrored only for the owning advisor per intranet ACLs.",
      tags: ["internal", "SOP", "FIT"],
      ingestion_status: "indexed",
      ingested_at: d(5),
      last_updated: d(5),
      freshness: "fresh",
      quality_score: 70,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-cp-1",
      title: "How to Book Through Virtuoso",
      source_id: "src-claro-pages",
      source_type: DataSourceType.ClaromentisPages,
      source_name: CLARO_PAGE,
      data_layer: "agency",
      document_type: DocumentType.TrainingMaterial,
      file_type: "html",
      file_size_kb: 42,
      is_wiki_page: true,
      content_summary:
        "Wiki article walking through Virtuoso booking codes, hotel acknowledgment steps, and where to log consortium benefits. Chunked for vector search so chat can cite specific steps.",
      tags: ["Virtuoso", "how-to", "booking", "guide"],
      ingestion_status: "indexed",
      ingested_at: d(2),
      last_updated: d(2),
      freshness: "fresh",
      quality_score: 87,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-cp-2",
      title: "Destination Knowledge: Greek Islands",
      source_id: "src-claro-pages",
      source_type: DataSourceType.ClaromentisPages,
      source_name: CLARO_PAGE,
      data_layer: "agency",
      document_type: DocumentType.DestinationGuide,
      file_type: "html",
      file_size_kb: 128,
      is_wiki_page: true,
      content_summary:
        "Living wiki on Cyclades vs Dodecanese pacing, ferry vs helicopter, and shoulder-season value. Authored in Claromentis page editor; rendered as HTML chunks in Enable.",
      tags: ["Greece", "Europe", "islands", "beach"],
      ingestion_status: "indexed",
      ingested_at: d(11),
      last_updated: d(11),
      freshness: "recent",
      quality_score: 85,
      linked_products: [],
      linked_vics: [{ id: "fake-vic-4", name: "Elena Kostas" }],
    },
    {
      id: "doc-cp-3",
      title: "Supplier Escalation Process",
      source_id: "src-claro-pages",
      source_type: DataSourceType.ClaromentisPages,
      source_name: CLARO_PAGE,
      data_layer: "agency",
      document_type: DocumentType.Policy,
      file_type: "html",
      file_size_kb: 36,
      is_wiki_page: true,
      content_summary:
        "Defines when to loop in supplier relations versus legal, with SLAs by severity. Page-style content kept current without PDF re-uploads.",
      tags: ["policy", "suppliers", "process"],
      ingestion_status: "indexed",
      ingested_at: d(1),
      last_updated: d(1),
      freshness: "fresh",
      quality_score: 92,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-cp-4",
      title: "FAQs — Client Travel Insurance",
      source_id: "src-claro-pages",
      source_type: DataSourceType.ClaromentisPages,
      source_name: CLARO_PAGE,
      data_layer: "agency",
      document_type: DocumentType.TrainingMaterial,
      file_type: "html",
      file_size_kb: 55,
      is_wiki_page: true,
      content_summary:
        "FAQ wiki for common insurance objections, CFAR nuances, and state-specific caveats. Advisors paste excerpts into client emails with confidence.",
      tags: ["FAQ", "insurance", "clients"],
      ingestion_status: "indexed",
      ingested_at: d(40),
      last_updated: d(40),
      freshness: "aging",
      quality_score: 78,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-cp-5",
      title: "Internal: Peak Season Planning Checklist",
      source_id: "src-claro-pages",
      source_type: DataSourceType.ClaromentisPages,
      source_name: CLARO_PAGE,
      data_layer: "agency",
      document_type: DocumentType.InternalMemo,
      file_type: "html",
      file_size_kb: 28,
      is_wiki_page: true,
      content_summary:
        "Seasonal checklist for July–August capacity holds and deposit timing. Marked stale pending ops review next quarter.",
      tags: ["internal", "planning", "seasonal"],
      ingestion_status: "indexed",
      ingested_at: d(120),
      last_updated: d(120),
      freshness: "stale",
      quality_score: 65,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-mu-1",
      title: "Johnson Anniversary Trip — Proposal Draft",
      source_id: "src-manual",
      source_type: DataSourceType.ManualUpload,
      source_name: MANUAL,
      data_layer: "advisor",
      document_type: DocumentType.ClientReport,
      file_type: "pdf",
      file_size_kb: 890,
      content_summary:
        "Draft proposal PDF for Johnson anniversary with suite upgrades and celebratory amenities. Uploaded manually; visible only to uploading advisor until shared upward.",
      tags: ["proposal", "anniversary", "luxury"],
      ingestion_status: "pending",
      last_updated: d(0),
      freshness: "fresh",
      quality_score: 88,
      uploaded_by: "user-1",
      uploaded_by_name: "You",
      linked_products: [],
      linked_vics: [{ id: "fake-vic-5", name: "Johnson Party" }],
    },
    {
      id: "doc-mu-2",
      title: "Enable Platform Brochure",
      source_id: "src-manual",
      source_type: DataSourceType.ManualUpload,
      source_name: MANUAL,
      data_layer: "enable",
      document_type: DocumentType.MarketingCollateral,
      file_type: "pdf",
      file_size_kb: 3200,
      content_summary:
        "Official Enable product overview for advisor-facing conversations. Distributed as enable-layer content so all tenants see the same positioning and screenshots.",
      tags: ["Enable", "marketing", "brochure"],
      ingestion_status: "indexed",
      ingested_at: d(8),
      last_updated: d(8),
      freshness: "recent",
      quality_score: 96,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-mu-3",
      title: "Bali Visa Requirement Changes — March 2026",
      source_id: "src-manual",
      source_type: DataSourceType.ManualUpload,
      source_name: MANUAL,
      data_layer: "agency",
      document_type: DocumentType.TravelAdvisory,
      file_type: "pdf",
      file_size_kb: 180,
      content_summary:
        "Summary of new VoA and e-VOA rules effective March 2026 with source links. Agency-wide manual upload for rapid circulation beyond Claromentis publish cycle.",
      tags: ["Bali", "visa", "advisory", "Asia"],
      ingestion_status: "indexed",
      ingested_at: d(1),
      last_updated: d(1),
      freshness: "fresh",
      quality_score: 90,
      linked_products: [{ id: "p-bali", name: "Bali Retreat" }],
      linked_vics: [],
    },
    {
      id: "doc-v-1",
      title: "Virtuoso Preferred Hotels Rate Card 2026",
      source_id: "src-virtuoso",
      source_type: DataSourceType.Virtuoso,
      source_name: VIRT,
      data_layer: "enable",
      document_type: DocumentType.RateSheet,
      file_type: "pdf",
      file_size_kb: 2400,
      content_summary:
        "Network-wide preferred hotel rate references and benefit codes. Synced weekly from Virtuoso; identical for all Enable users on the consortium feed.",
      tags: ["Virtuoso", "rates", "hotels"],
      ingestion_status: "indexed",
      ingested_at: d(14),
      last_updated: d(14),
      freshness: "recent",
      quality_score: 89,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-v-2",
      title: "Virtuoso Voyages — Cruise Collection",
      source_id: "src-virtuoso",
      source_type: DataSourceType.Virtuoso,
      source_name: VIRT,
      data_layer: "enable",
      document_type: DocumentType.RateSheet,
      file_type: "pdf",
      file_size_kb: 5100,
      content_summary:
        "Cruise line portfolio with Virtuoso Voyages amenities and group promo windows. Large PDF chunked for ship-level retrieval in search.",
      tags: ["Virtuoso", "cruise", "rates"],
      ingestion_status: "indexed",
      ingested_at: d(52),
      last_updated: d(52),
      freshness: "aging",
      quality_score: 76,
      linked_products: [{ id: "p-cruise", name: "Virtuoso Voyages" }],
      linked_vics: [],
    },
    {
      id: "doc-v-3",
      title: "Virtuoso Network — Member Directory",
      source_id: "src-virtuoso",
      source_type: DataSourceType.Virtuoso,
      source_name: VIRT,
      data_layer: "enable",
      document_type: DocumentType.PartnerDirectory,
      file_type: "pdf",
      file_size_kb: 1800,
      content_summary:
        "Static member roster and regional rep contacts. Stale flag reflects annual PDF refresh cycle; advisors should confirm emails in live Virtuoso tools.",
      tags: ["Virtuoso", "directory", "partners"],
      ingestion_status: "indexed",
      ingested_at: d(100),
      last_updated: d(100),
      freshness: "stale",
      quality_score: 70,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-v-4",
      title: "Virtuoso Selling Luxury — Certification Module 3",
      source_id: "src-virtuoso",
      source_type: DataSourceType.Virtuoso,
      source_name: VIRT,
      data_layer: "enable",
      document_type: DocumentType.TrainingMaterial,
      file_type: "pdf",
      file_size_kb: 2200,
      content_summary:
        "Module three of the selling luxury curriculum: discovery questions, objection handling, and case studies. Enable mirrors consortium training assets for in-app study.",
      tags: ["Virtuoso", "training", "certification", "luxury"],
      ingestion_status: "indexed",
      ingested_at: d(20),
      last_updated: d(20),
      freshness: "recent",
      quality_score: 91,
      linked_products: [],
      linked_vics: [],
    },
    ...buildSavedWebDocuments(),
    ...buildEmailTemplateDocuments(),
  ];
}

export function getMockDocuments(): KnowledgeDocument[] {
  return getMockDocumentsRaw().map(enrichDocumentTags);
}

export function getMockIngestionHealth(): IngestionHealth {
  return {
    total_documents: VAULT_TOTAL_DOCUMENTS,
    indexed: 834,
    pending: 14,
    processing: 6,
    failed: 6,
    stale: 18,
    last_full_sync: twoMinAgo,
    avg_freshness_days: 14,
  };
}

export function getMockDocumentById(id: string): KnowledgeDocument | null {
  return getMockDocuments().find((d) => d.id === id) ?? null;
}

export function filterMockDocuments(
  params: KnowledgeDocumentListParams
): KnowledgeDocumentListResponse {
  let list = [...getMockDocuments()];

  const idsFromParam = params.source_ids?.split(",").filter(Boolean) ?? [];
  const hasSearch = Boolean(params.search?.trim());

  if (hasSearch) {
    list = list.filter((d) => d.source_type !== DataSourceType.WebScrape);
  }

  if (idsFromParam.length > 0) {
    list = list.filter((d) => idsFromParam.includes(d.source_id));
  } else if (params.source_id) {
    list = list.filter((d) => d.source_id === params.source_id);
  } else {
    list = list.filter((d) => d.source_type !== DataSourceType.WebScrape);
  }

  if (params.data_layer) list = list.filter((d) => d.data_layer === params.data_layer);
  if (params.ingestion_status) list = list.filter((d) => d.ingestion_status === params.ingestion_status);
  if (params.tags?.length) {
    const wanted = params.tags.map((t) => t.toLowerCase());
    list = list.filter((d) =>
      wanted.some((w) => d.tags.some((t) => t.toLowerCase() === w))
    );
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.content_summary ?? "").toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const sortBy = params.sort_by ?? "last_updated";
  const order = params.sort_order ?? "desc";
  list.sort((a, b) => {
    let aVal: string | number = a.last_updated;
    let bVal: string | number = b.last_updated;
    if (sortBy === "title") {
      aVal = a.title;
      bVal = b.title;
    } else if (sortBy === "quality_score") {
      aVal = a.quality_score ?? 0;
      bVal = b.quality_score ?? 0;
    } else if (sortBy === "file_size_kb") {
      aVal = a.file_size_kb;
      bVal = b.file_size_kb;
    }
    const cmp =
      typeof aVal === "string" ? String(aVal).localeCompare(String(bVal)) : aVal - (bVal as number);
    return order === "asc" ? cmp : -cmp;
  });

  const total = list.length;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 50);
  const start = (page - 1) * limit;
  list = list.slice(start, start + limit);

  return { documents: list, total };
}
