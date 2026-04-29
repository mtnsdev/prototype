"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { DirectoryProduct } from "@/types/product-directory";
import { useBuildEditorOptional } from "@/components/destinations/editor/DestinationEditorForms";
import { ensureEditorWorkspace } from "@/lib/destinationEditorTabs";
import { applyDirectoryProductToDestination } from "@/lib/catalogProductMerge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CatalogSectionMultiPicker } from "@/components/destinations/editor/CatalogProductPicker";
import { cn } from "@/lib/utils";

type Props = {
  workspaceIndex: number;
};

/**
 * Simplified "+" button at the bottom of each section.
 * Opens a small popover with Products / Text / Files options.
 * No product slots, no presets — just add content.
 */
export function SectionBlockAppendRow({ workspaceIndex: wi }: Props) {
  const ctx = useBuildEditorOptional();
  const [productDialog, setProductDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!ctx) return null;

  const ws = ensureEditorWorkspace(ctx.draft);
  const row = ws.sections[wi];
  if (!row) return null;

  const addProducts = (products: DirectoryProduct[]) => {
    if (products.length === 0) return;
    ctx.setDraft((d0) => {
      let d = d0;
      for (const p of products) {
        const { destination, slot } = applyDirectoryProductToDestination(d, p);
        d = destination;
        // Auto-assign slot to this section if not already set
        const w = structuredClone(ensureEditorWorkspace(d));
        const cur = w.sections[wi];
        if (cur && slot && !cur.productSlot) {
          w.sections[wi] = { ...cur, includeProducts: true, productSlot: slot };
          d = { ...d, editorWorkspace: w };
        } else if (cur && !cur.includeProducts) {
          w.sections[wi] = { ...cur, includeProducts: true, productSlot: slot || cur.productSlot };
          d = { ...d, editorWorkspace: w };
        }
      }
      return d;
    });
    setProductDialog(false);
  };

  const addText = () => {
    const body = row.textBody?.trim();
    ctx.patchSection(wi, {
      includeText: true,
      textBody: body ? `${body}\n\n` : "",
    });
    setMenuOpen(false);
  };

  const addFiles = () => {
    ctx.patchSection(wi, { includeDocuments: true, sectionFiles: row.sectionFiles ?? [] });
    setMenuOpen(false);
  };

  return (
    <div className={cn("mt-4 flex justify-start")}>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-7 rounded-full p-0 text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground"
            aria-label="Add content to this section"
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-36 p-1">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/80"
            onClick={() => {
              setMenuOpen(false);
              setProductDialog(true);
            }}
          >
            Products
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/80"
            onClick={addText}
          >
            Text
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/80"
            onClick={addFiles}
          >
            Files
          </button>
        </PopoverContent>
      </Popover>

      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add products to this section</DialogTitle>
          </DialogHeader>
          <CatalogSectionMultiPicker onAddProducts={addProducts} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
