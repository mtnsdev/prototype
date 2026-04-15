"use client";

import Link from "next/link";
import { FileSpreadsheet, FileText } from "lucide-react";
import type { DestinationDocument } from "@/data/destinations";
import { cn } from "@/lib/utils";
import { destCardClass, destMuted } from "./destinationStyles";

type Props = {
  documents: DestinationDocument[];
  destinationSlug: string;
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

export function DocumentsSection({ documents, destinationSlug }: Props) {
  if (documents.length === 0) {
    return (
      <p className={cn("text-sm", destMuted)}>No documents linked yet. Check the Knowledge Vault for updates.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {documents.map((doc) => (
        <Link
          key={doc.name}
          href={`/dashboard/knowledge-vault?q=${encodeURIComponent(doc.name)}&destination=${encodeURIComponent(destinationSlug)}`}
          className={cn(
            destCardClass(),
            "flex flex-row items-start gap-3 p-4 transition-colors hover:border-brand-cta/35",
          )}
        >
          <DocIcon type={doc.type} />
          <div className="min-w-0">
            <p className="font-medium leading-snug text-foreground">{doc.name}</p>
            <p className={cn("mt-1 text-xs uppercase tracking-wide", destMuted)}>{doc.type}</p>
            <p className="mt-2 text-xs text-brand-cta/90">Open in Knowledge Vault →</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
