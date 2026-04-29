"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText, Presentation } from "lucide-react";
import type { DestinationDocument } from "@/data/destinations";
import { searchKnowledgeVaultDocumentsForPicker } from "@/lib/knowledgeVaultPickerSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function FileGlyph({ type }: { type: DestinationDocument["type"] }) {
  if (type === "xlsx")
    return <FileSpreadsheet className="size-4 shrink-0 text-[var(--muted-success-text)]" aria-hidden />;
  if (type === "docx") return <FileText className="size-4 shrink-0 text-[var(--muted-info-text)]" aria-hidden />;
  if (type === "pptx")
    return <Presentation className="size-4 shrink-0 text-[var(--muted-warning-text)]" aria-hidden />;
  return <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />;
}

type Props = {
  value: DestinationDocument[];
  onChange: (next: DestinationDocument[]) => void;
  /** When true, toggles includeDocuments in parent when list becomes non-empty / empty. */
  onIncludeDocumentsChange?: (on: boolean) => void;
};

export function KnowledgeVaultSectionFilePicker({ value, onChange, onIncludeDocumentsChange }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const results = useMemo(() => searchKnowledgeVaultDocumentsForPicker(q), [q]);

  const addDoc = (doc: DestinationDocument) => {
    if (value.some((x) => x.kvDocumentId && x.kvDocumentId === doc.kvDocumentId)) return;
    const next = [...value, doc];
    onChange(next);
    onIncludeDocumentsChange?.(next.length > 0);
    setOpen(false);
    setQ("");
  };

  const removeAt = (i: number) => {
    const next = value.filter((_, j) => j !== i);
    onChange(next);
    onIncludeDocumentsChange?.(next.length > 0);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-medium text-foreground">Files from Knowledge Vault</Label>
        <p className="mt-0.5 text-2xs text-muted-foreground">
          Link documents that already exist in the vault — search and add; no upload here.
        </p>
      </div>

      {value.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {value.map((doc, i) => (
            <li
              key={doc.kvDocumentId ?? `${doc.name}-${i}`}
              className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2"
            >
              <FileGlyph type={doc.type} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-foreground">{doc.name}</p>
                <p className="mt-0.5 text-2xs uppercase text-muted-foreground">{doc.type}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => removeAt(i)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full max-w-md justify-start font-normal">
            + Link file from Knowledge Vault…
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,22rem)] p-0" align="start">
          <div className="border-b border-border p-2">
            <Input
              placeholder="Search vault documents…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-8"
              autoFocus
            />
          </div>
          <ul className="max-h-64 overflow-y-auto p-1" aria-label="Knowledge Vault results">
            {results.length === 0 ? (
              <li className="px-2 py-3 text-sm text-muted-foreground">No documents found</li>
            ) : (
              results.map((doc) => (
                <li key={doc.kvDocumentId ?? doc.name}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/80",
                    )}
                    onClick={() => addDoc(doc)}
                  >
                    <FileGlyph type={doc.type} />
                    <span className="min-w-0 flex-1 font-medium text-foreground">{doc.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
