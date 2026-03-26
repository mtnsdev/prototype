"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Check, Plus, Search, X } from "lucide-react";
import type {
  DirectoryCollectionOption,
  DirectoryProduct,
  NewDirectoryCollectionInput,
} from "@/types/product-directory";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import type { Team } from "@/types/teams";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";

type Props = {
  product: DirectoryProduct;
  collections: DirectoryCollectionOption[];
  teams: Team[];
  initialSelectedIds: string[];
  onClose: () => void;
  onSave: (selectedCollectionIds: string[]) => void;
  /** Returns new collection id, or empty string on validation failure. */
  onCreateCollection: (input: NewDirectoryCollectionInput) => string;
};

export default function ProductDirectoryCollectionPicker({
  product,
  collections,
  teams,
  initialSelectedIds,
  onClose,
  onSave,
  onCreateCollection,
}: Props) {
  const { user } = useUser();
  const uid = user ? String(user.id) : "1";

  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelectedIds);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newScope, setNewScope] = useState<"private" | "team">("private");
  const [newTeamId, setNewTeamId] = useState("");

  const teamOptions = useMemo(
    () => teams.filter((t) => t.isDefault || t.memberIds.includes(uid)),
    [teams, uid]
  );

  useEffect(() => {
    if (!createOpen) return;
    if (teamOptions.length > 0 && !newTeamId) {
      setNewTeamId(teamOptions[0].id);
    }
  }, [createOpen, teamOptions, newTeamId]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.teamName ?? "").toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
    );
  }, [collections, searchTerm]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const openCreate = () => {
    setCreateOpen(true);
    setNewName("");
    setNewDesc("");
    setNewScope("private");
    setNewTeamId(teamOptions[0]?.id ?? "");
  };

  const submitCreate = () => {
    const name = newName.trim();
    if (!name) return;
    if (newScope === "team" && !newTeamId) return;

    const input: NewDirectoryCollectionInput = {
      name,
      description: newDesc.trim() || undefined,
      scope: newScope,
      teamId: newScope === "team" ? newTeamId : null,
    };
    const id = onCreateCollection(input);
    if (id) {
      setSelected((s) => (s.includes(id) ? s : [...s, id]));
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-picker-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[rgba(255,255,255,0.08)] bg-[#0e0e14] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[rgba(255,255,255,0.06)] px-5 pb-4 pt-5">
          <div className="flex gap-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-[#08080c]">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Bookmark className="h-6 w-6 text-[#2a2824]" aria-hidden />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#6B6560]">Add to collections</p>
              <h2 id="collection-picker-title" className="mt-0.5 text-[15px] font-semibold leading-snug text-[#F5F5F5]">
                {product.name}
              </h2>
              <p className="mt-1 text-[11px] leading-snug text-[rgba(245,245,245,0.45)]">
                Choose lists, create a new one, then save.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B6560] transition-colors hover:bg-white/[0.06] hover:text-[#F5F5F5]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A4540]" />
            <input
              type="search"
              placeholder="Search by name or team…"
              className="w-full rounded-xl border border-white/[0.08] bg-[#08080c] py-2.5 pl-10 pr-3 text-[13px] text-[#F5F5F5] placeholder:text-[#4A4540] outline-none transition-colors focus:border-[rgba(201,169,110,0.35)] focus:ring-1 focus:ring-[rgba(201,169,110,0.2)]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {!createOpen ? (
            <button
              type="button"
              onClick={openCreate}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(201,169,110,0.3)] bg-[rgba(201,169,110,0.04)] py-2.5 text-[12px] font-medium text-[#C9A96E] transition-colors hover:bg-[rgba(201,169,110,0.08)]"
            >
              <Plus className="h-4 w-4" />
              New collection
            </button>
          ) : (
            <div className="space-y-3 rounded-xl border border-[rgba(201,169,110,0.22)] bg-[rgba(201,169,110,0.06)] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-[#F5F5F5]">New collection</span>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg p-1 text-[#6B6560] transition-colors hover:bg-white/[0.06] hover:text-[#F5F5F5]"
                  aria-label="Close create form"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <label className="block">
                <span className="mb-1 block text-[10px] text-[#6B6560]">Name</span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Honeymoon shortlist"
                  className="w-full rounded-lg border border-white/[0.08] bg-[#08080c] px-3 py-2 text-[13px] text-[#F5F5F5] outline-none placeholder:text-[#4A4540] focus:border-[rgba(201,169,110,0.35)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] text-[#6B6560]">Description (optional)</span>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="Short note for your team or future you"
                  className="w-full resize-none rounded-lg border border-white/[0.08] bg-[#08080c] px-3 py-2 text-[12px] text-[#F5F5F5] outline-none placeholder:text-[#4A4540] focus:border-[rgba(201,169,110,0.35)]"
                />
              </label>
              <div>
                <span className="mb-1.5 block text-[10px] text-[#6B6560]">Who can see it</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNewScope("private")}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors",
                      newScope === "private"
                        ? "border-[#C9A96E] bg-[rgba(201,169,110,0.12)] text-[#F5F5F5]"
                        : "border-white/[0.08] text-[#9B9590] hover:border-white/[0.12]"
                    )}
                  >
                    Private
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScope("team")}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors",
                      newScope === "team"
                        ? "border-[#C9A96E] bg-[rgba(201,169,110,0.12)] text-[#F5F5F5]"
                        : "border-white/[0.08] text-[#9B9590] hover:border-white/[0.12]"
                    )}
                  >
                    Team
                  </button>
                </div>
              </div>
              {newScope === "team" ? (
                <label className="block">
                  <span className="mb-1 block text-[10px] text-[#6B6560]">Team</span>
                  <select
                    value={newTeamId}
                    onChange={(e) => setNewTeamId(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-[#08080c] px-3 py-2 text-[12px] text-[#F5F5F5] outline-none focus:border-[rgba(201,169,110,0.35)]"
                  >
                    {teamOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <p className="text-[10px] leading-snug text-[#6B6560]">
                The list is pre-filled with this product; save at the bottom when you’re done.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] py-2 text-[12px] font-medium text-[#F5F5F5] transition-colors hover:bg-white/[0.07]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newName.trim() || (newScope === "team" && !newTeamId)}
                  onClick={submitCreate}
                  className="flex-1 rounded-lg bg-[#C9A96E] py-2 text-[12px] font-semibold text-[#0a0a0f] transition-colors hover:bg-[#D4B383] disabled:opacity-40"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-[#9B9590]">
                {collections.length === 0 && !searchTerm.trim()
                  ? "No collections yet"
                  : "No collections match"}
              </p>
              <p className="mt-1 text-[11px] text-[#6B6560]">
                {collections.length === 0 && !searchTerm.trim()
                  ? "Create a collection above to get started."
                  : "Try another search or create a new list."}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((collection) => {
                const scopeForBadge =
                  collection.scope === "private" ? "private" : collection.teamId ?? collection.scope;
                const isOn = selected.includes(collection.id);
                const count = collection.productIds?.length ?? 0;

                return (
                  <li key={collection.id}>
                    <button
                      type="button"
                      onClick={() => toggle(collection.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                        isOn
                          ? "border-[rgba(201,169,110,0.35)] bg-[rgba(201,169,110,0.08)]"
                          : "border-white/[0.06] bg-[#08080c] hover:border-white/[0.1] hover:bg-white/[0.03]"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          isOn
                            ? "border-[#C9A96E] bg-[#C9A96E] text-[#0a0a0f]"
                            : "border-white/[0.12] bg-transparent"
                        )}
                        aria-hidden
                      >
                        {isOn ? <Check className="h-3 w-3 stroke-[2.5]" /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#F5F5F5]">{collection.name}</p>
                        {collection.description ? (
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#6B6560]">
                            {collection.description}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <ScopeBadge scope={scopeForBadge} teams={teams} />
                          <span className="text-[10px] text-[#4A4540]">
                            {count} product{count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 space-y-3 border-t border-[rgba(255,255,255,0.06)] bg-[#0a0a0f]/90 px-5 py-4 backdrop-blur-md">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#6B6560]">
              <span className="text-[#9B9590]">{selected.length}</span> collection
              {selected.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[12px] font-medium text-[#F5F5F5] transition-colors hover:bg-white/[0.07] sm:flex-initial sm:min-w-[96px]"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-[#C9A96E] px-4 py-2.5 text-[12px] font-semibold text-[#0a0a0f] transition-colors hover:bg-[#D4B383] sm:flex-initial sm:min-w-[120px]"
                onClick={() => onSave(selected)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
