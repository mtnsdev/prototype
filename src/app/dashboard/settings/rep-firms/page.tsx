"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowLeft, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSearchField } from "@/components/ui/page-search-field";
import { MOCK_TEAMS } from "@/lib/teamsMock";
import { MOCK_REP_FIRMS } from "@/components/products/productDirectoryRepFirmMock";
import {
  cloneRepFirmsForState,
  loadRepFirmsFromStorage,
  persistRepFirmsSnapshot,
  repFirmsEqual,
  subscribeRepFirmsRegistry,
} from "@/components/products/productDirectoryPersistence";
import type { RepFirm } from "@/types/rep-firm";

const PRODUCT_TYPE_OPTIONS = [
  "hotel",
  "villa",
  "restaurant",
  "dmc",
  "experience",
  "cruise",
  "wellness",
  "transport",
] as const;

const inputClass =
  "w-full rounded-lg border border-white/[0.08] bg-[#0a0a0f] px-2 py-1.5 text-[11px] text-[#F5F0EB] outline-none";

type RepFirmFormState = {
  name: string;
  tagline: string;
  website: string;
  logoUrl: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  regionsText: string;
  productTypes: string[];
  propertyCount: string;
  scope: string;
  status: "active" | "inactive";
};

function emptyForm(): RepFirmFormState {
  return {
    name: "",
    tagline: "",
    website: "",
    logoUrl: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    regionsText: "",
    productTypes: [],
    propertyCount: "",
    scope: "enable",
    status: "active",
  };
}

function formFromFirm(firm: RepFirm): RepFirmFormState {
  return {
    name: firm.name,
    tagline: firm.tagline ?? "",
    website: firm.website ?? "",
    logoUrl: firm.logoUrl ?? "",
    contactName: firm.contactName ?? "",
    contactEmail: firm.contactEmail ?? "",
    contactPhone: firm.contactPhone ?? "",
    regionsText: firm.regions.join(", "),
    productTypes: [...firm.productTypes],
    propertyCount: firm.propertyCount != null ? String(firm.propertyCount) : "",
    scope: firm.scope,
    status: firm.status,
  };
}

