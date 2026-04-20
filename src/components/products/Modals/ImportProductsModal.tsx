"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import type { ProductCategory } from "@/types/product";
import { importProducts } from "@/lib/products-api";
import { CATEGORY_LABELS } from "@/config/productCategoryConfig";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  listSurfaceClass,
  listScrollClass,
  listTableClass,
  listTbodyRowClass,
  listTdClass,
} from "@/lib/list-ui";

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Category" },
  { id: 3, label: "Column mapping" },
  { id: 4, label: "Preview" },
  { id: 5, label: "Import" },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

export default function ImportProductsModal({ open, onClose, onImported }: Props) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);

  const handleFile = useCallback((f: File | null) => {
    setFile(f);
    setError(null);
    if (f && f.name.toLowerCase().endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        const lines = text.split(/\r?\n/).filter(Boolean);
        const rows = lines.slice(0, 6).map((line) => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim()));
        setPreviewRows(rows);
      };
      reader.readAsText(f);
    } else if (f) {
      setError("Please upload a .csv file");
    }
  }, []);

  const reset = () => {
    setStep(1);
    setFile(null);
    setCategory(null);
    setPreviewRows([]);
    setError(null);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const canStep2 = !!file && file.name.toLowerCase().endsWith(".csv");
  const canStep3 = canStep2 && category != null;

  const handleNext = () => {
    if (step < 5) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleImport = async () => {
    if (!file || !category) return;
    setError(null);
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("csv", file);
      formData.append("category", category);
      formData.append("column_mapping", JSON.stringify({ name: "name", description: "description", city: "city", country: "country" }));
      await importProducts(formData);
      onImported();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-accent border-input max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Import products from CSV</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 mb-4">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex-1 py-1.5 rounded text-center text-xs font-medium",
                step === s.id ? "bg-white/15 text-foreground" : "bg-white/5 text-muted-foreground/75"
              )}
            >
              {s.id}. {s.label}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
              dragOver ? "border-[#F5F5F5]/50 bg-white/10" : "border-white/20 bg-white/5"
            )}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; handleFile(f || null); }}
          >
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Drag and drop a .csv file, or click to browse.</p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              id="product-csv-upload"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <Label htmlFor="product-csv-upload">
              <Button type="button" variant="outline" size="sm" className="border-white/20 text-foreground" asChild>
                <span>Choose file</span>
              </Button>
            </Label>
            {file && <p className="mt-2 text-xs text-muted-foreground">{file.name}</p>}
          </div>
        )}

        {step === 2 && (
          <div>
            <Label className="text-muted-foreground">Product category for this import</Label>
            <Select value={category ?? ""} onValueChange={(v) => setCategory(v as ProductCategory)}>
              <SelectTrigger className="mt-2 bg-white/5 border-input text-foreground">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {step === 3 && (
          <p className="text-sm text-muted-foreground">
            Column mapping: map your CSV columns to product fields. Auto-map will try to match by header name. You can adjust in a future iteration.
          </p>
        )}

        {step === 4 && (
          <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden")}>
            <p className="px-3 pt-3 text-xs text-muted-foreground/75 mb-2">First 5 rows (validation errors would be highlighted here)</p>
            <table className={cn(listTableClass(), "text-xs")}>
              <tbody>
                {previewRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className={listTbodyRowClass}>
                    {row.map((cell, j) => (
                      <td key={j} className={cn(listTdClass, "text-xs text-foreground max-w-[120px] truncate")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {step === 5 && (
          <p className="text-sm text-muted-foreground">
            Ready to import. Products will be created with category &quot;{category && CATEGORY_LABELS[category]}&quot; and mapped columns.
          </p>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <DialogFooter className="gap-2 flex-wrap">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="border-input text-foreground">
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose} className="border-input text-foreground">
              Cancel
            </Button>
          )}
          {step < 5 ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !canStep2) ||
                (step === 2 && !canStep3)
              }
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importing…" : "Import"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
