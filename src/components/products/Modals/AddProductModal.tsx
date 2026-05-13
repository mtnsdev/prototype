"use client";

import { useState, useEffect } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
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
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/config/productCategoryConfig";
import { cn } from "@/lib/utils";

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
  const isEdit = !!product && !!String(getProductId(product)).trim();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Reveals the manual fields. Auto-on for edits; on create, becomes true once
   *  the user picks a Google result or clicks "Add manually". */
  const [manualOpen, setManualOpen] = useState(isEdit);

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

  // Google Places search state (create mode only).
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
    setError(null);
    setSearchQuery("");
    setSearchResults([]);
    setSearchedOnce(false);
    setPickedPlace(null);
    setSearchError(null);
    setManualOpen(isEdit);
  }, [open, product, isEdit]);

  const nameValid = name.trim().length > 0 && name.trim().length <= 200;
  const canSubmit = nameValid && category != null;

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

    // Background photo fetch — populates the hero image as soon as it resolves.
    void fetchPlacePhoto(place.place_id).then((url) => {
      if (url) setHeroImageUrl(url);
    });

    setSearchResults([]);
    setSearchedOnce(false);
    setManualOpen(true);
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
        // Parent opens the product detail (e.g. side panel) via onCreated.
        onCreated?.(created);
        onSaved();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-input max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEdit ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Google Places quick-search — create mode only. Picking a result prefills the manual fields, which then reveal. */}
          {!isEdit && (
            <div className="space-y-2 rounded-lg border border-input bg-white/[0.03] p-3">
              <Label className="text-muted-foreground">Find on Google</Label>
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
                  type="button"
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
              ) : searchedOnce && searchResults.length > 0 ? (
                <ul className="max-h-60 overflow-y-auto rounded-lg border border-input divide-y divide-white/5">
                  {searchResults.map((r) => (
                    <li key={r.place_id}>
                      <button
                        type="button"
                        onClick={() => handlePickPlace(r)}
                        className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-white/5"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white/10">
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
              ) : searchedOnce ? (
                <p className="text-xs text-muted-foreground/70">No matches.</p>
              ) : (
                <p className="text-xs text-muted-foreground/65">
                  Tip: search by the exact property name for the best match.
                </p>
              )}

              {pickedPlace && (
                <p className="text-xs text-muted-foreground">
                  Prefilled from <span className="font-medium text-foreground">{pickedPlace.name}</span>. Adjust any field below.
                </p>
              )}

              {!manualOpen && (
                <button
                  type="button"
                  onClick={() => setManualOpen(true)}
                  className="text-xs font-medium text-foreground/80 underline-offset-2 hover:underline"
                >
                  Can&apos;t find it? Add the product manually →
                </button>
              )}
            </div>
          )}

          {manualOpen && (
            <>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="mt-1 bg-white/5 border-input text-foreground"
              />
            </div>
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
                  {country && !COUNTRIES.includes(country) && (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/65">
            More details (subcategory, description, region, address, category-specific fields) can be added on the product detail page after creation.
          </p>
            </>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <DialogFooter className="gap-2 flex-wrap items-center">
          <Button variant="outline" onClick={onClose} className="border-input text-foreground">
            Cancel
          </Button>
          {manualOpen && (
            <Button onClick={handleSave} disabled={saving || !canSubmit}>
              {saving ? "Saving…" : isEdit ? "Save" : "Create"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
