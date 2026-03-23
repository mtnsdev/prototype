/**
 * Knowledge Vault — data sources, documents, ingestion health.
 * Frontend-only types; backend built separately.
 */

import type { PipelineStage } from "@/types/itinerary";

export type DataSourceStatus = "connected" | "disconnected" | "syncing" | "error";

export type SyncFrequency = "real_time" | "hourly" | "daily" | "weekly" | "manual";

export enum DataSourceType {
  GoogleDriveAdmin = "google_drive_admin",
  GoogleDrivePersonal = "google_drive_personal",
  ClaromentisDocuments = "claromentis_documents",
  ClaromentisPages = "claromentis_pages",
  ManualUpload = "manual_upload",
  APIStream = "api_stream",
  Email = "email",
  Virtuoso = "virtuoso",
  WebScrape = "web_scrape",
  EmailTemplate = "email_template",
}

export interface DataSource {
  id: string;
  name: string;
  source_type: DataSourceType;
  /** Lucide icon key for base icon; badges differentiate variants */
  icon: string;
  description: string;
  status: DataSourceStatus;
  last_sync: string | null;
  /** Total documents in source (synced corpus) */
  document_count: number;
  /** Advisor-visible subset (e.g. Claromentis ACL); omit for full visibility */
  document_visible_count?: number;
  total_size_mb: number;
  sync_frequency: SyncFrequency;
  health_score: number;
  connected_at: string;
  config?: Record<string, unknown>;
}

export type DataLayer = "enable" | "agency" | "advisor";

export type IngestionStatus = "pending" | "processing" | "indexed" | "failed" | "stale";

export type Freshness = "fresh" | "recent" | "aging" | "stale";

export enum DocumentType {
  DestinationGuide = "destination_guide",
  PropertyProfile = "property_profile",
  RateSheet = "rate_sheet",
  Policy = "policy",
  Contract = "contract",
  TrainingMaterial = "training_material",
  Newsletter = "newsletter",
  ClientReport = "client_report",
  MarketingCollateral = "marketing_collateral",
  InternalMemo = "internal_memo",
  PartnerDirectory = "partner_directory",
  TravelAdvisory = "travel_advisory",
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  source_id: string;
  source_type: DataSourceType;
  source_name: string;
  data_layer: DataLayer;
  /** @deprecated UI uses tags only; optional for legacy mocks */
  document_type?: DocumentType;
  file_type: string;
  file_size_kb: number;
  content_summary?: string;
  tags: string[];
  ingestion_status: IngestionStatus;
  ingested_at?: string;
  last_updated: string;
  freshness?: Freshness;
  quality_score?: number;
  /** Saved-from-web source URL hostname */
  source_url?: string;
  linked_products: { id: string; name: string }[];
  linked_vics: { id: string; name: string }[];
  url?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  /** Private (advisor) docs: owner for visibility; omit in legacy mocks → treated as current user in UI */
  ownerId?: string;
  /** Claromentis wiki-style pages */
  is_wiki_page?: boolean;
  /** Email template → sales cycle stage */
  pipeline_stage?: PipelineStage;
}

export interface IngestionHealth {
  total_documents: number;
  indexed: number;
  pending: number;
  processing: number;
  failed: number;
  stale: number;
  last_full_sync: string;
  avg_freshness_days: number;
}

export interface KnowledgeDocumentListParams {
  source_id?: string;
  /** Comma-separated source IDs for additive filter */
  source_ids?: string;
  data_layer?: DataLayer;
  ingestion_status?: IngestionStatus;
  tags?: string[];
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface KnowledgeDocumentListResponse {
  documents: KnowledgeDocument[];
  total: number;
}
