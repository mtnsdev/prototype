"use client";

import Link from "next/link";
import { ExternalLink, FileSpreadsheet, FileText, Presentation } from "lucide-react";
import type { DestinationDocument } from "@/data/destinations";
import { getMockDocumentById } from "@/components/knowledge-vault/knowledgeVaultMockData";
import { cn } from "@/lib/utils";
import { stableItemId } from "@/lib/stableDestinationIds";

type Props = {
  documents: DestinationDocument[];
  destinationSlug: string;
  sectionId: string;
};

function DocIcon({ type }: { type: DestinationDocument["type"] }) {
  if (type === "xlsx") {
    return <FileSpreadsheet className="size-5 text-[var(--muted-success-text)]" aria-hidden />;
  }
  if (type === "docx") {
    return <FileText className="size-5 text-[var(--muted-info-text)]" aria-hidden />;
  }
  if (type === "pptx") {
    return <Presentation className="size-5 text-[var(--muted-warning-text)]" aria-hidden />;
  }
  return <FileText className="size-5 text-muted-foreground" aria-hidden />;
}

function docTypeLabel(type: DestinationDocument["type"]): string {
  switch (type) {
    case "xlsx": return "Excel";
    case "docx": return "Word";
    case "pptx": return "Slides";
    case "pdf": return "PDF";
    default: return "File";
  }
}

function vaultSearchHref(doc: DestinationDocument, destinationSlug: string) {
  return `/dashboard/knowledge-vault?q=${encodeURIComponent(doc.name)}&destination=${encodeURIComponent(destinationSlug)}`;
}

export function DocumentsSection({ documents, destinationSlug, sectionId }: Props) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">Content coming soon.</p>;
  }

  return (
    <ul className="divide-y divide-border/50">
      {documents.map((doc, i) => {
        const kv = doc.kvDocumentId ? getMockDocumentById(doc.kvDocumentId) : null;
        const fileUrl = kv?.url?.trim();
        const vaultLink = vaultSearchHref(doc, destinationSlug);
        const key = doc.kvDocumentId ?? `${doc.name}-${i}`;
        const itemId = stableItemId(destinationSlug, sectionId, key);

        return (
          <li
            key={itemId}
            id={`item-${itemId}`}
            className="flex scroll-mt-28 items-center gap-3 px-1 py-3"
          >
            {/* File type icon + label */}
            <div className="flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-md bg-muted/60">
              <DocIcon type={doc.type} />
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                {docTypeLabel(doc.type)}
              </span>
            </div>

            {/* Name */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
              {kv?.content_summary ? (
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{kv.content_summary}</p>
              ) : null}
            </div>

            {/* Open link */}
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-cta hover:underline"
              >
                Open
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : (
              <Link
                href={vaultLink}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-cta hover:underline"
              >
                Open
                <ExternalLink className="size-3" aria-hidden />
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
