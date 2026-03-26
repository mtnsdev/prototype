export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  kvEntryId?: string;
  /** `'private'` or a team id */
  scope: "private" | string;
  parentEmailId?: string;
  tags?: string[];
}

export interface EmailIngestion {
  id: string;
  subject: string;
  senderEmail: string;
  senderName: string;
  receivedAt: string;
  forwardedBy: string;
  forwardedByName: string;
  /** Forwarder no longer has an account — access and retention follow org policy. */
  forwarder_departed?: boolean;
  bodyText: string;
  bodyHtml?: string;
  attachments: EmailAttachment[];
  ownerId: string;
  /** `'private'` or a team id */
  scope: "private" | string;
  tags: string[];
  status: "unprocessed" | "processed";
  processedAt?: string;
  parentEmailId?: string;
}
