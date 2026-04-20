"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { importVICs, triggerAcuityBulk } from "@/lib/vic-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  listSurfaceClass,
  listScrollClass,
  listTableClass,
  listTheadRowClass,
  listTbodyRowClass,
  listTdClass,
  listThClass,
  listMutedCellClass,
} from "@/lib/list-ui";

const STEPS = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Map columns" },
  { id: 3, label: "Preview" },
  { id: 4, label: "Options" },
  { id: 5, label: "Import" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const VIC_FIELDS = [
  { key: "full_name", label: "Full name", required: true },
  { key: "preferred_name", label: "Preferred name", required: false },
  { key: "email", label: "Email", required: false },
  { key: "phone_primary", label: "Phone", required: false },
  { key: "home_city", label: "City", required: false },
  { key: "home_country", label: "Country", required: false },
  { key: "relationship_status", label: "Relationship status", required: false },
  { key: "tags", label: "Tags (comma-separated)", required: false },
] as const;

const DUPLICATE_OPTIONS = [
  { value: "skip", label: "Skip rows with matching email" },
  { value: "update", label: "Update existing by email" },
  { value: "create", label: "Always create new" },
] as const;

const DEFAULT_STATUS_OPTIONS = [
  { value: "", label: "—" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "prospect", label: "Prospect" },
  { value: "past", label: "Past" },
  { value: "do_not_contact", label: "Do not contact" },
] as const;

type Props = {
  onClose: () => void;
  onImported: (ids?: string[]) => void;
};

type ParsedRow = Record<string, string>;

export default function ImportCSVModal({ onClose, onImported }: Props) {
  const [step, setStep] = useState<StepId>(1);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowsSkipped, setRowsSkipped] = useState(0);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update" | "create">("skip");
  const [defaultRelationshipStatus, setDefaultRelationshipStatus] = useState("");
  const [imported, setImported] = useState(0);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = useCallback((text: string): { rows: ParsedRow[]; headers: string[]; skipped: number } => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return { rows: [], headers: [], skipped: 0 };
    const rawHeaders = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    let skipped = 0;
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      rawHeaders.forEach((h, j) => {
        row[h] = values[j] ?? "";
      });
      const fullName = (row["full_name"] ?? row[rawHeaders[0] ?? ""] ?? "").trim();
      if (!fullName) {
        skipped++;
        continue;
      }
      rows.push(row);
    }
    return { rows, headers: rawHeaders, skipped };
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f?.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file.");
      return;
    }
    setError(null);
    setFile(f);
    setColumnMap({});
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const { rows: r, headers: h, skipped: s } = parseCSV(text);
      setRows(r);
      setHeaders(h);
      setRowsSkipped(s);
      setStep(2);
    };
    reader.readAsText(f);
  };

  const setMapping = (fieldKey: string, csvHeader: string) => {
    setColumnMap((prev) => (csvHeader === "" ? { ...prev, [fieldKey]: "" } : { ...prev, [fieldKey]: csvHeader }));
  };

  const mappedRows = useCallback(() => {
    const fullNameHeader = columnMap["full_name"] || headers[0];
    return rows.map((row) => {
      const out: Record<string, string> = {};
      VIC_FIELDS.forEach(({ key }) => {
        const csvCol = columnMap[key];
        if (csvCol) out[key] = (row[csvCol] ?? "").trim();
        else if (key === "full_name") out[key] = (row[fullNameHeader] ?? "").trim();
        else out[key] = "";
      });
      if (defaultRelationshipStatus && !out.relationship_status) out.relationship_status = defaultRelationshipStatus;
      return out;
    });
  }, [rows, columnMap, headers, defaultRelationshipStatus]);

  const validMappedRows = useCallback(() => {
    return mappedRows().filter((r) => (r.full_name ?? "").trim().length > 0);
  }, [mappedRows]);

  const buildCSVBlob = useCallback((): Blob => {
    const cols = VIC_FIELDS.map((f) => f.key);
    const headerLine = cols.join(",");
    const dataLines = validMappedRows().map((r) =>
      cols.map((c) => {
        const v = (r[c] ?? "").replace(/"/g, '""');
        return v.includes(",") || v.includes('"') ? `"${v}"` : v;
      }).join(",")
    );
    const csv = [headerLine, ...dataLines].join("\n");
    return new Blob([csv], { type: "text/csv;charset=utf-8" });
  }, [validMappedRows]);

  const handleImport = async () => {
    setError(null);
    setLoading(true);
    try {
      const blob = buildCSVBlob();
      const formData = new FormData();
      formData.append("file", new File([blob], file?.name ?? "import.csv", { type: "text/csv" }));
      formData.append("duplicate_mode", duplicateMode);
      const result = await importVICs(formData);
      setImported(result.imported ?? validMappedRows().length);
      setImportedIds(result.ids ?? []);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRunAcuityOnAll = async () => {
    if (importedIds.length === 0) {
      onImported();
      return;
    }
    try {
      await triggerAcuityBulk(importedIds);
      onImported(importedIds);
    } catch {
      onImported();
    }
  };

  const canProceedFromMap = (columnMap["full_name"] ?? headers[0]) && headers.length > 0;
  const previewRows = step === 3 ? validMappedRows().slice(0, 10) : [];
  const validCount = step >= 3 ? validMappedRows().length : 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import VICs from CSV</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b border-border pb-3">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => step > s.id && setStep(s.id)}
              className={cn(
                "rounded-full w-8 h-8 flex items-center justify-center text-xs font-medium transition-colors",
                step === s.id ? "bg-muted text-foreground" : step > s.id ? "bg-primary/15 text-foreground" : "bg-foreground/[0.06] text-muted-foreground/75"
              )}
            >
              {s.id}
            </button>
          ))}
          <span className="text-xs text-muted-foreground/75 ml-1">
            {STEPS.find((s) => s.id === step)?.label}
          </span>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="space-y-3">
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/35 transition-colors"
                onClick={() => document.getElementById("vic-csv-input")?.click()}
              >
                <input
                  id="vic-csv-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFile}
                />
                <Upload className="w-10 h-10 mx-auto text-muted-foreground/75 mb-2" />
                <p className="text-sm text-muted-foreground">Click to select a CSV file</p>
              </div>
              <p className="text-xs text-muted-foreground/75">
                Step 2 will let you map your columns to VIC fields. Full name is required.
              </p>
            </div>
          )}

          {/* Step 2: Map columns */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Map each VIC field to a column from your CSV (or leave as — to skip).
              </p>
              <div className="space-y-3">
                {VIC_FIELDS.map(({ key, label, required }) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-44 shrink-0 text-sm">
                      {label}
                      {required && " *"}
                    </Label>
                    <select
                      value={columnMap[key] ?? (key === "full_name" ? headers[0] ?? "" : "")}
                      onChange={(e) => setMapping(key, e.target.value)}
                      className="flex-1 rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">—</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong>{validCount}</strong> rows will be imported.
                {rowsSkipped > 0 && ` ${rowsSkipped} rows skipped (no full name).`}
              </p>
              <div className={cn(listSurfaceClass, listScrollClass, "overflow-hidden")}>
                <table className={listTableClass()}>
                  <thead>
                    <tr className={listTheadRowClass}>
                      {VIC_FIELDS.map((f) => (
                        <th key={f.key} className={cn(listThClass, "whitespace-nowrap")}>
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className={listTbodyRowClass}>
                        {VIC_FIELDS.map((f) => (
                          <td key={f.key} className={cn(listTdClass, listMutedCellClass, "max-w-[140px] truncate")}>
                            {row[f.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 4: Options */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm">When a row has an email that already exists</Label>
                <select
                  value={duplicateMode}
                  onChange={(e) => setDuplicateMode(e.target.value as typeof duplicateMode)}
                  className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground"
                >
                  {DUPLICATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm">Default relationship status for new VICs</Label>
                <select
                  value={defaultRelationshipStatus}
                  onChange={(e) => setDefaultRelationshipStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-foreground/[0.05] px-3 py-2 text-sm text-foreground"
                >
                  {DEFAULT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 5: Result */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <strong>{imported}</strong> VICs have been imported.
                {rowsSkipped > 0 && ` ${rowsSkipped} rows were skipped (missing name).`}
              </p>
              <p className="text-sm text-muted-foreground">
                Run Acuity Intelligence on all {imported} imported VICs?
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border pt-3 shrink-0">
          <div className="flex items-center justify-between w-full">
            <div>
              {step > 1 && step < 5 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1) as StepId)} className="gap-1">
                  <ChevronLeft size={16} />
                  Back
                </Button>
              )}
              {step === 1 && (
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              )}
            </div>
            <div className="flex gap-2">
              {step === 2 && (
                <Button onClick={() => setStep(3)} disabled={!canProceedFromMap}>
                  Next
                  <ChevronRight size={16} />
                </Button>
              )}
              {step === 3 && (
                <Button onClick={() => setStep(4)}>
                  Next
                  <ChevronRight size={16} />
                </Button>
              )}
              {step === 4 && (
                <Button onClick={handleImport} disabled={loading || validCount === 0}>
                  {loading ? "Importing…" : "Import"}
                </Button>
              )}
              {step === 5 && (
                <>
                  <Button variant="outline" onClick={() => onImported()}>Done</Button>
                  <Button onClick={handleRunAcuityOnAll}>Run Acuity on all</Button>
                </>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
