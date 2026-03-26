"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/types/product";
import { enrichProduct } from "@/lib/products-api";
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

const ENRICH_FIELDS = [
  { id: "description", label: "Description" },
  { id: "tags", label: "Tags" },
  { id: "client_suitability", label: "Client suitability" },
  { id: "best_for_occasions", label: "Best for occasions" },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  products?: Product[]; // bulk: multiple products
  onEnriched: () => void;
};

export default function EnrichProductModal({ open, onClose, product, products: bulkProducts, onEnriched }: Props) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState<"pick" | "review">("pick");
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const isBulk = Array.isArray(bulkProducts) && bulkProducts.length > 0;
  const targets = isBulk ? bulkProducts : product ? [product] : [];

  useEffect(() => {
    if (!open) {
      setSelectedFields([]);
      setSuggestions({});
      setAccepted({});
      setStep("pick");
      setError(null);
      setBulkProgress({ current: 0, total: 0 });
    }
  }, [open]);

  const toggleField = (id: string) => {
    setSelectedFields((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const runEnrich = async () => {
    if (selectedFields.length === 0) return;
    setError(null);
    setLoading(true);
    if (isBulk && targets.length > 0) {
      setBulkProgress({ current: 0, total: targets.length });
      for (let i = 0; i < targets.length; i++) {
        setBulkProgress((p) => ({ ...p, current: i + 1 }));
        try {
          await enrichProduct((targets[i] as Product).id ?? (targets[i] as { _id: string })._id, {
            fields_to_enrich: selectedFields,
          });
        } catch (_) {
          // continue with next
        }
      }
      setLoading(false);
      onEnriched();
      onClose();
      return;
    }
    const single = product ?? targets[0];
    if (!single) {
      setLoading(false);
      return;
    }
    try {
      const result = await enrichProduct((single as Product).id ?? (single as { _id: string })._id, {
        fields_to_enrich: selectedFields,
      });
      setSuggestions(result as Record<string, string>);
      ENRICH_FIELDS.forEach((f) => setAccepted((prev) => ({ ...prev, [f.id]: false })));
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrichment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptReject = (fieldId: string, accept: boolean) => {
    setAccepted((prev) => ({ ...prev, [fieldId]: accept }));
  };

  const handleSaveAccepted = async () => {
    setLoading(true);
    setError(null);
    const single = product ?? targets[0];
    if (!single) {
      setLoading(false);
      return;
    }
    try {
      const toApply = selectedFields.filter((f) => accepted[f]);
      if (toApply.length > 0) {
        await enrichProduct((single as Product).id ?? (single as { _id: string })._id, {
          fields_to_enrich: toApply,
        });
      }
      onEnriched();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F5F5F5]">
            {isBulk ? `Enrich ${targets.length} products` : "Enrich with AI"}
          </DialogTitle>
        </DialogHeader>

        {step === "pick" && (
          <>
            <p className="text-sm text-[rgba(245,245,245,0.7)] mb-4">
              Choose fields to generate or improve with AI. You can review and accept suggestions before saving.
            </p>
            <div className="space-y-2">
              {ENRICH_FIELDS.map((f) => (
                <label key={f.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(f.id)}
                    onChange={() => toggleField(f.id)}
                    className="checkbox-on-dark"
                  />
                  <span className="text-sm text-[#F5F5F5]">{f.label}</span>
                </label>
              ))}
            </div>
            {isBulk && (
              <p className="text-xs text-[rgba(245,245,245,0.5)] mt-2">
                All selected products will be enriched for the chosen fields. Progress will be shown during the run.
              </p>
            )}
          </>
        )}

        {step === "review" && !isBulk && Object.keys(suggestions).length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-[rgba(245,245,245,0.7)]">Review AI suggestions and accept or reject each.</p>
            {selectedFields.map((fieldId) => {
              const label = ENRICH_FIELDS.find((f) => f.id === fieldId)?.label ?? fieldId;
              const value = suggestions[fieldId];
              if (value == null) return null;
              return (
                <div key={fieldId} className="rounded-lg border border-white/10 p-3 bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[rgba(245,245,245,0.8)]">{label}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("h-7 text-xs", accepted[fieldId] === true && "bg-[var(--muted-success-bg)] border-[var(--muted-success-border)]")}
                        onClick={() => handleAcceptReject(fieldId, true)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("h-7 text-xs", accepted[fieldId] === false && "bg-[var(--muted-error-bg)] border-[var(--muted-error-border)]")}
                        onClick={() => handleAcceptReject(fieldId, false)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-[rgba(245,245,245,0.9)] whitespace-pre-wrap line-clamp-4">{value}</p>
                </div>
              );
            })}
          </div>
        )}

        {loading && isBulk && (
          <div className="py-4">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#F5F5F5] transition-all"
                style={{ width: `${(bulkProgress.total ? (bulkProgress.current / bulkProgress.total) * 100 : 0)}%` }}
              />
            </div>
            <p className="text-xs text-[rgba(245,245,245,0.5)] mt-2">
              {bulkProgress.current} / {bulkProgress.total} products
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <DialogFooter className="gap-2 flex-wrap">
          {step === "review" && !isBulk ? (
            <>
              <Button variant="outline" onClick={() => setStep("pick")} className="border-white/10 text-[#F5F5F5]">
                Back
              </Button>
              <Button onClick={handleSaveAccepted} disabled={loading}>
                {loading ? "Saving…" : "Save accepted"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="border-white/10 text-[#F5F5F5]">
                Cancel
              </Button>
              <Button onClick={runEnrich} disabled={loading || selectedFields.length === 0}>
                {loading ? "Running…" : isBulk ? "Enrich selected" : "Generate suggestions"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
