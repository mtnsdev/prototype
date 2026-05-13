"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Upload, FileText, Loader2 } from "lucide-react";
import type { Product } from "@/types/product";
import { fetchProductList, importProducts, getProductId } from "@/lib/products-api";
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

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map columns" },
  { id: 3, label: "Match rows" },
  { id: 4, label: "Confirm" },
] as const;

/** Enable fields the user can map a CSV column to. `skip` ignores the column. */
const ENABLE_FIELDS = [
  { value: "skip", label: "— Skip this column —" },
  { value: "name", label: "Product name" },
  { value: "description", label: "Description" },
  { value: "category", label: "Category" },
  { value: "subcategory", label: "Subcategory" },
  { value: "country", label: "Country" },
  { value: "city", label: "City" },
  { value: "region", label: "Region" },
  { value: "address", label: "Address" },
  { value: "status", label: "Status" },
  { value: "notes", label: "Notes (appended)" },
] as const;

type EnableField = (typeof ENABLE_FIELDS)[number]["value"];

/** Heuristic: match a CSV header to the most plausible Enable field. */
function autoMapColumn(header: string): EnableField {
  const h = header.trim().toLowerCase();
  if (!h) return "skip";
  if (/(^|[\s_-])(product|property|name|hotel|restaurant|venue|item|title)([\s_-]|$)/.test(h)) return "name";
  if (/desc|summary|about|overview/.test(h)) return "description";
  if (/^country$/.test(h) || /(^|[\s_-])country([\s_-]|$)/.test(h)) return "country";
  if (/^(city|town|locality)$/.test(h)) return "city";
  if (/^(region|state|province|area)$/.test(h)) return "region";
  if (/addr|address|street|location/.test(h)) return "address";
  if (/(category|type)/.test(h)) return "category";
  if (/(sub.?category|subtype)/.test(h)) return "subcategory";
  if (/^status$/.test(h)) return "status";
  if (/(note|comment|remark|thought)/.test(h)) return "notes";
  return "skip";
}

/** Suggest the existing-product match for a given CSV row (lowercase substring). */
function suggestRowMatch(name: string, candidates: Product[]): Product | null {
  const q = name.trim().toLowerCase();
  if (!q) return null;
  // Exact name match wins.
  const exact = candidates.find((p) => p.name.trim().toLowerCase() === q);
  if (exact) return exact;
  // Otherwise a substring match (either direction) — first wins.
  return (
    candidates.find((p) => {
      const n = p.name.trim().toLowerCase();
      return n.includes(q) || q.includes(n);
    }) ?? null
  );
}

type RowAction =
  | { kind: "create" }
  | { kind: "update"; productId: string }
  | { kind: "skip" };

type Props = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

