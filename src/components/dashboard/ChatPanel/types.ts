export type Citation = {
  chunk_id?: string;
  source: string;
  page_number: number;
  excerpt: string;
  filename: string;
  pdf_path: string;
  source_label?: string;
  /** Knowledge Vault scope: team id, `private`, or `mirrors_source` */
  kv_scope?: "private" | "mirrors_source" | string;
  document_id?: string;
  /** Citation is from another user’s private doc (display-only shield) */
  is_other_user_private?: boolean;
};

export type ConflictClaim = {
  claim: string;
  filename: string;
  page_number: number;
  excerpt: string;
  effective_date: string;
  pdf_path: string;
};

export type Conflict = {
  attribute: string;
  claims: ConflictClaim[];
};

export type PlaceCard = {
  name: string;
  address: string;
  city: string;
  country: string;
  google_maps_url: string;
  google_rating?: number | null;
  google_types?: string[];
  contact_phone: string;
  website: string;
  primary_image_url: string;
  /** Directory product id when this place maps to the advisor catalog (enables “save to External Search”). */
  directory_product_id?: string | null;
};

export type WebCitation = {
  url: string;
  title: string;
  snippet?: string;
  favicon?: string;
};

export type BotResponse = {
  session_id?: number;
  message_id?: number;
  answer: string;
  can_answer: boolean;
  citations: Citation[];
  web_citations?: WebCitation[];
  conflicts: Conflict[];
  cards?: PlaceCard[];
  open_source?: boolean;
};

export type Message = {
  role: "user" | "bot";
  text: string;
  response?: BotResponse;
  /** Backend message id (for assistant messages); used for feedback */
  id?: number;
  feedback_rating?: number | null;
  feedback_comment?: string | null;
};

export type ChatPanelProps = {
  conversationId: number | null;
  onConversationCreated?: (id: number) => void;
  userName?: string;
  onBackToHome?: () => void;
};
