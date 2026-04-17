"use client";

import Link from "next/link";
import { ExternalLink, FileSpreadsheet, FileText } from "lucide-react";
import type { DestinationDocument } from "@/data/destinations";
import { getMockDocumentById } from "@/components/knowledge-vault/knowledgeVaultMockData";
import { cn } from "@/lib/utils";
import { destCardClass, destMuted } from "./destinationStyles";
import { stableItemId } from "@/lib/stableDestinationIds";

type Props = {
  documents: DestinationDocument[];
  destinationSlug: string;
  sectionId: string;
};

function DocIcon({ type }: { type: DestinationDocument["type"] }) {
  if (type === "xlsx") {
    return <FileSpreadsheet className="size-8 text-emerald-400/90" aria-hidden />;
  }
  if (type === "docx") {
    return <FileText className="size-8 text-sky-400/90" aria-hidden />;
  }
  return <FileText className="size-8 text-red-400/90" aria-hidden />;
}

function vaultSearchHref(doc: DestinationDocument, destinationSlug: string) {
  return `/dashboard/knowledge-vault?q=${encodeURIComponent(doc.name)}&destination=${encodeURIComponent(destinationSlug)}`;
}

export function DocumentsSection({ documents, destinationSlug, sectionId }: Props) {
  if (documents.length === 0) {
    return (
      <p className={cn("text-sm", destMuted)}>No documents linked yet. Check the Knowledge Vault for updates.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {documents.map((doc, i) => {
        const kv = doc.kvDocumentId ? getMockDocumentById(doc.kvDocumentId) : null;
        const fileUrl = kv?.url?.trim();
        const vaultLink = vaultSearchHref(doc, destinationSlug);
        const key = doc.kvDocumentId ?? `${doc.name}-${i}`;
        const itemId = stableItemId(destinationSlug, sectionId, key);

        return (
          <div
            key={itemId}
            id={`item-${itemId}`}
            className={cn(destCardClass("scroll-mt-28"), "flex flex-row items-start gap-3 p-4")}
          >
            <DocIcon type={doc.type} />
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug text-foreground">{doc.name}</p>
              <p className={cn("mt-1 text-xs uppercase tracking-wide", destMuted)}>{doc.type}</p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {fileUrl ? (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-cta hover:underline"
                  >
                    Download / open file
                    <ExternalLink className="size-3" aria-hidden />
                  </a>
                ) : null}
                <Link
                  href={vaultLink}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium hover:underline",
                    fileUrl ? "text-muted-foreground" : "text-brand-cta",
                  )}
                >
                  {fileUrl ? "View in Knowledge Vault" : "Open in Knowledge Vault"}
                  {!fileUrl ? <span aria-hidden> →</span> : null}
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