export default function ImportProductsModal({ open, onClose, onImported }: Props) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parsed CSV.
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);

  // Step-2 state — column-by-column mapping.
  const [columnMapping, setColumnMapping] = useState<EnableField[]>([]);

  // Step-3 state — per-row action and the candidate pool.
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [rowActions, setRowActions] = useState<RowAction[]>([]);

  const reset = useCallback(() => {
    setStep(1);
    setFile(null);
    setError(null);
    setHeaders([]);
    setRows([]);
    setColumnMapping([]);
    setExistingProducts([]);
    setRowActions([]);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleFile = useCallback((f: File | null) => {
    setError(null);
    setFile(f);
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        setError("CSV is empty.");
        return;
      }
      // Naive CSV parse — splits on commas not inside double-quoted fields.
      // Sufficient for the prototype demo; real backend will use a robust parser.
      const splitRow = (line: string) =>
        line
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map((c) => c.replace(/^"|"$/g, "").trim());
      const head = splitRow(lines[0]);
      const body = lines.slice(1).map(splitRow);
      setHeaders(head);
      setRows(body);
      setColumnMapping(head.map(autoMapColumn));
    };
    reader.readAsText(f);
  }, []);

  /** Index of the column mapped to "name" — required to advance past Step 2. */
  const nameColumnIndex = useMemo(() => columnMapping.indexOf("name"), [columnMapping]);

  /** Load existing products on entering Step 3 so the row matcher has candidates. */
  useEffect(() => {
    if (step !== 3) return;
    if (existingProducts.length > 0) return;
    let cancelled = false;
    setLoadingProducts(true);
    void fetchProductList({ limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setExistingProducts(res.products ?? []);
      })
      .catch(() => {
        // Demo fallback: empty pool means everything defaults to "create".
        if (!cancelled) setExistingProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, existingProducts.length]);

  /** Initialise row actions once products + rows are ready. */
  useEffect(() => {
    if (step !== 3) return;
    if (rowActions.length === rows.length) return;
    if (nameColumnIndex < 0) return;
    const next: RowAction[] = rows.map((r) => {
      const name = r[nameColumnIndex] ?? "";
      const match = suggestRowMatch(name, existingProducts);
      if (match) return { kind: "update", productId: getProductId(match) };
      if (!name.trim()) return { kind: "skip" };
      return { kind: "create" };
    });
    setRowActions(next);
  }, [step, rows, existingProducts, nameColumnIndex, rowActions.length]);

  // -------------------------- Navigation guards ----------------------------

  const canStep2 = !!file && headers.length > 0;
  const canStep3 = canStep2 && nameColumnIndex >= 0;
  const canStep4 = canStep3 && rowActions.length === rows.length;

  // ----------------------------- Handlers ----------------------------------

  const handleNext = () => {
    if (step < 4) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const setMapping = (idx: number, field: EnableField) => {
    // Enforce uniqueness on non-skip fields so the user can't map two columns
    // to the same Enable field.
    setColumnMapping((cur) => {
      const next = cur.slice();
      if (field !== "skip") {
        for (let i = 0; i < next.length; i += 1) {
          if (i !== idx && next[i] === field) next[i] = "skip";
        }
      }
      next[idx] = field;
      return next;
    });
  };

  const setRowAction = (i: number, action: RowAction) => {
    setRowActions((cur) => {
      const next = cur.slice();
      next[i] = action;
      return next;
    });
  };

  const summary = useMemo(() => {
    let create = 0;
    let update = 0;
    let skip = 0;
    for (const a of rowActions) {
      if (a.kind === "create") create += 1;
      else if (a.kind === "update") update += 1;
      else skip += 1;
    }
    return { create, update, skip };
  }, [rowActions]);

  const handleImport = async () => {
    if (!file) return;
    setError(null);
    setImporting(true);
    try {
      // Build the column-mapping payload the backend expects: Enable field →
      // CSV header label.
      const mapping: Record<string, string> = {};
      columnMapping.forEach((field, i) => {
        if (field !== "skip" && headers[i]) mapping[field] = headers[i];
      });
      const formData = new FormData();
      formData.append("csv", file);
      formData.append("column_mapping", JSON.stringify(mapping));
      formData.append("row_actions", JSON.stringify(rowActions));
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
      <DialogContent className="border-input max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Import products from CSV</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex gap-1 mb-4">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex-1 py-1.5 rounded text-center text-xs font-medium",
                step === s.id
                  ? "bg-white/15 text-foreground"
                  : "bg-white/5 text-muted-foreground/75",
              )}
            >
              {s.id}. {s.label}
            </div>
          ))}
        </div>

        {/* ---------------------------- STEP 1 ---------------------------- */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground/80">
              Upload a CSV with one product per row. We&apos;ll auto-detect your
              columns next, then let you match each row to an existing product
              or create a new one.
            </p>
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                dragOver ? "border-[#F5F5F5]/50 bg-white/10" : "border-white/20 bg-white/5",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files[0] ?? null);
              }}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop a .csv file, or click to browse.
              </p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="product-csv-upload"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <Label htmlFor="product-csv-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-foreground"
                  asChild
                >
                  <span>Choose file</span>
                </Button>
              </Label>
              {file && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText size={12} />
                  {file.name}
                  {rows.length > 0 ? (
                    <span className="opacity-70">
                      · {headers.length} column{headers.length === 1 ? "" : "s"} ·{" "}
                      {rows.length} row{rows.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------- STEP 2 ---------------------------- */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground/80">
              Match each column from your CSV to a field in Enable. Pre-filled
              by header name where we could guess. Map at least one column to{" "}
              <span className="text-foreground font-medium">Product name</span>{" "}
              to continue.
            </p>
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-white/5">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">CSV column</th>
                    <th className="px-3 py-2 font-medium">Sample</th>
                    <th className="px-3 py-2 font-medium w-56">Maps to</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {headers.map((h, i) => {
                    const sample = rows[0]?.[i] ?? "";
                    return (
                      <tr key={`${h}-${i}`} className="text-foreground">
                        <td className="px-3 py-2 font-medium">{h || `Column ${i + 1}`}</td>
                        <td className="px-3 py-2 max-w-[180px] truncate text-muted-foreground">
                          {sample || <span className="opacity-50">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={columnMapping[i] ?? "skip"}
                            onValueChange={(v) => setMapping(i, v as EnableField)}
                          >
                            <SelectTrigger className="h-8 bg-white/5 border-input text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ENABLE_FIELDS.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {nameColumnIndex < 0 && (
              <p className="text-xs text-amber-400">
                No column is mapped to <span className="font-medium">Product name</span>{" "}
                yet — pick one to continue.
              </p>
            )}
          </div>
        )}

        {/* ---------------------------- STEP 3 ---------------------------- */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground/80">
              For each row in your CSV, choose whether to{" "}
              <span className="text-foreground font-medium">update</span> an
              existing product, <span className="text-foreground font-medium">create</span>{" "}
              a new one, or skip it. We&apos;ve auto-matched where the names
              looked close.
            </p>
            {loadingProducts ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                <Loader2 size={12} className="animate-spin" /> Loading existing
                products…
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-white/5 sticky top-0">
                    <tr className="text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium w-10">#</th>
                      <th className="px-3 py-2 font-medium">CSV product name</th>
                      <th className="px-3 py-2 font-medium w-72">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {rows.map((r, i) => {
                      const name = r[nameColumnIndex] ?? "";
                      const action: RowAction = rowActions[i] ?? { kind: "skip" };
                      const value =
                        action.kind === "create"
                          ? "__create__"
                          : action.kind === "skip"
                            ? "__skip__"
                            : action.productId;
                      return (
                        <tr key={i} className="text-foreground">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2 truncate max-w-[280px]">
                            {name || <span className="opacity-50 italic">(empty)</span>}
                          </td>
                          <td className="px-3 py-2">
                            <Select
                              value={value}
                              onValueChange={(v) => {
                                if (v === "__create__") setRowAction(i, { kind: "create" });
                                else if (v === "__skip__") setRowAction(i, { kind: "skip" });
                                else setRowAction(i, { kind: "update", productId: v });
                              }}
                            >
                              <SelectTrigger className="h-8 bg-white/5 border-input text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__create__">
                                  ✨ Create new product
                                </SelectItem>
                                <SelectItem value="__skip__">
                                  Skip this row
                                </SelectItem>
                                {existingProducts.length > 0 && (
                                  <div className="px-2 pt-1.5 pb-1 text-2xs uppercase tracking-wide text-muted-foreground/70">
                                    Update existing
                                  </div>
                                )}
                                {existingProducts.map((p) => {
                                  const id = getProductId(p);
                                  return (
                                    <SelectItem key={id} value={id}>
                                      {p.name}
                                      {p.city ? (
                                        <span className="text-muted-foreground">
                                          {" "}
                                          · {p.city}
                                        </span>
                                      ) : null}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------- STEP 4 ---------------------------- */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground/80">
              Ready to import. Existing products will be{" "}
              <span className="text-foreground font-medium">updated</span> with
              the values from the CSV (CSV always wins). New products will be
              created with the mapped fields; we&apos;ll attempt to enrich them
              with Google Places data after creation.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <SummaryTile label="Create new" value={summary.create} tone="cta" />
              <SummaryTile label="Update existing" value={summary.update} tone="info" />
              <SummaryTile label="Skip" value={summary.skip} tone="muted" />
            </div>
            <div className="rounded-lg border border-white/10 overflow-hidden max-h-[40vh] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-white/5 sticky top-0">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Row</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((r, i) => {
                    const name = r[nameColumnIndex] ?? "";
                    const a = rowActions[i];
                    let label: string;
                    let tone: string;
                    if (a?.kind === "update") {
                      const target = existingProducts.find((p) => getProductId(p) === a.productId);
                      label = `Update → ${target?.name ?? a.productId}`;
                      tone = "text-sky-300";
                    } else if (a?.kind === "create") {
                      label = "Create new";
                      tone = "text-emerald-300";
                    } else {
                      label = "Skip";
                      tone = "text-muted-foreground/70";
                    }
                    return (
                      <tr key={i} className="text-foreground">
                        <td className="px-3 py-2 truncate max-w-[260px]">
                          {name || <span className="opacity-50 italic">(empty)</span>}
                        </td>
                        <td className={cn("px-3 py-2", tone)}>{label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <DialogFooter className="gap-2 flex-wrap">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-input text-foreground"
            >
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onClose}
              className="border-input text-foreground"
            >
              Cancel
            </Button>
          )}
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !canStep2) ||
                (step === 2 && !canStep3) ||
                (step === 3 && !canStep4)
              }
            >
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importing…" : `Import ${summary.create + summary.update} rows`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cta" | "info" | "muted";
}) {
  const toneClass =
    tone === "cta"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : tone === "info"
        ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
        : "border-white/10 bg-white/5 text-muted-foreground";
  return (
    <div className={cn("rounded-lg border px-3 py-2", toneClass)}>
      <div className="text-2xl font-semibold leading-none">{value}</div>
      <div className="mt-0.5 text-2xs uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );
}
