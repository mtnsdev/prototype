"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, MapPin, Search } from "lucide-react";
import Image from "next/image";
import type { Product, ProductCategory } from "@/types/product";
import { createProduct, updateProduct, getProductId } from "@/lib/products-api";
import {
  fetchPlacePhoto,
  inferProductCategoryFromPlaceTypes,
  searchPlaces,
  type PlaceSearchResult,
} from "@/lib/placesApi";
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
  { id: 1, label: "Find on Google" },
  { id: 2, label: "Details" },
  { id: 3, label: "Category details" },
] as const;

const COUNTRIES = ["France", "United Kingdom", "United States", "Switzerland", "Italy", "Spain"];

type Props = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSaved: () => void;
  /** Called after a successful create (not on edit) with the API response. */
  onCreated?: (product: Product) => void;
};

export default function AddProductModal({ open, onClose, product, onSaved, onCreated }: Props) {
  // When editing an existing product we skip the Find-on-Google step entirely.
  const isEdit = !!product && !!String(getProductId(product)).trim();
  const initialStep = isEdit ? 2 : 1;

  const [step, setStep] = useState(initialStep);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** JIRA-style "Create another" — when on, a successful create resets the form
   *  and stays in the modal at step 1 instead of closing. */
  const [createAnother, setCreateAnother] = useState(false);
  /** Inline confirmation shown briefly after a "Create another" save. */
  const [lastCreatedName, setLastCreatedName] = useState<string | null>(null);

  const [category, setCategory] = useState<ProductCategory | null>(product?.category ?? null);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [country, setCountry] = useState(product?.country ?? "");
  const [city, setCity] = useState(product?.city ?? "");
  const [region, setRegion] = useState(product?.region ?? "");
  const [address, setAddress] = useState(product?.address ?? "");
  const [subcategory, setSubcategory] = useState(product?.subcategory ?? "");
  const [latitude, setLatitude] = useState<number | undefined>(product?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(product?.longitude);
  const [heroImageUrl, setHeroImageUrl] = useState<string | undefined>(product?.hero_image_url);

  // Places-search state (step 1 only).
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [pickedPlace, setPickedPlace] = useState<PlaceSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCategory(product?.category ?? null);
    setName(product?.name ?? "");
    setDescription(product?.description ?? "");
    setCountry(product?.country ?? "");
    setCity(product?.city ?? "");
    setRegion(product?.region ?? "");
    setAddress(product?.address ?? "");
    setSubcategory(product?.subcategory ?? "");
    setLatitude(product?.latitude);
    setLongitude(product?.longitude);
    setHeroImageUrl(product?.hero_image_url);
    setStep(initialStep);
    setError(null);
    setSearchQuery("");
    setSearchResults([]);
    setSearchedOnce(false);
    setPickedPlace(null);
    setSearchError(null);
    setLastCreatedName(null);
    setCreateAnother(false);
  }, [open, product, initialStep]);

  // Auto-dismiss the "Created …" banner after a few seconds.
  useEffect(() => {
    if (!lastCreatedName) return;
    const t = setTimeout(() => setLastCreatedName(null), 4000);
    return () => clearTimeout(t);
  }, [lastCreatedName]);

  const nameValid = name.trim().length > 0 && name.trim().length <= 200;
  // Step 2 is the merged Category + Core details panel — name and category are the only requirements.
  const canStep3FromDetails = nameValid && category != null;

  const runSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    setSearchedOnce(true);
    try {
      const results = await searchPlaces(q);
      setSearchResults(results);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handlePickPlace = async (place: PlaceSearchResult) => {
    setPickedPlace(place);
    setName(place.name);
    setAddress(place.formatted_address);
    setCity(place.city);
    setCountry(place.country);
    setRegion(place.region ?? "");
    setLatitude(place.latitude);
    setLongitude(place.longitude);

    const inferred = inferProductCategoryFromPlaceTypes(place.types);
    if (inferred) setCategory(inferred);

    // Kick off the photo fetch in the background; it lands on the product
    // once it resolves (and is also persisted on create).
    void fetchPlacePhoto(place.place_id).then((url) => {
      if (url) setHeroImageUrl(url);
    });

    setStep(2);
  };

  const handleSkipSearch = () => {
    setPickedPlace(null);
    setStep(2);
  };

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    // Editing flow starts at step 2 — never let it return to the search step.
    const min = isEdit ? 2 : 1;
    if (step > min) setStep((s) => s - 1);
  };

  const resetFormForAnother = () => {
    setCategory(null);
    setName("");
    setDescription("");
    setCountry("");
    setCity("");
    setRegion("");
    setAddress("");
    setSubcategory("");
    setLatitude(undefined);
    setLongitude(undefined);
    setHeroImageUrl(undefined);
    setSearchQuery("");
    setSearchResults([]);
    setSearchedOnce(false);
    setPickedPlace(null);
    setSearchError(null);
    setError(null);
    setStep(1);
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
        category: category!,
        subcategory: subcategory || undefined,
        latitude,
        longitude,
        hero_image_url: heroImageUrl,
      };
      if (isEdit) {
        await updateProduct(getProductId(product!), body);
        onSaved();
      } else {
        const created = await createProduct(body);
        const createdName = body.name ?? "Product";
        if (createAnother) {
          // Stay in the modal: reset the wizard and show a tiny inline
          // confirmation. We deliberately don't call `onSaved`/`onCreated` so
          // the parent doesn't close the modal or open the side panel; the
          // directory will refresh when the user finally closes the modal.
          setLastCreatedName(createdName);
          resetFormForAnother();
        } else {
          onCreated?.(created);
          onSaved();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // The step-indicator hides the search step on edit so the row of pills stays
  // anchored on the three relevant phases.
  const visibleSteps = isEdit ? STEPS.filter((s) => s.id !== 1) : STEPS;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-input max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          {visibleSteps.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex-1 py-1.5 rounded text-center text-xs font-medium",
                step === s.id ? "bg-white/15 text-foreground" : "bg-white/5 text-muted-foreground/75"
              )}
            >
              {s.label}
            </div>
          ))}
        </div>

        {step === 1 && !isEdit && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void runSearch();
                  }
                }}
                placeholder="e.g. Aman Tokyo"
                className="bg-white/5 border-input text-foreground"
              />
              <Button
                onClick={() => void runSearch()}
                disabled={searching || searchQuery.trim().length === 0}
              >
                {searching ? (
                  <Loader2 size={16} className="mr-1 animate-spin" />
                ) : (
                  <Search size={16} className="mr-1" />
                )}
                Search
              </Button>
            </div>

            {searchError && <p className="text-sm text-red-400">{searchError}</p>}

            {searching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                <Loader2 size={14} className="animate-spin" /> Searching Google Places…
              </div>
            ) : searchedOnce ? (
              searchResults.length > 0 ? (
                <ul className="max-h-72 overflow-y-auto rounded-lg border border-input divide-y divide-white/5">
                  {searchResults.map((r) => (
                    <li key={r.place_id}>
                      <button
                        type="button"
                        onClick={() => handlePickPlace(r)}
                        className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-white/5"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white/10">
                          {/* Falls back gracefully — `unoptimized` avoids the Next image-domain allow-list for prototype data. */}
                          <Image
                            src={r.photo_url}
                            alt=""
                            fill
                            sizes="48px"
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <MapPin size={11} className="shrink-0" />
                            {r.formatted_address}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground/80">
                  No matches. Try a different name or add the product manually.
                </p>
              )
            ) : (
              <p className="text-xs text-muted-foreground/60">
                Tip: search by the exact property name for the best match.
              </p>
            )}

            <button
              type="button"
              onClick={handleSkipSearch}
              className="text-xs font-medium text-foreground/80 underline-offset-2 hover:underline"
            >
              Can&apos;t find it? Add the product manually →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {pickedPlace && (
              <div className="rounded-md border border-input bg-white/5 p-2 text-xs text-muted-foreground">
                Prefilled from <span className="font-medium text-foreground">{pickedPlace.name}</span>. Adjust any field below.
              </div>
            )}

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
              <Label className="text-muted-foreground">Category *</Label>
              <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors",
                        category === cat
                          ? "border-[#F5F5F5] bg-white/10 text-foreground"
                          : "border-input bg-white/5 text-muted-foreground hover:border-white/20"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-medium">{CATEGORY_LABELS[cat]}</span>
                    </button>
                  );
                })}
              </div>
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
                <Label className="text-muted-foreground">Country</Label>
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
                    {/* Places may give us countries that aren't in the curated short-list yet. */}
                    {country && !COUNTRIES.includes(country) && (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">City</Label>
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

        {/* Brief confirmation after a "Create another" save — auto-cleared as soon as the user starts typing again. */}
        {!isEdit && lastCreatedName && (
          <p className="text-xs text-emerald-400">
            Created &ldquo;{lastCreatedName}&rdquo;. Add another below.
          </p>
        )}

        <DialogFooter className="gap-2 flex-wrap items-center">
          {/* JIRA-style "Create another" — only on the final step of the create flow. */}
          {!isEdit && step === 3 && (
            <label className="mr-auto flex items-center gap-2 text-xs text-muted-foreground/85">
              <input
                type="checkbox"
                checked={createAnother}
                onChange={(e) => setCreateAnother(e.target.checked)}
                className="size-3.5 rounded border-input bg-white/5 accent-brand-cta"
              />
              Create another
            </label>
          )}
          {step > (isEdit ? 2 : 1) ? (
            <Button variant="outline" onClick={handleBack} className="border-input text-foreground">
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose} className="border-input text-foreground">
              Cancel
            </Button>
          )}
          {step === 1 ? (
            // No "Next" on the search step — picking a result or skipping moves
            // the wizard forward implicitly.
            <span />
          ) : step < 3 ? (
            <Button onClick={handleNext} disabled={!canStep3FromDetails}>
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
