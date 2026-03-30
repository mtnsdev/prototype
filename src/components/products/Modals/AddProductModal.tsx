"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, ProductCategory } from "@/types/product";
import { createProduct, updateProduct, getProductId } from "@/lib/products-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_ICONS, CATEGORY_LABELS, SUBCATEGORY_OPTIONS } from "@/config/productCategoryConfig";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Category" },
  { id: 2, label: "Core details" },
  { id: 3, label: "Category details" },
] as const;

const STATUS_OPTIONS: { value: Product["status"]; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending_review", label: "Pending review" },
  { value: "archived", label: "Archived" },
];

const COUNTRIES = ["France", "United Kingdom", "United States", "Switzerland", "Italy", "Spain"];

type Props = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSaved: () => void;
};

export default function AddProductModal({ open, onClose, product, onSaved }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<ProductCategory | null>(product?.category ?? null);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [country, setCountry] = useState(product?.country ?? "");
  const [city, setCity] = useState(product?.city ?? "");
  const [region, setRegion] = useState(product?.region ?? "");
  const [address, setAddress] = useState(product?.address ?? "");
  const [status, setStatus] = useState<Product["status"]>(product?.status ?? "draft");
  const [subcategory, setSubcategory] = useState(product?.subcategory ?? "");

  useEffect(() => {
    if (!open) return;
    setCategory(product?.category ?? null);
    setName(product?.name ?? "");
    setDescription(product?.description ?? "");
    setCountry(product?.country ?? "");
    setCity(product?.city ?? "");
    setRegion(product?.region ?? "");
    setAddress(product?.address ?? "");
    setStatus(product?.status ?? "draft");
    setSubcategory(product?.subcategory ?? "");
    setStep(1);
    setError(null);
  }, [open, product]);

  const isEdit = !!product && !!String(getProductId(product)).trim();

  const canStep2 = category != null;
  const nameValid = name.trim().length > 0 && name.trim().length <= 200;
  const canStep3 = canStep2 && nameValid && country && city;

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const body: Partial<Product> = {
        name: name.trim(),
        description: description.trim() || undefined,
        country,
        city: city.trim(),
        region: region.trim() || undefined,
        address: address.trim() || undefined,
        status,
        category: category!,
        subcategory: subcategory || undefined,
      };
      if (isEdit) {
        await updateProduct(getProductId(product!), body);
      } else {
        await createProduct(body);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-accent border-input max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-colors",
                    category === cat
                      ? "border-[#F5F5F5] bg-white/10 text-foreground"
                      : "border-input bg-white/5 text-muted-foreground hover:border-white/20"
                  )}
                >
                  <Icon className="h-8 w-8 mb-2 text-muted-foreground" />
                  <span className="text-sm font-medium">{CATEGORY_LABELS[cat]}</span>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name (required, max 200 characters)"
                className="mt-1 bg-white/5 border-input text-foreground"
                maxLength={200}
              />
              {name.trim().length > 0 && name.trim().length > 200 && (
                <p className="text-xs text-red-400 mt-0.5">Name must be 200 characters or fewer.</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/75"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Country *</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="mt-1 bg-white/5 border-input text-foreground">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">City *</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="mt-1 bg-white/5 border-input text-foreground"
                />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Region</Label>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Region"
                className="mt-1 bg-white/5 border-input text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full address"
                className="mt-1 bg-white/5 border-input text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Product["status"])}>
                <SelectTrigger className="mt-1 bg-white/5 border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 3 && category && (
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Subcategory</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger className="mt-1 bg-white/5 border-input text-foreground">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {SUBCATEGORY_OPTIONS[category].map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {category === "accommodation" && (
              <>
                <div>
                  <Label className="text-muted-foreground">Star rating</Label>
                  <Select
                    value={String((product as { star_rating?: number })?.star_rating ?? "")}
                    onValueChange={() => {}}
                  >
                    <SelectTrigger className="mt-1 bg-white/5 border-input text-foreground">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} ★
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Room count</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 100"
                    className="mt-1 bg-white/5 border-input text-foreground"
                  />
                </div>
              </>
            )}
            {category === "activity" && (
              <div>
                <Label className="text-muted-foreground">Duration</Label>
                <Input
                  placeholder="e.g. 2 hours, half day"
                  className="mt-1 bg-white/5 border-input text-foreground"
                />
              </div>
            )}
            {category === "restaurant" && (
              <>
                <div>
                  <Label className="text-muted-foreground">Michelin stars</Label>
                  <Select value="" onValueChange={() => {}}>
                    <SelectTrigger className="mt-1 bg-white/5 border-input text-foreground">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} ★
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cuisine type</Label>
                  <Input
                    placeholder="e.g. French, Mediterranean"
                    className="mt-1 bg-white/5 border-input text-foreground"
                  />
                </div>
              </>
            )}
            {category === "cruise" && (
              <>
                <div>
                  <Label className="text-muted-foreground">Ship name</Label>
                  <Input placeholder="e.g. Seabourn Odyssey" className="mt-1 bg-white/5 border-input text-foreground" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Cruise line</Label>
                  <Input placeholder="e.g. Seabourn" className="mt-1 bg-white/5 border-input text-foreground" />
                </div>
              </>
            )}
            {["dmc", "service_provider", "transportation"].includes(category) && (
              <p className="text-sm text-muted-foreground/75">
                Category-specific fields can be added on the product detail page after creation.
              </p>
            )}
          </div>
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
          {step < 3 ? (
            <Button onClick={handleNext} disabled={step === 1 ? !canStep2 : !canStep3}>
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save" : "Create"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
