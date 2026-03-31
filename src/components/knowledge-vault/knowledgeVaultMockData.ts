/**
 * Knowledge Vault mock data — sources, catalog docs (Drive, intranet, email, etc.), health.
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
import { TEAM_EVERYONE_ID } from "@/types/teams";
import { kvMockSearchRankingPenalty } from "@/lib/knowledgeVaultOffboardingPolicy";

const now = new Date();
const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

export const VAULT_TOTAL_DOCUMENTS = 860;
/** Explains org-wide totals vs. what the mock catalog lists (pagination + filters). */
export const VAULT_CATALOG_COUNT_TOOLTIP =
  "Production: totals reflect intranet ACLs and data-layer rules. This preview lists a small catalog with pagination; counts in the header match the current filter and page size.";

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
      indexed_document_count: 228,
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
        "Your personal Google Drive. Private notes, VIC research, personal trip planning documents.",
      status: "connected",
      last_sync: twoMinAgo,
      document_count: 67,
      indexed_document_count: 64,
      total_size_mb: 340,
      sync_frequency: "daily",
      health_score: 92,
      connected_at: "2025-01-20T14:00:00Z",
    },
    {
      id: "src-claro-docs",
      name: "Intranet — Documents",
      source_type: DataSourceType.IntranetDocuments,
      icon: "Database",
      description:
        "Files and documents from your agency intranet. Synced with permission-based access control.",
      status: "connected",
      last_sync: oneHourAgo,
      document_count: 312,
      indexed_document_count: 285,
      document_visible_count: 198,
      total_size_mb: 2100,
      sync_frequency: "daily",
      health_score: 82,
      connected_at: "2025-02-01T09:00:00Z",
    },
    {
      id: "src-claro-pages",
      name: "Intranet — Pages",
      source_type: DataSourceType.IntranetPages,
      icon: "Database",
      description:
        "Wiki-style pages and articles from your agency intranet. Knowledge base articles, how-to guides, internal wikis.",
      status: "connected",
      last_sync: oneHourAgo,
      document_count: 175,
      indexed_document_count: 158,
      document_visible_count: 140,
      total_size_mb: 85,
      sync_frequency: "daily",
      health_score: 74,
      connected_at: "2025-02-01T09:30:00Z",
    },
    {
      id: "src-email",
      name: "Email",
      source_type: DataSourceType.Email,
      icon: "Mail",
      description: "Forwarded emails and attachments",
      status: "connected",
      last_sync: twoMinAgo,
      document_count: 4,
      indexed_document_count: 4,
      total_size_mb: 12,
      sync_frequency: "real_time",
      health_score: 100,
      connected_at: "2026-01-01T00:00:00Z",
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
  const defs: { id: string; title: string; summary: string; pipeline_stage: PipelineStage }[] = [
    {
      id: "tmpl-001",
      title: "VIC Inquiry Response",
      summary:
        "Initial response to a new VIC inquiry — introduces services and next steps.",
      pipeline_stage: "lead",
    },
    {
      id: "tmpl-002",
      title: "Summary of Request (How We Work)",
      summary: "Explains service fees, process, and what the VIC can expect. Sent after initial inquiry.",
      pipeline_stage: "discovery",
    },
    {
      id: "tmpl-003",
      title: "New VIC Request to DMC",
      summary: "Request sent to DMC/partner with VIC preferences, dates, and budget for itinerary creation.",
      pipeline_stage: "proposal",
    },
    {
      id: "tmpl-004",
      title: "VIC Proposal",
      summary: "Formal proposal email presenting itinerary options and pricing to the VIC.",
      pipeline_stage: "proposal",
    },
    {
      id: "tmpl-005",
      title: "Revised VIC Proposal",
      summary: "Updated proposal after VIC feedback — highlights what changed from the original.",
      pipeline_stage: "revision",
    },
    {
      id: "tmpl-006",
      title: "Invoice Email",
      summary: "Sends invoice to VIC for deposit or full payment with payment instructions.",
      pipeline_stage: "committed",
    },
    {
      id: "tmpl-007",
      title: "Partner Confirmation",
      summary: "Confirms booking with DMC/partner after VIC commitment and payment.",
      pipeline_stage: "committed",
    },
    {
      id: "tmpl-008",
      title: "VIC Next Steps",
      summary: "Post-commitment email outlining what happens next: documents needed, concierge requests, timeline.",
      pipeline_stage: "committed",
    },
    {
      id: "tmpl-009",
      title: "Travel Protection Quote",
      summary: "Sends travel insurance/protection quote and options to VIC.",
      pipeline_stage: "preparing",
    },
    {
      id: "tmpl-010",
      title: "Hotel / Partner Re-Confirmation",
      summary: "Re-confirms all bookings with hotels and partners 2-3 weeks before travel.",
      pipeline_stage: "preparing",
    },
    {
      id: "tmpl-011",
      title: "VIP Email to Partners (Hotels)",
      summary: "Sends VIP guest details to hotels — preferences, special occasions, dietary needs.",
      pipeline_stage: "preparing",
    },
    {
      id: "tmpl-012",
      title: "Bon Voyage",
      summary: "Pre-departure email with final details, emergency contacts, and well-wishes.",
      pipeline_stage: "final_review",
    },
    {
      id: "tmpl-013",
      title: "Welcome Home",
      summary: "Post-trip follow-up thanking the VIC, requesting feedback, and planting the seed for the next trip.",
      pipeline_stage: "post_travel",
    },
  ];
  return defs.map((x) => ({
    ...base,
    id: x.id,
    title: x.title,
    content_summary: x.summary,
    tags: [] as string[],
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
const INTRANET_DOC = "Intranet — Documents";
const INTRANET_PAGE = "Intranet — Pages";
const MANUAL = "Manual Uploads";
const VIRT = "Virtuoso Network";
const WEB_SRC_NAME = "Saved from Web";
const EMAIL_FEED = "Email";

function buildSavedWebDocuments(): KnowledgeDocument[] {
  return [
    {
      id: "web-001",
      title: "Japan Visa Requirements Updated March 2026",
      source_id: "src-web",
      source_type: DataSourceType.WebScrape,
      source_name: WEB_SRC_NAME,
      data_layer: "advisor",
      ownerId: "user-claire",
      file_type: "html",
      file_size_kb: Math.round(0.02 * 1024),
      tags: [],
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
      ownerId: "user-claire",
      file_type: "html",
      file_size_kb: Math.round(0.05 * 1024),
      tags: [],
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
      ownerId: "1",
      file_type: "html",
      file_size_kb: Math.round(0.08 * 1024),
      tags: [],
      ingestion_status: "indexed",
      last_updated: "2026-02-25T09:00:00Z",
      source_url: "travelandleisure.com",
      linked_products: [],
      linked_vics: [],
    },
  ];
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
      tags: ["Destination Guides", "Maldives"],
      ingestion_status: "indexed",
      ingested_at: d(2),
      last_updated: d(2),
      freshness: "fresh",
      quality_score: 94,
      linked_products: [{ id: "p-maldives", name: "Maldives Overwater Escape" }],
      linked_vics: [{ id: "vic-001", name: "Jean-Christophe Chopin" }],
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
        "Regional guide covering Chianti, Montalcino, and boutique agriturismi with driving times and harvest-season notes. Includes winery appointment etiquette and sample three-day tasting routes for FIT VICs.",
      tags: ["Destination Guides", "Italy", "Wine Country"],
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
      tags: ["Rate Sheets", "Four Seasons"],
      ingestion_status: "indexed",
      ingested_at: d(1),
      last_updated: d(1),
      freshness: "fresh",
      quality_score: 91,
      linked_products: [{ id: "prod_002", name: "Four Seasons Bora Bora" }],
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
        "Executed agreement covering Thailand, Vietnam, and Cambodia ground services, liability caps, and payment milestones. Legal summary highlights what advisors may promise VICs versus DMC scope.",
      tags: ["Contracts", "Southeast Asia"],
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
      tags: ["Training", "Virtuoso", "Events"],
      ingestion_status: "indexed",
      ingested_at: d(14),
      last_updated: d(14),
      freshness: "recent",
      quality_score: 86,
      linked_products: [],
      linked_vics: [{ id: "vic-003", name: "Camille Signoles" }],
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
      tags: ["Team Calls", "Transcripts"],
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
      title: "Moreau Family — Japan Trip Research",
      source_id: "src-gdrive-personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      source_name: GPERSONAL,
      data_layer: "advisor",
      ownerId: "1",
      document_type: DocumentType.VICReport,
      file_type: "docx",
      file_size_kb: 340,
      content_summary:
        "Private working notes on rail passes, ryokan shortlist, and kid-friendly activities for the Moreau family spring trip. Includes rough day-by-day pacing and links to properties under consideration.",
      tags: ["VIC Work", "Moreau Family", "Japan"],
      ingestion_status: "indexed",
      ingested_at: d(1),
      last_updated: d(1),
      freshness: "fresh",
      quality_score: 72,
      linked_products: [],
      linked_vics: [{ id: "vic-012", name: "Philippe Moreau" }],
    },
    {
      id: "doc-gdp-2",
      title: "My Preferred DMC Contacts",
      source_id: "src-gdrive-personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      source_name: GPERSONAL,
      data_layer: "advisor",
      ownerId: "user-claire",
      document_type: DocumentType.PartnerDirectory,
      file_type: "xlsx",
      file_size_kb: 88,
      content_summary:
        "Personal spreadsheet of ground operators and cell numbers built over years of FIT work. Not visible to other advisors; sync is advisor-scoped per Enable privacy rules.",
      tags: ["Personal", "Contacts"],
      ingestion_status: "not_indexed",
      ingested_at: d(3),
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
      ownerId: "1",
      document_type: DocumentType.DestinationGuide,
      file_type: "docx",
      file_size_kb: 256,
      content_summary:
        "Side-by-side notes on game-drive density, pool villas, and family tents across Serengeti and Masai Mara camps. Used to prep proposals before pulling official property profiles from shared drives.",
      tags: ["Research", "Africa", "Safari"],
      ingestion_status: "indexed",
      ingested_at: d(2),
      last_updated: d(2),
      freshness: "fresh",
      quality_score: 75,
      linked_products: [{ id: "p-safari", name: "East Africa Safari" }],
      linked_vics: [],
    },
    {
      id: "doc-other-1",
      title: "VIC Notes — Williams Anniversary Trip",
      source_id: "src-gdrive-personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      source_name: GPERSONAL,
      data_layer: "advisor",
      ownerId: "user-sarah",
      uploaded_by_name: "Sarah Mitchell",
      document_type: DocumentType.VICReport,
      file_type: "pdf",
      file_size_kb: 154,
      content_summary:
        "Private VIC planning notes (another advisor). Visible to admins only when Show all is enabled.",
      tags: ["VIC Work", "Planning"],
      ingestion_status: "indexed",
      ingested_at: d(5),
      last_updated: "2026-03-21T12:00:00Z",
      freshness: "recent",
      quality_score: 80,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-other-2",
      title: "Personal Travel Research — Patagonia",
      source_id: "src-gdrive-personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      source_name: GPERSONAL,
      data_layer: "advisor",
      ownerId: "user-sarah",
      uploaded_by_name: "Sarah Mitchell",
      document_type: DocumentType.DestinationGuide,
      file_type: "pdf",
      file_size_kb: 287,
      content_summary: "Personal research document from another advisor.",
      tags: ["Research", "Personal"],
      ingestion_status: "indexed",
      ingested_at: d(7),
      last_updated: "2026-03-19T12:00:00Z",
      freshness: "recent",
      quality_score: 78,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-gdp-4",
      title: "Honeymoon Packages — Draft Ideas",
      source_id: "src-gdrive-personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      source_name: GPERSONAL,
      data_layer: "advisor",
      ownerId: "user-claire",
      document_type: DocumentType.MarketingCollateral,
      file_type: "docx",
      file_size_kb: 180,
      content_summary:
        "Draft copy blocks and image placeholders for romance-themed packages. Still internal; merge into agency templates once approved by marketing lead.",
      tags: ["Drafts", "Honeymoon"],
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
      source_type: DataSourceType.IntranetDocuments,
      source_name: INTRANET_DOC,
      data_layer: "agency",
      document_type: DocumentType.PropertyProfile,
      file_type: "pdf",
      file_size_kb: 1200,
      content_summary:
        "Official intranet profile for Aman Tokyo covering room categories, Virtuoso amenities, and neighborhood dining. Pulled from the intranet document library with permission group restrictions applied at sync.",
      tags: ["Property Profiles", "Asia", "Japan"],
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
      source_type: DataSourceType.IntranetDocuments,
      source_name: INTRANET_DOC,
      data_layer: "agency",
      document_type: DocumentType.PropertyProfile,
      file_type: "pdf",
      file_size_kb: 980,
      content_summary:
        "Ravello cliffside positioning, pool and dining highlights, and transfer guidance from Naples. Synced file reflects latest sales notes from the Europe supplier desk.",
      tags: ["Property Profiles", "Europe", "Italy"],
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
      source_type: DataSourceType.IntranetDocuments,
      source_name: INTRANET_DOC,
      data_layer: "agency",
      document_type: DocumentType.PropertyProfile,
      file_type: "pdf",
      file_size_kb: 1100,
      content_summary:
        "Beach and overwater villa matrix, kids’ club hours, and seaplane timing. Advisors use this alongside rate sheets when building Maldives multi-property stays.",
      tags: ["Property Profiles", "Asia", "Maldives"],
      ingestion_status: "processing",
      ingested_at: d(0),
      last_updated: d(0),
      freshness: "fresh",
      quality_score: 88,
      linked_products: [{ id: "prod-agency-003", name: "One&Only Reethi Rah" }],
      linked_vics: [],
    },
    {
      id: "doc-cd-4",
      title: "Agency Commission Policy 2026",
      source_id: "src-claro-docs",
      source_type: DataSourceType.IntranetDocuments,
      source_name: INTRANET_DOC,
      data_layer: "agency",
      document_type: DocumentType.Policy,
      file_type: "pdf",
      file_size_kb: 220,
      content_summary:
        "Published commission splits, override rules, and disclosure requirements effective January 2026. Mandatory reference before quoting net rates to VICs.",
      tags: ["Policies", "Commission"],
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
      source_type: DataSourceType.IntranetDocuments,
      source_name: INTRANET_DOC,
      data_layer: "agency",
      document_type: DocumentType.PartnerDirectory,
      file_type: "xlsx",
      file_size_kb: 410,
      content_summary:
        "Spreadsheet of contracted DMCs and hotel reps by country with escalation paths. Updated quarterly from supplier relations; visibility follows intranet group membership.",
      tags: ["Partner Directories", "Europe"],
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
      source_type: DataSourceType.IntranetDocuments,
      source_name: INTRANET_DOC,
      data_layer: "agency",
      document_type: DocumentType.TrainingMaterial,
      file_type: "pdf",
      file_size_kb: 5600,
      content_summary:
        "Bundled PDFs covering CRM hygiene, booking tools, and first-30-days checklist. HR uploads revisions to the intranet; Enable mirrors only pages the new hire can access.",
      tags: ["Training", "Onboarding"],
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
      source_type: DataSourceType.IntranetDocuments,
      source_name: INTRANET_DOC,
      data_layer: "advisor",
      ownerId: "user-claire",
      document_type: DocumentType.InternalMemo,
      file_type: "pdf",
      file_size_kb: 95,
      content_summary:
        "Example of advisor-scoped intranet content: personal SOP checklist mirrored only for the owning advisor per intranet ACLs.",
      tags: ["Advisor Private", "SOP"],
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
      source_type: DataSourceType.IntranetPages,
      source_name: INTRANET_PAGE,
      data_layer: "agency",
      document_type: DocumentType.TrainingMaterial,
      file_type: "html",
      file_size_kb: 42,
      is_wiki_page: true,
      content_summary:
        "Wiki article walking through Virtuoso booking codes, hotel acknowledgment steps, and where to log consortium benefits. Chunked for vector search so chat can cite specific steps.",
      tags: ["Knowledge Base", "Virtuoso", "How-to"],
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
      source_type: DataSourceType.IntranetPages,
      source_name: INTRANET_PAGE,
      data_layer: "agency",
      document_type: DocumentType.DestinationGuide,
      file_type: "html",
      file_size_kb: 128,
      is_wiki_page: true,
      content_summary:
        "Living wiki on Cyclades vs Dodecanese pacing, ferry vs helicopter, and shoulder-season value. Authored in the intranet page editor; rendered as HTML chunks in Enable.",
      tags: ["Destination Guides", "Greece"],
      ingestion_status: "indexed",
      ingested_at: d(11),
      last_updated: d(11),
      freshness: "recent",
      quality_score: 85,
      linked_products: [],
      linked_vics: [{ id: "vic-006", name: "Valérie Rousseau" }],
    },
    {
      id: "doc-cp-3",
      title: "Supplier Escalation Process",
      source_id: "src-claro-pages",
      source_type: DataSourceType.IntranetPages,
      source_name: INTRANET_PAGE,
      data_layer: "agency",
      document_type: DocumentType.Policy,
      file_type: "html",
      file_size_kb: 36,
      is_wiki_page: true,
      content_summary:
        "Defines when to loop in supplier relations versus legal, with SLAs by severity. Page-style content kept current without PDF re-uploads.",
      tags: ["Policies", "Suppliers"],
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
      title: "FAQs — VIC Travel Insurance",
      source_id: "src-claro-pages",
      source_type: DataSourceType.IntranetPages,
      source_name: INTRANET_PAGE,
      data_layer: "agency",
      document_type: DocumentType.TrainingMaterial,
      file_type: "html",
      file_size_kb: 55,
      is_wiki_page: true,
      content_summary:
        "FAQ wiki for common insurance objections, CFAR nuances, and state-specific caveats. Advisors paste excerpts into VIC emails with confidence.",
      tags: ["Knowledge Base", "Insurance", "FAQ"],
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
      source_type: DataSourceType.IntranetPages,
      source_name: INTRANET_PAGE,
      data_layer: "agency",
      document_type: DocumentType.InternalMemo,
      file_type: "html",
      file_size_kb: 28,
      is_wiki_page: true,
      content_summary:
        "Seasonal checklist for July–August capacity holds and deposit timing. Marked stale pending ops review next quarter.",
      tags: ["Internal", "Planning", "Seasonal"],
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
      title: "Bresson Anniversary Trip — Proposal Draft",
      source_id: "src-manual",
      source_type: DataSourceType.ManualUpload,
      source_name: MANUAL,
      data_layer: "advisor",
      ownerId: "1",
      document_type: DocumentType.VICReport,
      file_type: "pdf",
      file_size_kb: 890,
      content_summary:
        "Draft proposal PDF for Bresson anniversary with suite upgrades and celebratory amenities. Uploaded manually; visible only to uploading advisor until shared upward.",
      tags: ["Manual Uploads", "Proposals"],
      ingestion_status: "processing",
      ingested_at: d(0),
      last_updated: d(0),
      freshness: "fresh",
      quality_score: 88,
      uploaded_by: "user-1",
      uploaded_by_name: "You",
      linked_products: [],
      linked_vics: [{ id: "vic-011", name: "Thomas Bresson" }],
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
      tags: ["Manual Uploads", "Enable"],
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
        "Summary of new VoA and e-VOA rules effective March 2026 with source links. Agency-wide manual upload for rapid circulation beyond intranet publish cycle.",
      tags: ["Manual Uploads", "Travel Advisories", "Asia"],
      ingestion_status: "indexed",
      ingested_at: d(1),
      last_updated: d(1),
      freshness: "fresh",
      quality_score: 90,
      linked_products: [{ id: "p-bali", name: "Bali Retreat" }],
      linked_vics: [],
    },
    {
      id: "doc-mu-leaver-shared",
      title: "Schengen Visa Rules — Advisor Cheat Sheet",
      source_id: "src-manual",
      source_type: DataSourceType.ManualUpload,
      source_name: MANUAL,
      data_layer: "advisor",
      ownerId: "user-alex-former",
      kv_scope: TEAM_EVERYONE_ID,
      owner_departed: true,
      departed_at: "2026-02-01T00:00:00Z",
      requires_access_review: true,
      document_type: DocumentType.TravelAdvisory,
      file_type: "pdf",
      file_size_kb: 220,
      tags: ["Manual Uploads", "Europe"],
      ingestion_status: "indexed",
      ingested_at: d(14),
      last_updated: d(14),
      freshness: "recent",
      quality_score: 86,
      uploaded_by: "user-alex-former",
      uploaded_by_name: "Alex Rivera",
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-mu-leaver-private",
      title: "Draft — VIC Parson Itinerary Notes",
      source_id: "src-manual",
      source_type: DataSourceType.ManualUpload,
      source_name: MANUAL,
      data_layer: "advisor",
      ownerId: "user-morgan-former",
      owner_departed: true,
      departed_at: "2026-01-15T00:00:00Z",
      document_type: DocumentType.VICReport,
      file_type: "pdf",
      file_size_kb: 340,
      tags: ["Manual Uploads", "Drafts"],
      ingestion_status: "indexed",
      ingested_at: d(30),
      last_updated: d(30),
      freshness: "aging",
      quality_score: 72,
      uploaded_by: "user-morgan-former",
      uploaded_by_name: "Morgan Lee",
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-email-1",
      title: "RE: Ritz Paris Group Booking — March 2026",
      source_id: "src-email",
      source_type: DataSourceType.Email,
      source_name: EMAIL_FEED,
      data_layer: "advisor",
      ownerId: "1",
      document_type: DocumentType.InternalMemo,
      file_type: "email",
      file_size_kb: 42,
      content_summary: "Thread confirming room block and catering hold for 18 guests; advisor-facing summary.",
      tags: [],
      ingestion_status: "indexed",
      ingested_at: d(1),
      last_updated: d(1),
      freshness: "fresh",
      quality_score: 82,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-email-2",
      title: "FW: Virtuoso Commission Confirmation",
      source_id: "src-email",
      source_type: DataSourceType.Email,
      source_name: EMAIL_FEED,
      data_layer: "advisor",
      ownerId: "1",
      document_type: DocumentType.InternalMemo,
      file_type: "email",
      file_size_kb: 28,
      content_summary: "Forwarded consortium commission statement for Q4 booking batch.",
      tags: [],
      ingestion_status: "indexed",
      ingested_at: d(3),
      last_updated: d(3),
      freshness: "recent",
      quality_score: 78,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-email-3",
      title: "VIC Inquiry — Honeymoon Maldives",
      source_id: "src-email",
      source_type: DataSourceType.Email,
      source_name: EMAIL_FEED,
      data_layer: "advisor",
      ownerId: "1",
      document_type: DocumentType.VICReport,
      file_type: "email",
      file_size_kb: 36,
      content_summary: "Initial VIC email with dates, budget band, and resort preferences.",
      tags: [],
      ingestion_status: "indexed",
      ingested_at: d(0),
      last_updated: d(0),
      freshness: "fresh",
      quality_score: 85,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-email-4",
      title: "RE: Air Schedule Change — LHR–MLE",
      source_id: "src-email",
      source_type: DataSourceType.Email,
      source_name: EMAIL_FEED,
      data_layer: "advisor",
      ownerId: "1",
      document_type: DocumentType.InternalMemo,
      file_type: "email",
      file_size_kb: 22,
      content_summary: "Carrier notification of retimed connection; advisor notes for VIC comms.",
      tags: [],
      ingestion_status: "indexed",
      ingested_at: d(2),
      last_updated: d(2),
      freshness: "recent",
      quality_score: 80,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-gdp-zip",
      title: "Property Photos Archive.zip",
      source_id: "src-gdrive-personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      source_name: GPERSONAL,
      data_layer: "advisor",
      ownerId: "1",
      document_type: DocumentType.MarketingCollateral,
      file_type: "zip",
      file_size_kb: 45 * 1024,
      content_summary: "Bulk image archive; unsupported for RAG chunking in this demo.",
      tags: [],
      ingestion_status: "not_indexed",
      ingested_at: d(14),
      last_updated: d(14),
      freshness: "aging",
      quality_score: 55,
      linked_products: [],
      linked_vics: [],
    },
    {
      id: "doc-gdp-mp4",
      title: "Hotel Walkthrough Video.mp4",
      source_id: "src-gdrive-personal",
      source_type: DataSourceType.GoogleDrivePersonal,
      source_name: GPERSONAL,
      data_layer: "advisor",
      ownerId: "1",
      document_type: DocumentType.MarketingCollateral,
      file_type: "mp4",
      file_size_kb: 120 * 1024,
      content_summary: "Property video asset; video formats are synced but not indexed for search in this demo.",
      tags: [],
      ingestion_status: "not_indexed",
      ingested_at: d(21),
      last_updated: d(21),
      freshness: "aging",
      quality_score: 50,
      linked_products: [],
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
      tags: ["Network Rates", "Hotels"],
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
      tags: ["Network Rates", "Cruise"],
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
      tags: ["Directory", "Partners"],
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
      tags: ["Training", "Certification"],
      ingestion_status: "indexed",
      ingested_at: d(20),
      last_updated: d(20),
      freshness: "recent",
      quality_score: 91,
      linked_products: [],
      linked_vics: [],
    },
  ];
}

const EXCLUDED_FROM_VAULT_LIST = new Set<DataSourceType>([
  DataSourceType.ManualUpload,
  DataSourceType.Virtuoso,
  DataSourceType.WebScrape,
  DataSourceType.EmailTemplate,
]);

export function getMockDocuments(): KnowledgeDocument[] {
  return getMockDocumentsRaw().filter((d) => !EXCLUDED_FROM_VAULT_LIST.has(d.source_type));
}

export function getMockIngestionHealth(): IngestionHealth {
  return {
    total_documents: VAULT_TOTAL_DOCUMENTS,
    indexed: 798,
    processing: 12,
    not_indexed: 50,
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
  if (idsFromParam.length > 0) {
    list = list.filter((d) => idsFromParam.includes(d.source_id));
  } else if (params.source_id) {
    list = list.filter((d) => d.source_id === params.source_id);
  }

  if (params.data_layer) {
    if (params.data_layer === "agency") {
      list = list.filter((d) => d.data_layer === "agency" || d.data_layer === "enable");
    } else if (params.data_layer === "advisor") {
      list = list.filter((d) => d.data_layer === "advisor");
    } else {
      list = list.filter((d) => d.data_layer === params.data_layer);
    }
  }
  if (params.ingestion_status) list = list.filter((d) => d.ingestion_status === params.ingestion_status);
  if (params.tags) {
    const tagFilters = params.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagFilters.length)
      list = list.filter((d) => tagFilters.some((t) => d.tags.includes(t)));
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (d) =>
        d.title.toLowerCase().includes(q) || (d.content_summary ?? "").toLowerCase().includes(q)
    );
  }

  const sortBy = params.sort_by ?? "last_updated";
  const order = params.sort_order ?? "desc";
  const searchActive = Boolean(params.search?.trim());
  list.sort((a, b) => {
    if (searchActive) {
      const pa = kvMockSearchRankingPenalty(a);
      const pb = kvMockSearchRankingPenalty(b);
      if (pa !== pb) return pa - pb;
    }
    let aVal: string | number = a.last_updated;
    let bVal: string | number = b.last_updated;
    if (sortBy === "title") {
      aVal = a.title;
      bVal = b.title;
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

/** Distinct auto-generated tag labels across vault list mock (for filter chips). */
export function getKnowledgeVaultDistinctTags(): string[] {
  const seen = new Set<string>();
  for (const d of getMockDocuments()) {
    for (const t of d.tags) seen.add(t);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}
