"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  FilePlus,
  FileSpreadsheet,
  FileText,
  Plus,
  Presentation,
  Trash2,
  X,
} from "lucide-react";
import type { DestinationDocument } from "@/data/destinations";
import type { VirtualDocumentListSection } from "@/lib/destinationSectionModel";
import {
  getMockDocumentById,
  getMockDocuments,
} from "@/components/knowledge-vault/knowledgeVaultMockData";
import { useBuildEditorOptional } from "@/components/destinations/editor/DestinationEditorForms";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { stableItemId } from "@/lib/stableDestinationIds";

type Props = {
  section: VirtualDocumentListSection;
  destinationSlug: string;
};

function DocIcon({ type }: { type: DestinationDocument["type"] }) {
  if (type === "xlsx") {
    return <FileSpreadsheet className="size-3.5 text-[var(--muted-success-text)]" aria-hidden />;
  }
  if (type === "docx") {
    return <FileText className="size-3.5 text-[var(--muted-info-text)]" aria-hidden />;
  }
  if (type === "pptx") {
    return <Presentation className="size-3.5 text-[var(--muted-warning-text)]" aria-hidden />;
  }
  return <FileText className="size-3.5 text-muted-foreground" aria-hidden />;
}

function vaultSearchHref(doc: DestinationDocument, destinationSlug: string) {
  return `/dashboard/knowledge-vault?q=${encodeURIComponent(doc.name)}&destination=${encodeURIComponent(destinationSlug)}`;
}

function fileTypeFromMime(fileType: string): DestinationDocument["type"] {
  const ft = fileType.toLowerCase();
  if (ft.includes("pdf")) return "pdf";
  if (ft.includes("spreadsheet") || ft.includes("xlsx") || ft.includes("excel")) return "xlsx";
  if (ft.includes("presentation") || ft.includes("pptx") || ft.includes("slide")) return "pptx";
  return "docx";
}

export function InlineFilePicker({
  workspaceIndex,
  files,
  onChange,
}: {
  workspaceIndex: number;
  files: DestinationDocument[];
  onChange: (next: DestinationDocument[]) => void;
}) {
  void workspaceIndex;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lc = q.toLowerCase();
    const existingIds = new Set(files.map((f) => f.kvDocumentId).filter(Boolean));
    return getMockDocuments()
      .filter(
        (d) =>
          !existingIds.has(d.id) &&
          (d.title.toLowerCase().includes(lc) ||
            d.tags.some((t) => t.toLowerCase().includes(lc))),
      )
      .slice(0, 8);
  }, [q, files]);

  const addFile = (doc: { id: string; title: string; file_type: string }) => {
    const entry: DestinationDocument = {
      name: doc.title,
      type: fileTypeFromMime(doc.file_type),
      kvDocumentId: doc.id,
    };
    onChange([...files, entry]);
    setQ("");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 flex w-full items-center gap-1.5 rounded-md border border-dashed border-border/60 px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
      >
        <Plus className="size-3.5" aria-hidden />
        Attach file from Knowledge Vault
      </button>
    );
  }

  return (
    <div className="mt-1 rounded-md border border-border/60 bg-muted/20 p-1.5">
      <div className="relative">
        <FilePlus
          className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50"
          aria-hidden
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setQ("");
              setOpen(false);
            }
          }}
          placeholder="Search Knowledge Vault…"
          className="h-8 pl-7 pr-7 text-xs"
        />
        <button
          type="button"
          aria-label="Close picker"
          onClick={() => {
            setQ("");
            setOpen(false);
          }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/50 hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      {results.length > 0 ? (
        <div className="mt-1.5 max-h-44 overflow-y-auto rounded-md border border-border/40 bg-background">
          {results.map((d) => (
            <button
              key={d.id}
              type="button"
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/60"
              onClick={() => addFile(d)}
            >
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{d.title}</span>
              <span className="shrink-0 text-[10px] uppercase text-muted-foreground/60">
                {d.file_type}
              </span>
            </button>
          ))}
        </div>
      ) : q.trim() ? (
        <p className="px-2 py-2 text-center text-[11px] text-muted-foreground/70">No matches.</p>
      ) : null}
    </div>
  );
}

export function DocumentsSection({ section, destinationSlug }: Props) {
  const ctx = useBuildEditorOptional();
  const { isAdmin } = usePermissions();
  const documents = section.documents;
  const editorRef = section.editorRef;
  const editable =
    isAdmin && ctx != null && editorRef?.kind === "workspace" && editorRef.slice === "documents";

  const updateFiles = (next: DestinationDocument[]) => {
    if (!editable || !ctx || editorRef?.kind !== "workspace") return;
    ctx.patchSection(editorRef.workspaceIndex, {
      includeDocuments: next.length > 0,
      sectionFiles: next,
    });
  };

  const removeAt = (i: number) => {
    if (!editable || !window.confirm("Remove this file from the section?")) return;
    updateFiles(documents.filter((_, j) => j !== i));
  };

  if (documents.length === 0 && !editable) {
    return <p className="text-sm text-muted-foreground">Content coming soon.</p>;
  }

  return (
    <div>
      <ul className={cn(documents.length > 0 && "divide-y divide-border/50")}>
        {documents.map((doc, i) => {
          const kv = doc.kvDocumentId ? getMockDocumentById(doc.kvDocumentId) : null;
          const fileUrl = kv?.url?.trim();
          const vaultLink = vaultSearchHref(doc, destinationSlug);
          const key = doc.kvDocumentId ?? `${doc.name}-${i}`;
          const itemId = stableItemId(destinationSlug, section.id, key);

          return (
            <li
              key={itemId}
              id={`item-${itemId}`}
              className="group/drow relative flex scroll-mt-28 items-center gap-2.5 px-1 py-1.5"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded bg-muted/60">
                <DocIcon type={doc.type} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{doc.name}</p>
              </div>

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

              {editable ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="ml-1 size-7 shrink-0 text-muted-foreground/60 opacity-0 transition-opacity hover:text-destructive group-hover/drow:opacity-100 focus-visible:opacity-100"
                  title="Remove"
                  aria-label={`Remove ${doc.name}`}
                  onClick={() => removeAt(i)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {editable && editorRef?.kind === "workspace" ? (
        <InlineFilePicker
          workspaceIndex={editorRef.workspaceIndex}
          files={documents}
          onChange={updateFiles}
        />
      ) : null}
    </div>
  );
}
