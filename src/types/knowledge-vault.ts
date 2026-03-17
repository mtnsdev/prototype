/**
 * Knowledge Vault — data sources, documents, ingestion health.
 * Frontend-only types; backend built separately.
 */

export type DataSourceStatus = "connected" | "disconnected" | "syncing" | "error";

export type SyncFrequency = "real_time" | "hourly" | "daily" | "weekly" | "manual";

export enum DataSourceType {
  GoogleDrive = "google_drive",
  Claromentis = "claromentis",
  ManualUpload = "manual_upload",
  APIStream = "api_stream",
  Email = "email",
  Virtuoso = "virtuoso",
  WebScrape = "web_scrape",
}

export interface DataSource {
  id: string;
  name: string;
  source_type: DataSourceType;
  icon: string;
  description: string;
  status: DataSourceStatus;
  last_sync: string;
  document_count: number;
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
  document_type: DocumentType;
  file_type: string;
  file_size_kb: number;
  content_summary?: string;
  tags: string[];
  ingestion_status: IngestionStatus;
  ingested_at?: string;
  last_updated: string;
  freshness: Freshness;
  quality_score?: number;
  linked_products: { id: string; name: string }[];
  linked_vics: { id: string; name: string }[];
  url?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
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
  data_layer?: DataLayer;
  document_type?: DocumentType;
  freshness?: Freshness;
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
