"use client";

import type { Dispatch, SetStateAction } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type {
  Destination,
  DMCPartner,
  Restaurant,
  Hotel,
  YachtCompany,
  TourismRegion,
  DestinationDocument,
} from "@/data/destinations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CatalogProductPicker } from "@/components/destinations/editor/CatalogProductPicker";
import {
  mergeDirectoryProductIntoDmc,
  mergeDirectoryProductIntoHotel,
  mergeDirectoryProductIntoRestaurant,
  mergeDirectoryProductIntoYacht,
} from "@/lib/catalogProductMerge";

const inputAreaClass =
  "min-h-[88px] w-full rounded-md border border-input bg-inset px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground/70 focus-visible:border-[rgba(255,255,255,0.25)] focus-visible:ring-[3px] focus-visible:ring-[rgba(255,255,255,0.1)]";

export function moveInArray<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export function EditorOverview({
  draft,
  setDraft,
}: {
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dest-name">Destination name</Label>
          <Input
            id="dest-name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dest-slug">Slug (read-only)</Label>
          <Input id="dest-slug" value={draft.slug} readOnly className="opacity-80" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dest-tagline">Tagline</Label>
        <Input
          id="dest-tagline"
          value={draft.tagline}
          onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dest-hero">Hero image URL</Label>
        <Input
          id="dest-hero"
          value={draft.heroImage}
          onChange={(e) => setDraft((d) => ({ ...d, heroImage: e.target.value }))}
          placeholder="https://…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dest-desc">Description</Label>
        <textarea
          id="dest-desc"
          className={inputAreaClass}
          value={draft.description}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dest-subs">Sub-regions (one per line)</Label>
        <textarea
          id="dest-subs"
          className={inputAreaClass}
          value={draft.subRegions.join("\n")}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              subRegions: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            }))
          }
          rows={5}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export function EditorDMCList({
  draft,
  setDraft,
}: {
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
}) {
  const update = (i: number, patch: Partial<DMCPartner>) => {
    setDraft((d) => {
      const next = [...d.dmcPartners];
      next[i] = { ...next[i]!, ...patch };
      return { ...d, dmcPartners: next };
    });
  };

  const remove = (i: number) => {
    setDraft((d) => ({ ...d, dmcPartners: d.dmcPartners.filter((_, j) => j !== i) }));
  };

  const add = () => {
    const row: DMCPartner = {
      name: "New DMC partner",
      preferred: false,
    };
    setDraft((d) => ({ ...d, dmcPartners: [...d.dmcPartners, row] }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Operational fields mirror the <span className="text-foreground">catalog product</span> in production. Here you
        can curate the full prototype row.
      </p>
      {draft.dmcPartners.map((p, i) => (
        <Card key={p.productId ?? `${p.name}-${i}`} className="gap-3 py-4">
          <CardHeader className="gap-1 pb-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <CardTitle className="text-base">DMC {i + 1}</CardTitle>
              <div className="flex flex-wrap gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() =>
                    setDraft((d) => ({ ...d, dmcPartners: moveInArray(d.dmcPartners, i, i - 1) }))
                  }
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Move down"
                  disabled={i === draft.dmcPartners.length - 1}
                  onClick={() =>
                    setDraft((d) => ({ ...d, dmcPartners: moveInArray(d.dmcPartners, i, i + 1) }))
                  }
                >
                  <ChevronDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  aria-label="Remove DMC"
                  onClick={() => remove(i)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <CardDescription>Pick a DMC from the Product Directory mock — fields hydrate from the catalog card.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <CatalogProductPicker
              value={p.productId ?? ""}
              allowedTypes={["dmc"]}
              label="Catalog product (DMC)"
              onSelect={(product) =>
                setDraft((d) => {
                  const next = [...d.dmcPartners];
                  next[i] = mergeDirectoryProductIntoDmc(next[i]!, product);
                  return { ...d, dmcPartners: next };
                })
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Display name" className="sm:col-span-2">
                <Input value={p.name} onChange={(e) => update(i, { name: e.target.value })} />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={p.preferred}
                onChange={(e) => update(i, { preferred: e.target.checked })}
              />
              Preferred partner (this destination)
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Repped by">
                <Input value={p.reppedBy ?? ""} onChange={(e) => update(i, { reppedBy: e.target.value || undefined })} />
              </Field>
              <Field label="Website">
                <Input value={p.website ?? ""} onChange={(e) => update(i, { website: e.target.value || undefined })} />
              </Field>
              <Field label="Key contact">
                <Input
                  value={p.keyContact ?? ""}
                  onChange={(e) => update(i, { keyContact: e.target.value || undefined })}
                />
              </Field>
              <Field label="General requests email">
                <Input
                  value={p.generalRequests ?? ""}
                  onChange={(e) => update(i, { generalRequests: e.target.value || undefined })}
                />
              </Field>
              <Field label="Pricing model" className="sm:col-span-2">
                <Input value={p.pricing ?? ""} onChange={(e) => update(i, { pricing: e.target.value || undefined })} />
              </Field>
              <Field label="Payment process" className="sm:col-span-2">
                <Input
                  value={p.paymentProcess ?? ""}
                  onChange={(e) => update(i, { paymentProcess: e.target.value || undefined })}
                />
              </Field>
              <Field label="Commission process" className="sm:col-span-2">
                <Input
                  value={p.commissionProcess ?? ""}
                  onChange={(e) => update(i, { commissionProcess: e.target.value || undefined })}
                />
              </Field>
              <Field label="After hours" className="sm:col-span-2">
                <Input value={p.afterHours ?? ""} onChange={(e) => update(i, { afterHours: e.target.value || undefined })} />
              </Field>
            </div>
            <Field label="Advisor notes (destination)">
              <textarea
                className={inputAreaClass}
                rows={2}
                value={p.notes ?? ""}
                onChange={(e) => update(i, { notes: e.target.value || undefined })}
              />
            </Field>
            <Field label="Recent feedback">
              <textarea
                className={inputAreaClass}
                rows={2}
                value={p.feedback ?? ""}
                onChange={(e) => update(i, { feedback: e.target.value || undefined })}
              />
            </Field>
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1">
        <Plus className="size-4" />
        Add DMC
      </Button>
    </div>
  );
}

function RestaurantRow({
  r,
  onChange,
  onRemove,
}: {
  r: Restaurant;
  onChange: (next: Restaurant) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3 space-y-2">
      <CatalogProductPicker
        value={r.productId ?? ""}
        allowedTypes={["restaurant"]}
        label="Catalog product (Dining)"
        onSelect={(product) => onChange(mergeDirectoryProductIntoRestaurant(r, product))}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Name">
          <Input value={r.name} onChange={(e) => onChange({ ...r, name: e.target.value })} />
        </Field>
        <Field label="URL" className="sm:col-span-2">
          <Input value={r.url ?? ""} onChange={(e) => onChange({ ...r, url: e.target.value || undefined })} />
        </Field>
        <Field label="Curation note" className="sm:col-span-2">
          <Input value={r.note ?? ""} onChange={(e) => onChange({ ...r, note: e.target.value || undefined })} />
        </Field>
      </div>
      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
        Remove row
      </Button>
    </div>
  );
}

export function EditorRestaurantMap({
  draft,
  setDraft,
}: {
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
}) {
  const regions = Object.keys(draft.restaurants);

  const setRegionKey = (oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return;
    setDraft((d) => {
      if (d.restaurants[newKey] !== undefined) return d;
      const next = { ...d.restaurants };
      next[newKey] = next[oldKey] ?? [];
      delete next[oldKey];
      return { ...d, restaurants: next };
    });
  };

  const addRegion = () => {
    const name = typeof window !== "undefined" ? window.prompt("New region name")?.trim() : "";
    if (!name) return;
    setDraft((d) => {
      if (d.restaurants[name]) return d;
      return { ...d, restaurants: { ...d.restaurants, [name]: [] } };
    });
  };

  const removeRegion = (region: string) => {
    setDraft((d) => {
      const next = { ...d.restaurants };
      delete next[region];
      return { ...d, restaurants: next };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Pins dining products by sub-region (catalog IDs optional).</p>
        <Button type="button" variant="outline" size="sm" onClick={addRegion} className="gap-1">
          <Plus className="size-4" />
          Add region
        </Button>
      </div>
      {regions.map((region) => (
        <Card key={region} className="gap-3 py-4">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label>Region name</Label>
                <Input defaultValue={region} onBlur={(e) => setRegionKey(region, e.target.value.trim())} />
              </div>
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeRegion(region)}>
                Remove region
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(draft.restaurants[region] ?? []).map((row, idx) => (
              <RestaurantRow
                key={`${region}-${idx}-${row.name}`}
                r={row}
                onChange={(next) => {
                  setDraft((d) => {
                    const list = [...(d.restaurants[region] ?? [])];
                    list[idx] = next;
                    return { ...d, restaurants: { ...d.restaurants, [region]: list } };
                  });
                }}
                onRemove={() => {
                  setDraft((d) => {
                    const list = (d.restaurants[region] ?? []).filter((_, j) => j !== idx);
                    return { ...d, restaurants: { ...d.restaurants, [region]: list } };
                  });
                }}
              />
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  restaurants: {
                    ...d.restaurants,
                    [region]: [...(d.restaurants[region] ?? []), { name: "Restaurant" }],
                  },
                }))
              }
            >
              Add restaurant
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HotelRow({
  h,
  onChange,
  onRemove,
}: {
  h: Hotel;
  onChange: (next: Hotel) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3 space-y-2">
      <CatalogProductPicker
        value={h.productId ?? ""}
        allowedTypes={["hotel", "villa", "wellness"]}
        label="Catalog product (Accommodation)"
        onSelect={(product) => onChange(mergeDirectoryProductIntoHotel(h, product))}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Name">
          <Input value={h.name} onChange={(e) => onChange({ ...h, name: e.target.value })} />
        </Field>
        <Field label="Contact" className="sm:col-span-2">
          <Input value={h.contact ?? ""} onChange={(e) => onChange({ ...h, contact: e.target.value || undefined })} />
        </Field>
        <Field label="Rep firm" className="sm:col-span-2">
          <Input value={h.repFirm ?? ""} onChange={(e) => onChange({ ...h, repFirm: e.target.value || undefined })} />
        </Field>
        <Field label="URL" className="sm:col-span-2">
          <Input value={h.url ?? ""} onChange={(e) => onChange({ ...h, url: e.target.value || undefined })} />
        </Field>
        <Field label="Curation note" className="sm:col-span-2">
          <Input value={h.note ?? ""} onChange={(e) => onChange({ ...h, note: e.target.value || undefined })} />
        </Field>
        <Field label="Sub-properties (comma-separated)" className="sm:col-span-2">
          <Input
            value={(h.properties ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                ...h,
                properties: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
      </div>
      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
        Remove row
      </Button>
    </div>
  );
}

export function EditorHotelMap({
  draft,
  setDraft,
}: {
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
}) {
  const groups = Object.keys(draft.hotels);

  const setGroupKey = (oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return;
    setDraft((d) => {
      if (d.hotels[newKey] !== undefined) return d;
      const next = { ...d.hotels };
      next[newKey] = next[oldKey] ?? [];
      delete next[oldKey];
      return { ...d, hotels: next };
    });
  };

  const addGroup = () => {
    const name = typeof window !== "undefined" ? window.prompt("New group name")?.trim() : "";
    if (!name) return;
    setDraft((d) => {
      if (d.hotels[name]) return d;
      return { ...d, hotels: { ...d.hotels, [name]: [] } };
    });
  };

  const removeGroup = (group: string) => {
    setDraft((d) => {
      const next = { ...d.hotels };
      delete next[group];
      return { ...d, hotels: next };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Collapsible groups map to the public page (collection or sub-region).</p>
        <Button type="button" variant="outline" size="sm" onClick={addGroup} className="gap-1">
          <Plus className="size-4" />
          Add group
        </Button>
      </div>
      {groups.map((group) => (
        <Card key={group} className="gap-3 py-4">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[200px] flex-1 space-y-2">
                <Label>Group name</Label>
                <Input defaultValue={group} onBlur={(e) => setGroupKey(group, e.target.value.trim())} />
              </div>
              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeGroup(group)}>
                Remove group
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(draft.hotels[group] ?? []).map((row, idx) => (
              <HotelRow
                key={`${group}-${idx}-${row.name}`}
                h={row}
                onChange={(next) => {
                  setDraft((d) => {
                    const list = [...(d.hotels[group] ?? [])];
                    list[idx] = next;
                    return { ...d, hotels: { ...d.hotels, [group]: list } };
                  });
                }}
                onRemove={() => {
                  setDraft((d) => {
                    const list = (d.hotels[group] ?? []).filter((_, j) => j !== idx);
                    return { ...d, hotels: { ...d.hotels, [group]: list } };
                  });
                }}
              />
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  hotels: {
                    ...d.hotels,
                    [group]: [...(d.hotels[group] ?? []), { name: "Hotel" }],
                  },
                }))
              }
            >
              Add hotel
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function EditorYachtList({
  draft,
  setDraft,
}: {
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
}) {
  const list = draft.yachtCompanies ?? [];

  const update = (i: number, patch: Partial<YachtCompany>) => {
    setDraft((d) => {
      const arr = [...(d.yachtCompanies ?? [])];
      arr[i] = { ...arr[i]!, ...patch };
      return { ...d, yachtCompanies: arr };
    });
  };

  const remove = (i: number) => {
    setDraft((d) => ({
      ...d,
      yachtCompanies: (d.yachtCompanies ?? []).filter((_, j) => j !== i),
    }));
  };

  const add = () => {
    const row: YachtCompany = {
      name: "Charter company",
      contact: "",
      url: "https://example.com",
      destinations: "",
    };
    setDraft((d) => ({ ...d, yachtCompanies: [...(d.yachtCompanies ?? []), row] }));
  };

  return (
    <div className="space-y-4">
      {list.map((y, i) => (
        <Card key={y.productId ?? `${y.name}-${i}`} className="gap-3 py-4">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Yacht {i + 1}</CardTitle>
            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(i)}>
              <Trash2 className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <CatalogProductPicker
                value={y.productId ?? ""}
                allowedTypes={["cruise", "transport", "experience"]}
                label="Catalog product (cruise / transport / experience)"
                onSelect={(product) =>
                  setDraft((d) => {
                    const arr = [...(d.yachtCompanies ?? [])];
                    arr[i] = mergeDirectoryProductIntoYacht(arr[i]!, product);
                    return { ...d, yachtCompanies: arr };
                  })
                }
              />
            </div>
            <Field label="Company name" className="sm:col-span-2">
              <Input value={y.name} onChange={(e) => update(i, { name: e.target.value })} />
            </Field>
            <Field label="URL" className="sm:col-span-2">
              <Input value={y.url} onChange={(e) => update(i, { url: e.target.value })} />
            </Field>
            <Field label="Contact (fallback line)" className="sm:col-span-2">
              <Input value={y.contact} onChange={(e) => update(i, { contact: e.target.value })} />
            </Field>
            <Field label="Contact name">
              <Input value={y.contactName ?? ""} onChange={(e) => update(i, { contactName: e.target.value || undefined })} />
            </Field>
            <Field label="Email">
              <Input value={y.email ?? ""} onChange={(e) => update(i, { email: e.target.value || undefined })} />
            </Field>
            <Field label="Phone" className="sm:col-span-2">
              <Input value={y.phone ?? ""} onChange={(e) => update(i, { phone: e.target.value || undefined })} />
            </Field>
            <Field label="Destinations served" className="sm:col-span-2">
              <Input value={y.destinations} onChange={(e) => update(i, { destinations: e.target.value })} />
            </Field>
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1">
        <Plus className="size-4" />
        Add yacht charter
      </Button>
    </div>
  );
}

export function EditorTourismList({
  draft,
  setDraft,
}: {
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
}) {
  const update = (i: number, patch: Partial<TourismRegion>) => {
    setDraft((d) => {
      const next = [...d.tourismRegions];
      next[i] = { ...next[i]!, ...patch };
      return { ...d, tourismRegions: next };
    });
  };

  const updateLink = (ri: number, li: number, patch: Partial<{ label: string; url: string }>) => {
    setDraft((d) => {
      const regions = [...d.tourismRegions];
      const links = [...(regions[ri]?.links ?? [])];
      links[li] = { ...links[li]!, ...patch };
      regions[ri] = { ...regions[ri]!, links };
      return { ...d, tourismRegions: regions };
    });
  };

  const addRegion = () => {
    setDraft((d) => ({
      ...d,
      tourismRegions: [...d.tourismRegions, { name: "New region", links: [{ label: "Link", url: "https://example.com" }] }],
    }));
  };

  return (
    <div className="space-y-4">
      {draft.tourismRegions.map((region, ri) => (
        <Card key={`${region.name}-${ri}`} className="gap-3 py-4">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Region {ri + 1}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  tourismRegions: d.tourismRegions.filter((_, j) => j !== ri),
                }))
              }
            >
              Remove
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Name">
              <Input value={region.name} onChange={(e) => update(ri, { name: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea
                className={inputAreaClass}
                rows={2}
                value={region.description ?? ""}
                onChange={(e) => update(ri, { description: e.target.value || undefined })}
              />
            </Field>
            <Field label="Tourism contact">
              <Input
                value={region.contact ?? ""}
                onChange={(e) => update(ri, { contact: e.target.value || undefined })}
              />
            </Field>
            <div className="space-y-2">
              <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">Official links</p>
              {region.links.map((link, li) => (
                <div key={`${ri}-${li}`} className="flex flex-wrap gap-2">
                  <Input
                    className="min-w-[120px] flex-1"
                    value={link.label}
                    onChange={(e) => updateLink(ri, li, { label: e.target.value })}
                  />
                  <Input
                    className="min-w-[180px] flex-[2]"
                    value={link.url}
                    onChange={(e) => updateLink(ri, li, { url: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() =>
                      setDraft((d) => {
                        const regions = [...d.tourismRegions];
                        const links = regions[ri]!.links.filter((_, j) => j !== li);
                        regions[ri] = { ...regions[ri]!, links };
                        return { ...d, tourismRegions: regions };
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setDraft((d) => {
                    const regions = [...d.tourismRegions];
                    regions[ri] = {
                      ...regions[ri]!,
                      links: [...regions[ri]!.links, { label: "New link", url: "https://" }],
                    };
                    return { ...d, tourismRegions: regions };
                  })
                }
              >
                Add link
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRegion} className="gap-1">
        <Plus className="size-4" />
        Add tourism region
      </Button>
    </div>
  );
}

export function EditorDocuments({
  draft,
  setDraft,
}: {
  draft: Destination;
  setDraft: Dispatch<SetStateAction<Destination>>;
}) {
  const update = (i: number, patch: Partial<DestinationDocument>) => {
    setDraft((d) => {
      const next = [...d.documents];
      next[i] = { ...next[i]!, ...patch };
      return { ...d, documents: next };
    });
  };

  const remove = (i: number) => {
    setDraft((d) => ({ ...d, documents: d.documents.filter((_, j) => j !== i) }));
  };

  const add = () => {
    setDraft((d) => ({
      ...d,
      documents: [...d.documents, { name: "New document", type: "pdf" }],
    }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Prototype: cards deep-link to Knowledge Vault search. Production binds to vault document IDs.
      </p>
      {draft.documents.map((doc, i) => (
        <div key={`${doc.name}-${i}`} className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card/40 p-3">
          <div className="min-w-[200px] flex-1 space-y-1.5">
            <Label>Title</Label>
            <Input value={doc.name} onChange={(e) => update(i, { name: e.target.value })} />
          </div>
          <div className="w-32 space-y-1.5">
            <Label>Type</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-inset px-2 text-sm text-foreground outline-none"
              value={doc.type}
              onChange={(e) => update(i, { type: e.target.value as DestinationDocument["type"] })}
            >
              <option value="pdf">pdf</option>
              <option value="docx">docx</option>
              <option value="xlsx">xlsx</option>
            </select>
          </div>
          <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(i)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1">
        <Plus className="size-4" />
        Add document
      </Button>
    </div>
  );
}
