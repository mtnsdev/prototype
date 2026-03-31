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
  IntranetDocuments = "intranet_documents",
  IntranetPages = "intranet_pages",
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
  /** Advisor-visible subset (e.g. intranet ACL); omit for full visibility */
  document_visible_count?: number;
  /** Documents chunked for RAG (subset of synced document_count) */
  indexed_document_count?: number;
  total_size_mb: number;
  sync_frequency: SyncFrequency;
  health_score: number;
  connected_at: string;
  config?: Record<string, unknown>;
}

export type DataLayer = "enable" | "agency" | "advisor";

/** RAG availability: synced to S3 first; indexed when chunking completed. */
export type IngestionStatus = "indexed" | "processing" | "not_indexed";

export type Freshness = "fresh" | "recent" | "aging" | "stale";

export enum DocumentType {
  DestinationGuide = "destination_guide",
  PropertyProfile = "property_profile",
  RateSheet = "rate_sheet",
  Policy = "policy",
  Contract = "contract",
  TrainingMaterial = "training_material",
  Newsletter = "newsletter",
  VICReport = "vic_report",
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
  /** Explicit Teams UI scope (private, team id, or mirrors_source). Falls back to data_layer + source defaults. */
  kv_scope?: "private" | "mirrors_source" | string;
  /** @deprecated optional for legacy mocks */
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
  /** Owning user no longer has an account (e.g. left the agency). Drives custody messaging and admin visibility for private docs. */
  owner_departed?: boolean;
  /** ISO timestamp when the owner was marked inactive (HR / IdP); optional until API provides it. */
  departed_at?: string;
  /**
   * Legal/comms: widened or leaver-tied content pending review before full RAG / discovery treatment.
   * UI + mock search ranking only until workflow exists.
   */
  requires_access_review?: boolean;
  /** After reassignment, logical custodian user id (future API). */
  access_reassigned_to_user_id?: string;
  /** Intranet wiki-style pages */
  is_wiki_page?: boolean;
  /** Email template → sales cycle stage */
  pipeline_stage?: PipelineStage;
}

export interface IngestionHealth {
  /** Total synced to storage (S3) */
  total_documents: number;
  indexed: number;
  /** Synced but chunking not complete */
  processing: number;
  /** Synced but unsupported format for RAG */
  not_indexed: number;
  last_full_sync: string;
  avg_freshness_days: number;
}

export interface KnowledgeDocumentListParams {
  source_id?: string;
  /** Comma-separated source IDs for additive filter */
  source_ids?: string;
  data_layer?: DataLayer;
  ingestion_status?: IngestionStatus;
  /** Comma-separated tag labels (OR match) */
  tags?: string;
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