function formToFirm(form: RepFirmFormState, existing?: RepFirm): RepFirm {
  const now = new Date().toISOString();
  const nameSlug = form.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const parsedPropertyCount = Number(form.propertyCount);
  const regions = form.regionsText
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  return {
    id: existing?.id ?? `rf-${nameSlug || Date.now()}`,
    name: form.name.trim(),
    tagline: form.tagline.trim() || undefined,
    website: form.website.trim() || undefined,
    logoUrl: form.logoUrl.trim() || undefined,
    contactName: form.contactName.trim() || undefined,
    contactEmail: form.contactEmail.trim() || undefined,
    contactPhone: form.contactPhone.trim() || undefined,
    regions,
    productTypes: form.productTypes,
    propertyCount:
      form.propertyCount.trim() && !Number.isNaN(parsedPropertyCount) ? parsedPropertyCount : undefined,
    scope: form.scope,
    status: form.status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export default function RepFirmsSettingsPage() {
  const [repFirms, setRepFirms] = useState<RepFirm[]>(() => {
    const loaded = loadRepFirmsFromStorage();
    if (loaded && loaded.length > 0) return cloneRepFirmsForState(loaded);
    return cloneRepFirmsForState(MOCK_REP_FIRMS);
  });
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<RepFirmFormState>(() => emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RepFirmFormState>(() => emptyForm());

  const scopeOptions = useMemo(
    () => [{ id: "enable", name: "Enable" }, ...MOCK_TEAMS.map((t) => ({ id: t.id, name: t.name }))],
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return repFirms;
    return repFirms.filter((firm) =>
      [firm.name, firm.tagline ?? "", firm.regions.join(" "), firm.productTypes.join(" "), firm.contactEmail ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [repFirms, search]);

  useEffect(() => {
    const t = setTimeout(() => persistRepFirmsSnapshot(repFirms), 400);
    return () => clearTimeout(t);
  }, [repFirms]);

  useEffect(() => {
    return subscribeRepFirmsRegistry(() => {
      setRepFirms((prev) => {
        const next = loadRepFirmsFromStorage();
        if (!next || next.length === 0) return prev;
        const cloned = cloneRepFirmsForState(next);
        return repFirmsEqual(prev, cloned) ? prev : cloned;
      });
    });
  }, []);

  const updateProductTypes = (
    setForm: Dispatch<SetStateAction<RepFirmFormState>>,
    value: string,
    checked: boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      productTypes: checked
        ? [...prev.productTypes, value]
        : prev.productTypes.filter((type) => type !== value),
    }));
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-[#F5F0EB]">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Link
          href="/dashboard/settings"
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-[#9B9590] transition-colors hover:text-[#F5F0EB]"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          Settings
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[rgba(176,122,91,0.2)] bg-[rgba(176,122,91,0.08)]">
            <Users className="h-5 w-5 text-[#B07A5B]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F5F0EB]">Rep Firm Registry</h1>
            <p className="mt-0.5 text-sm text-[#9B9590]">
              Manage representation firms and their property coverage.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="toolbarAccent"
            size="sm"
            onClick={() => {
              setAddForm(emptyForm());
              setShowAddForm((prev) => !prev);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add rep firm
          </Button>
          <PageSearchField
            value={search}
            onChange={setSearch}
            placeholder="Search firms, regions, or types…"
            aria-label="Search rep firms"
            className="ml-auto max-w-xs"
          />
        </div>

        {showAddForm ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#161616] p-4">
            <RepFirmForm
              form={addForm}
              setForm={setAddForm}
              scopeOptions={scopeOptions}
              onCancel={() => setShowAddForm(false)}
              onSave={() => {
                if (!addForm.name.trim()) return;
                const next = formToFirm(addForm);
                setRepFirms((prev) => [next, ...prev]);
                setShowAddForm(false);
                setAddForm(emptyForm());
              }}
              updateProductTypes={updateProductTypes}
              saveLabel="Add rep firm"
            />
          </div>
        ) : null}

        <div className="space-y-3">
          {filtered.map((firm) => {
            const isEditing = editingId === firm.id;
            return (
              <div key={firm.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161616]">
                {isEditing ? (
                  <div className="p-4">
                    <RepFirmForm
                      form={editForm}
                      setForm={setEditForm}
                      scopeOptions={scopeOptions}
                      onCancel={() => setEditingId(null)}
                      onSave={() => {
                        if (!editForm.name.trim()) return;
                        const next = formToFirm(editForm, firm);
                        setRepFirms((prev) => prev.map((x) => (x.id === firm.id ? next : x)));
                        setEditingId(null);
                      }}
                      updateProductTypes={updateProductTypes}
                      saveLabel="Save changes"
                    />
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 gap-3">
                        {firm.logoUrl ? (
                          <img
                            src={firm.logoUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.02] object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
                            <Users className="h-4 w-4 text-[#B07A5B]/50" aria-hidden />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-[#F5F0EB]">{firm.name}</span>
                            <span
                              className={[
                                "rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide",
                                firm.status === "active"
                                  ? "bg-[rgba(91,138,110,0.12)] text-[#5B8A6E]"
                                  : "bg-white/[0.05] text-[#6B6560]",
                              ].join(" ")}
                            >
                              {firm.status}
                            </span>
                          </div>
                          {firm.tagline ? <p className="mt-1 text-xs text-[#9B9590]">{firm.tagline}</p> : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          className="text-2xs text-[#B07A5B]/80 hover:text-[#B07A5B]"
                          onClick={() => {
                            setEditingId(firm.id);
                            setEditForm(formFromFirm(firm));
                          }}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Pencil className="h-3 w-3" />
                            Edit
                          </span>
                        </button>
                        <button
                          type="button"
                          className="text-2xs text-[#A66B6B]/80 hover:text-[#A66B6B]"
                          onClick={() => setRepFirms((prev) => prev.filter((x) => x.id !== firm.id))}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Trash2 className="h-3 w-3" />
                            Remove
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1 text-2xs text-[#9B9590]">
                      <p>Regions: {firm.regions.join(", ") || "—"}</p>
                      <p>
                        Types: {firm.productTypes.join(", ") || "—"}
                        {firm.propertyCount != null ? ` · ${firm.propertyCount} properties` : ""}
                      </p>
                      <p>Contact: {firm.contactEmail ?? "—"}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RepFirmForm({
  form,
  setForm,
  scopeOptions,
  onCancel,
  onSave,
  updateProductTypes,
  saveLabel,
}: {
  form: RepFirmFormState;
  setForm: Dispatch<SetStateAction<RepFirmFormState>>;
  scopeOptions: { id: string; name: string }[];
  onCancel: () => void;
  onSave: () => void;
  updateProductTypes: (
    setForm: Dispatch<SetStateAction<RepFirmFormState>>,
    value: string,
    checked: boolean
  ) => void;
  saveLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Name *</span>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Tagline</span>
          <input
            value={form.tagline}
            onChange={(e) => setForm((prev) => ({ ...prev, tagline: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Website</span>
          <input
            value={form.website}
            onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Logo image URL</span>
          <input
            value={form.logoUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
            placeholder="https://…"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Contact Name</span>
          <input
            value={form.contactName}
            onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Contact Email</span>
          <input
            value={form.contactEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Contact Phone</span>
          <input
            value={form.contactPhone}
            onChange={(e) => setForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Property Count</span>
          <input
            type="number"
            min={0}
            value={form.propertyCount}
            onChange={(e) => setForm((prev) => ({ ...prev, propertyCount: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Regions (comma-separated)</span>
          <input
            value={form.regionsText}
            onChange={(e) => setForm((prev) => ({ ...prev, regionsText: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Scope</span>
          <select
            value={form.scope}
            onChange={(e) => setForm((prev) => ({ ...prev, scope: e.target.value }))}
            className={inputClass}
          >
            {scopeOptions.map((scope) => (
              <option key={scope.id} value={scope.id}>
                {scope.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[9px] text-[#6B6560]">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "active" | "inactive" }))}
            className={inputClass}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-2">
        <p className="mb-1 text-[9px] text-[#6B6560]">Product Types</p>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_TYPE_OPTIONS.map((type) => (
            <label key={type} className="inline-flex items-center gap-1 text-[10px] text-[#9B9590]">
              <input
                type="checkbox"
                checked={form.productTypes.includes(type)}
                onChange={(e) => updateProductTypes(setForm, type, e.target.checked)}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={onSave} disabled={!form.name.trim()} className="h-8 rounded-lg text-xs">
          {saveLabel}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-8 rounded-lg text-xs">
          Cancel
        </Button>
      </div>
    </div>
  );
}
