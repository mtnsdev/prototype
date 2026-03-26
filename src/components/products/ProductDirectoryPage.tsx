"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, LayoutGrid, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductDirectoryMainTab = "browse" | "collections" | "partner-portal";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";
import { MOCK_TEAMS, resolveUserPolicies } from "@/lib/teamsMock";
import type {
  DirectoryAmenityTag,
  DirectoryCollectionOption,
  DirectoryProduct,
  DirectoryProductCategory,
  NewDirectoryCollectionInput,
} from "@/types/product-directory";
import {
  buildDirectoryCollectionRefs,
  MOCK_DIRECTORY_COLLECTIONS,
  MOCK_DIRECTORY_PRODUCTS,
} from "./productDirectoryMock";
import ProductDirectoryFilterBar from "./ProductDirectoryFilterBar";
import DirectoryProductCard from "./DirectoryProductCard";
import DirectoryProductListView from "./DirectoryProductListView";
import ProductDirectoryDetailPanel from "./ProductDirectoryDetailPanel";
import ProductDirectoryCollectionPicker from "./ProductDirectoryCollectionPicker";
import ProductDirectoryMapSplit from "./ProductDirectoryMapSplit";
import {
  ProductDirectoryCollectionsTab,
  ProductDirectoryPartnerPortalTab,
  buildPartnerPortalRows,
} from "./ProductDirectoryTabsViews";
import type { Team } from "@/types/teams";
import type { DirectoryPriceTier, DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";
import {
  AGENCY_PROGRAM_OPTIONS,
  AMENITY_LABELS,
  compareProductsByRegistryCommission,
  DIRECTORY_TIER_FILTER_UI,
  type DirectoryProductSortOption,
} from "./productDirectoryFilterConfig";
import {
  applyDirectoryProductFilters,
  type DirectoryFilterSkip,
  type DirectoryPageFilterInput,
} from "./productDirectoryFilterPipeline";
import { DIRECTORY_TIER_SORT_RANK } from "./productDirectoryDetailMeta";
import {
  getTopBookableProgramByCommission,
  isProgramBookable,
  programDisplayCommissionRate,
  programDisplayName,
  programFilterId,
} from "./productDirectoryCommission";
import {
  applyPartnerPortalPayloadToProducts,
  createDirectoryCollectionRecord,
  type PartnerPortalAdminSavePayload,
  validatePartnerPortalAdminPayload,
} from "./productDirectoryLogic";
import { directoryCategoryColors, directoryCategoryLabel } from "./productDirectoryVisual";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { TEAM_EVERYONE_ID } from "@/types/teams";

function bookableProgramsForCompare(p: DirectoryProduct) {
  return p.partnerPrograms.filter(isProgramBookable);
}

function programsSignature(p: DirectoryProduct) {
  return bookableProgramsForCompare(p)
    .map((pp) => programDisplayName(pp))
    .sort()
    .join("|");
}

function commissionKey(p: DirectoryProduct, canViewCommissions: boolean) {
  if (!canViewCommissions) return "hidden";
  const top = getTopBookableProgramByCommission(p);
  const r = top ? programDisplayCommissionRate(top) : null;
  return r == null ? "none" : String(r);
}

function amenitySignature(p: DirectoryProduct) {
  const top = getTopBookableProgramByCommission(p);
  return (top?.amenityTags ?? [])
    .slice()
    .sort()
    .join("|");
}

function enrichmentSignature(p: DirectoryProduct) {
  return `${p.hasTeamData ? "1" : "0"}-${p.hasAdvisorNotes ? "1" : "0"}`;
}

function diffWrapClass(differs: boolean) {
  return differs ? "rounded-lg bg-[rgba(201,169,110,0.05)] ring-1 ring-[rgba(201,169,110,0.18)] p-2" : "";
}

function termsSignatureForProgram(program: (DirectoryProduct["partnerPrograms"][number] | undefined)): string {
  if (!program) return "::";
  return `${program.commissionRate ?? ""}::${(program.amenities ?? "").trim()}`;
}

function customProgramKeysForProduct(target: DirectoryProduct, allProducts: DirectoryProduct[]): string[] {
  const out: string[] = [];
  for (const pp of target.partnerPrograms) {
    const key = programFilterId(pp);
    const linked = allProducts
      .map((p) => p.partnerPrograms.find((x) => programFilterId(x) === key))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    const counts = new Map<string, number>();
    linked.forEach((x) => {
      const sig = termsSignatureForProgram(x);
      counts.set(sig, (counts.get(sig) ?? 0) + 1);
    });
    if (counts.size <= 1) continue;
    const baselineSig = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    if (termsSignatureForProgram(pp) !== baselineSig) out.push(key);
  }
  return out;
}

type CompareViewProps = {
  products: DirectoryProduct[];
  canViewCommissions: boolean;
  onClose: () => void;
  onViewFullDetails: (product: DirectoryProduct) => void;
};

function ProductDirectoryCompareView({ products, canViewCommissions, onClose, onViewFullDetails }: CompareViewProps) {
  const types = products.map((p) => p.type);
  const typeDiffers = new Set(types).size > 1;
  const commKeys = products.map((p) => commissionKey(p, canViewCommissions));
  const commDiffers = canViewCommissions && new Set(commKeys).size > 1;
  const progSigs = products.map(programsSignature);
  const progDiffers = new Set(progSigs).size > 1;
  const amenitySigs = products.map(amenitySignature);
  const amenityDiffers = new Set(amenitySigs).size > 1;
  const enrichSigs = products.map(enrichmentSignature);
  const enrichDiffers = new Set(enrichSigs).size > 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-[#F5F0EB]">Comparing {products.length} products</span>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-[#9B9590] transition-colors hover:text-[#F5F0EB]"
        >
          ✕ Close comparison
        </button>
      </div>

      <div
        className={cn(
          "grid gap-3",
          products.length === 2 && "grid-cols-1 sm:grid-cols-2",
          products.length === 3 && "grid-cols-1 md:grid-cols-3",
          products.length === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}
      >
        {products.map((product) => {
          const active = bookableProgramsForCompare(product);
          const topProgram = getTopBookableProgramByCommission(product);
          const topRate = topProgram ? programDisplayCommissionRate(topProgram) : null;
          const cat = directoryCategoryColors(product.type);

          return (
            <div
              key={product.id}
              className="overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.02]"
            >
              <img
                src={product.imageUrl}
                alt=""
                className="h-[120px] w-full object-cover"
              />
              <div className="space-y-3 p-3">
                <div>
                  <h3 className="text-[13px] font-medium text-[#F5F0EB]">{product.name}</h3>
                  <p className="text-[10px] text-[#9B9590]">
                    {product.city && product.country ? `${product.city}, ${product.country}` : product.location}
                  </p>
                </div>

                <div className={diffWrapClass(typeDiffers)}>
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-[#4A4540]">Type</p>
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px]"
                    style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
                  >
                    {directoryCategoryLabel(product.type)}
                  </span>
                </div>

                <div className={diffWrapClass(progDiffers)}>
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-[#4A4540]">Programs</p>
                  {active.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {active.map((pp) => (
                        <span
                          key={pp.id}
                          className="rounded-full border px-1.5 py-0.5 text-[9px]"
                          style={{
                            background: "rgba(201,169,110,0.06)",
                            borderColor: "rgba(201,169,110,0.12)",
                            color: "#B8976E",
                          }}
                        >
                          {programDisplayName(pp)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] italic text-[#4A4540]">None</span>
                  )}
                </div>

                <div className={diffWrapClass(amenityDiffers)}>
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-[#4A4540]">Client amenities</p>
                  {topProgram && (topProgram.amenityTags?.length ?? 0) > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {(topProgram.amenityTags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-1.5 py-0.5 text-[9px]"
                          style={{ background: "rgba(91,138,110,0.06)", color: "#5B8A6E" }}
                        >
                          {AMENITY_LABELS[tag]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] italic text-[#4A4540]">Direct booking</span>
                  )}
                </div>

                {canViewCommissions && (
                  <div className={diffWrapClass(!!commDiffers)}>
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-[#4A4540]">Commission</p>
                    {topRate != null ? (
                      <span className="text-[14px] font-medium text-[#B8976E]">{topRate}%</span>
                    ) : (
                      <span className="text-[10px] italic text-[#4A4540]">—</span>
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    "border-t border-white/[0.03] pt-2",
                    enrichDiffers &&
                      "rounded-lg bg-[rgba(201,169,110,0.05)] px-2 pb-2 ring-1 ring-[rgba(201,169,110,0.18)] -mx-1"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: product.hasTeamData ? "rgba(140,160,180,0.60)" : "rgba(255,255,255,0.06)",
                        }}
                      />
                      <span className="text-[9px] text-[#6B6560]">Team data</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: product.hasAdvisorNotes ? "rgba(160,140,180,0.60)" : "rgba(255,255,255,0.06)",
                        }}
                      />
                      <span className="text-[9px] text-[#6B6560]">My notes</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onViewFullDetails(product)}
                  className="w-full rounded-lg bg-white/[0.03] py-1.5 text-[10px] text-[#9B9590] transition-colors hover:bg-white/[0.06] hover:text-[#F5F0EB]"
                >
                  View full details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function filterCollectionsForUser(
  uid: string,
  collections: DirectoryCollectionOption[],
  teams: Team[]
): DirectoryCollectionOption[] {
  const memberTeamIds = teams.filter((t) => t.isDefault || t.memberIds.includes(uid)).map((t) => t.id);
  return collections.filter((c) => {
    if (c.scope === "private" && c.ownerId === uid) return true;
    if (c.scope === "team" && c.teamId && memberTeamIds.includes(c.teamId)) return true;
    return false;
  });
}

export default function ProductDirectoryPage() {
  const { user, directoryViewAsAdmin } = useUser();
  const toast = useToast();
  const uid = user ? String(user.id) : "1";

  const policies = useMemo(
    () => resolveUserPolicies(user ? { id: String(user.id), role: user.role } : null, MOCK_TEAMS),
    [user]
  );
  const canViewCommissions = policies.canViewCommissions;
  const isAdmin =
    directoryViewAsAdmin || user?.role === "admin" || user?.role === "agency_admin";

  const [products, setProducts] = useState<DirectoryProduct[]>(() =>
    MOCK_DIRECTORY_PRODUCTS.map((p) => ({ ...p, collectionIds: [...p.collectionIds], collections: [...p.collections] }))
  );

  const [directoryCollections, setDirectoryCollections] = useState<DirectoryCollectionOption[]>(() =>
    MOCK_DIRECTORY_COLLECTIONS.map((c) => ({
      ...c,
      productIds: c.productIds ? [...c.productIds] : undefined,
    }))
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const [activeTypeFilters, setActiveTypeFilters] = useState<DirectoryProductCategory[]>([]);
  const [locationCountries, setLocationCountries] = useState<string[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<string[]>([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<DirectoryAmenityTag[]>([]);
  const [commissionRange, setCommissionRange] = useState<[number, number]>([0, 25]);
  const [commissionFilterActive, setCommissionFilterActive] = useState(false);
  const [sortByCommission, setSortByCommission] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<DirectoryTierLevel[]>([]);
  const [selectedPriceTiers, setSelectedPriceTiers] = useState<DirectoryPriceTier[]>([]);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [showMyEnrichedOnly, setShowMyEnrichedOnly] = useState(false);
  const [enrichFilterTeam, setEnrichFilterTeam] = useState(true);
  const [enrichFilterPersonal, setEnrichFilterPersonal] = useState(true);
  const [sortBy, setSortBy] = useState<DirectoryProductSortOption>("name-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [collectionCopyEdits, setCollectionCopyEdits] = useState<
    Record<string, { name?: string; description?: string }>
  >({});
  const [editingCollectionHeader, setEditingCollectionHeader] = useState(false);

  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [pickerProductId, setPickerProductId] = useState<string | null>(null);
  const [mapCluster, setMapCluster] = useState<DirectoryProduct[] | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => new Set());
  const [bulkCollectionOpen, setBulkCollectionOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [mainTab, setMainTab] = useState<ProductDirectoryMainTab>("browse");
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [createCollectionFromBulk, setCreateCollectionFromBulk] = useState(false);
  const [createCollectionName, setCreateCollectionName] = useState("");
  const [createCollectionDescription, setCreateCollectionDescription] = useState("");
  const [createCollectionScope, setCreateCollectionScope] = useState<"private" | "team">("private");
  const [createCollectionTeamId, setCreateCollectionTeamId] = useState("");

  const portalRowCount = useMemo(() => buildPartnerPortalRows(products).length, [products]);

  useEffect(() => {
    if (viewMode !== "map") setMapCluster(null);
  }, [viewMode]);

  useEffect(() => {
    setEditingCollectionHeader(false);
  }, [collectionFilter.join(",")]);

  const clearSelection = useCallback(() => {
    setSelectedProductIds(new Set());
    setBulkMode(false);
    setBulkCollectionOpen(false);
    setCompareMode(false);
  }, []);

  const toggleProductSelection = useCallback((productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const handleBulkToggle = useCallback(() => {
    if (bulkMode) clearSelection();
    else setBulkMode(true);
  }, [bulkMode, clearSelection]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (bulkMode || compareMode)) clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bulkMode, compareMode, clearSelection]);

  const toggleTypeFilter = useCallback((id: DirectoryProductCategory) => {
    setActiveTypeFilters((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const clearTypeFilters = useCallback(() => setActiveTypeFilters([]), []);

  const availableCollections = useMemo(
    () => filterCollectionsForUser(uid, directoryCollections, MOCK_TEAMS),
    [uid, directoryCollections]
  );
  const myCollectionTeams = useMemo(
    () => MOCK_TEAMS.filter((t) => t.isDefault || t.memberIds.includes(uid)),
    [uid]
  );

  const activeCollectionMeta = useMemo(() => {
    if (collectionFilter.length !== 1) return null;
    return availableCollections.find((c) => c.id === collectionFilter[0]) ?? null;
  }, [collectionFilter, availableCollections]);

  const activeCollectionProductCount = useMemo(() => {
    if (!activeCollectionMeta) return 0;
    return products.filter((p) => p.collectionIds.includes(activeCollectionMeta.id)).length;
  }, [activeCollectionMeta, products]);

  /** Owner or admin: rename collection, remove products, sharing. Members can still add products. */
  const isCollectionOwner = activeCollectionMeta != null && activeCollectionMeta.ownerId === uid;
  const canEditActiveCollection = isAdmin || isCollectionOwner;
  const canShareActiveCollection = canEditActiveCollection;

  const filterInput: DirectoryPageFilterInput = useMemo(
    () => ({
      q: debouncedSearch,
      activeTypeFilters,
      locationCountries,
      collectionFilter,
      selectedProgramIds,
      selectedAmenities,
      commissionFilterActive,
      commissionRange,
      selectedTiers,
      selectedPriceTiers,
      showExpiringOnly,
      showMyEnrichedOnly,
      enrichFilterTeam,
      enrichFilterPersonal,
    }),
    [
      debouncedSearch,
      activeTypeFilters,
      locationCountries,
      collectionFilter,
      selectedProgramIds,
      selectedAmenities,
      commissionFilterActive,
      commissionRange,
      selectedTiers,
      selectedPriceTiers,
      showExpiringOnly,
      showMyEnrichedOnly,
      enrichFilterTeam,
      enrichFilterPersonal,
    ]
  );

  const filteredProducts = useMemo(
    () => applyDirectoryProductFilters(products, filterInput, canViewCommissions),
    [products, filterInput, canViewCommissions]
  );

  const emptyStateHint = useMemo(() => {
    if (filteredProducts.length > 0) return null;
    type Hint = { label: string; count: number; onClear: () => void };
    const hints: Hint[] = [];
    const f = filterInput;

    const push = (skip: DirectoryFilterSkip, label: string, onClear: () => void) => {
      const n = applyDirectoryProductFilters(products, f, canViewCommissions, skip).length;
      if (n > 0) hints.push({ label, count: n, onClear });
    };

    if (f.q.trim()) push("search", "search", () => setSearchQuery(""));
    if (f.locationCountries.length > 0) push("location", "location", () => setLocationCountries([]));
    if (f.collectionFilter.length > 0) push("collection", "collection", () => setCollectionFilter([]));
    if (f.selectedProgramIds.length > 0) push("program", "program", () => setSelectedProgramIds([]));
    if (f.selectedAmenities.length > 0) {
      push(
        "amenities",
        f.selectedAmenities.map((t) => AMENITY_LABELS[t]).join(", "),
        () => setSelectedAmenities([])
      );
    }
    if (canViewCommissions && f.commissionFilterActive) {
      push("commissionRange", "commission range", () => {
        setCommissionFilterActive(false);
        setCommissionRange([0, 25]);
      });
    }
    if (f.activeTypeFilters.length > 0) push("type", "type", () => setActiveTypeFilters([]));
    if (f.selectedTiers.length > 0) push("tier", "tier", () => setSelectedTiers([]));
    if (f.selectedPriceTiers.length > 0) push("price", "price", () => setSelectedPriceTiers([]));
    if (f.showExpiringOnly) push("expiring", "Expiring soon", () => setShowExpiringOnly(false));
    if (f.showMyEnrichedOnly) push("enriched", "My enriched", () => setShowMyEnrichedOnly(false));

    hints.sort((a, b) => b.count - a.count);
    return hints[0] ?? null;
  }, [filteredProducts.length, products, filterInput, canViewCommissions]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setActiveTypeFilters([]);
    setLocationCountries([]);
    setCollectionFilter([]);
    setSelectedProgramIds([]);
    setSelectedAmenities([]);
    setCommissionFilterActive(false);
    setCommissionRange([0, 25]);
    setSelectedTiers([]);
    setSelectedPriceTiers([]);
    setShowExpiringOnly(false);
    setShowMyEnrichedOnly(false);
    setEnrichFilterTeam(true);
    setEnrichFilterPersonal(true);
    setSortByCommission(false);
  }, []);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    const addedOrUpdatedTs = (p: (typeof list)[0]) => {
      const iso = p.addedAt ?? p.updatedAt;
      if (!iso) return 0;
      const t = new Date(iso).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    if (sortByCommission && canViewCommissions) {
      list.sort(compareProductsByRegistryCommission);
      return list;
    }

    switch (sortBy) {
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        return list;
      case "commission-desc":
        if (!canViewCommissions) {
          list.sort((a, b) => a.name.localeCompare(b.name));
          return list;
        }
        list.sort(compareProductsByRegistryCommission);
        return list;
      case "tier-desc":
        list.sort(
          (a, b) =>
            DIRECTORY_TIER_SORT_RANK[a.tier ?? "unrated"] - DIRECTORY_TIER_SORT_RANK[b.tier ?? "unrated"]
        );
        return list;
      case "recently-added":
        list.sort((a, b) => addedOrUpdatedTs(b) - addedOrUpdatedTs(a));
        return list;
      case "enrichment-desc":
        list.sort((a, b) => (b.enrichmentScore ?? 0) - (a.enrichmentScore ?? 0));
        return list;
      default:
        return list;
    }
  }, [filteredProducts, sortBy, sortByCommission, canViewCommissions]);

  const compareProducts = useMemo(() => {
    if (!compareMode) return [];
    const list: DirectoryProduct[] = [];
    for (const id of selectedProductIds) {
      const p = products.find((x) => x.id === id);
      if (p) list.push(p);
    }
    return list;
  }, [compareMode, selectedProductIds, products]);

  useEffect(() => {
    if (!compareMode) return;
    if (compareProducts.length < 2 || compareProducts.length > 4) setCompareMode(false);
  }, [compareMode, compareProducts.length]);

  const detailProduct = detailProductId ? (products.find((p) => p.id === detailProductId) ?? null) : null;
  const detailProductCustomProgramKeys = useMemo(
    () => (detailProduct ? customProgramKeysForProduct(detailProduct, products) : []),
    [detailProduct, products]
  );
  const pickerProduct = pickerProductId ? (products.find((p) => p.id === pickerProductId) ?? null) : null;

  const patchProduct = useCallback((productId: string, patch: Partial<DirectoryProduct>) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...patch } : p)));
  }, []);

  const isBookmarked = useCallback((p: DirectoryProduct) => p.collectionIds.length > 0, []);

  const canRemoveFromCollection = useCallback(
    (collectionId: string) => {
      if (isAdmin) return true;
      const c = directoryCollections.find((x) => x.id === collectionId);
      return c?.ownerId === uid;
    },
    [isAdmin, uid, directoryCollections]
  );

  const savePicker = useCallback(
    (productId: string, selectedIds: string[]) => {
      setDirectoryCollections((prev) => {
        const next = prev.map((c) => {
          const inSet = selectedIds.includes(c.id);
          const base = [...(c.productIds ?? [])];
          const has = base.includes(productId);
          if (inSet && !has) return { ...c, productIds: [...base, productId] };
          if (!inSet && has) return { ...c, productIds: base.filter((x) => x !== productId) };
          return c;
        });
        const refs = buildDirectoryCollectionRefs(selectedIds, next);
        patchProduct(productId, {
          collectionIds: selectedIds,
          collections: refs,
          collectionCount: selectedIds.length,
        });
        return next;
      });
      setPickerProductId(null);
      toast("Collections updated");
    },
    [patchProduct, toast]
  );

  const createDirectoryCollection = useCallback(
    (input: NewDirectoryCollectionInput): string => {
      const trimmed = input.name.trim();
      if (!trimmed) return "";
      if (input.scope === "team" && !input.teamId) return "";

      const id = `col_${Date.now()}`;
      const ownerName = user?.username ?? user?.email?.split("@")[0] ?? "You";
      const pid = pickerProductId ? products.find((p) => p.id === pickerProductId)?.id : null;
      const seedProductIds = pid ? [pid] : [];

      const newCol = createDirectoryCollectionRecord({
        id,
        input: { ...input, name: trimmed },
        ownerId: uid,
        ownerName,
        teamName: input.teamId ? MOCK_TEAMS.find((t) => t.id === input.teamId)?.name : undefined,
        seedProductIds,
      });

      setDirectoryCollections((prev) => [...prev, newCol]);
      toast(`Created “${newCol.name}”`);
      return id;
    },
    [uid, user, pickerProductId, products, toast]
  );

  const saveProgramFromPartnerPortal = useCallback(
    (programKey: string, payload: PartnerPortalAdminSavePayload): boolean => {
      const validationError = validatePartnerPortalAdminPayload(payload);
      if (validationError) {
        toast(validationError);
        return false;
      }
      const editorName = user?.username ?? user?.email?.split("@")[0] ?? "Admin";
      let updatedCount = 0;
      setProducts((prev) => {
        const result = applyPartnerPortalPayloadToProducts({
          products: prev,
          programKey,
          payload,
          audit: {
            userId: uid,
            userName: editorName,
            editedAtISO: new Date().toISOString(),
          },
        });
        updatedCount = result.updatedCount;
        return result.products;
      });
      toast(`Updated program across ${updatedCount} product${updatedCount !== 1 ? "s" : ""}`);
      return true;
    },
    [toast, uid, user]
  );

  const openCreateCollectionModal = useCallback(
    (mode: "general" | "bulk") => {
      setCreateCollectionFromBulk(mode === "bulk");
      setCreateCollectionName("");
      setCreateCollectionDescription("");
      setCreateCollectionScope("private");
      setCreateCollectionTeamId(myCollectionTeams[0]?.id ?? "");
      setCreateCollectionOpen(true);
    },
    [myCollectionTeams]
  );

  const submitCreateCollectionModal = useCallback(() => {
    const name = createCollectionName.trim();
    if (!name) {
      toast("Collection name is required");
      return;
    }
    if (createCollectionScope === "team" && !createCollectionTeamId) {
      toast("Pick a team");
      return;
    }

    const input: NewDirectoryCollectionInput = {
      name,
      description: createCollectionDescription.trim() || undefined,
      scope: createCollectionScope,
      teamId: createCollectionScope === "team" ? createCollectionTeamId : null,
    };

    const id = createDirectoryCollection(input);
    if (!id) return;

    if (createCollectionFromBulk && selectedProductIds.size > 0) {
      const ids = Array.from(selectedProductIds);
      setDirectoryCollections((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, productIds: Array.from(new Set([...(c.productIds ?? []), ...ids])) } : c
        )
      );
      setProducts((prev) =>
        prev.map((p) => {
          if (!selectedProductIds.has(p.id)) return p;
          const nextIds = p.collectionIds.includes(id) ? p.collectionIds : [...p.collectionIds, id];
          const refs = buildDirectoryCollectionRefs(nextIds, [
            ...directoryCollections,
            {
              id,
              name: input.name,
              scope: input.scope,
              ownerId: uid,
              teamId: input.teamId,
              productIds: ids,
            } as DirectoryCollectionOption,
          ]);
          return { ...p, collectionIds: nextIds, collections: refs, collectionCount: nextIds.length };
        })
      );
      toast(`Created "${name}" and added ${ids.length} product${ids.length !== 1 ? "s" : ""}`);
      setBulkCollectionOpen(false);
      clearSelection();
    } else {
      setCollectionFilter([id]);
      setMainTab("browse");
    }

    setCreateCollectionOpen(false);
  }, [
    clearSelection,
    createCollectionDescription,
    createCollectionFromBulk,
    createCollectionName,
    createCollectionScope,
    createCollectionTeamId,
    createDirectoryCollection,
    directoryCollections,
    selectedProductIds,
    toast,
    uid,
  ]);

  const handleAddToItinerary = useCallback(() => {
    toast("Add to itinerary (connect API when ready)");
  }, [toast]);

  const handleQuickAddToCollection = useCallback(
    (collectionId: string) => {
      if (!detailProduct || detailProduct.collectionIds.includes(collectionId)) return;
      const nextIds = [...detailProduct.collectionIds, collectionId];
      const pid = detailProduct.id;
      setDirectoryCollections((prev) => {
        const next = prev.map((c) =>
          c.id === collectionId && !(c.productIds ?? []).includes(pid)
            ? { ...c, productIds: [...(c.productIds ?? []), pid] }
            : c
        );
        const refs = buildDirectoryCollectionRefs(nextIds, next);
        patchProduct(detailProduct.id, {
          collectionIds: nextIds,
          collections: refs,
          collectionCount: nextIds.length,
        });
        return next;
      });
    },
    [detailProduct, patchProduct]
  );

  const handleMapSelect = useCallback((id: string) => {
    setDetailProductId(id);
  }, []);

  const removeProductFromFilteredCollection = useCallback(
    (productId: string) => {
      if (collectionFilter.length !== 1) return;
      const cid = collectionFilter[0];
      const p = products.find((x) => x.id === productId);
      if (!p) return;
      const nextIds = p.collectionIds.filter((c) => c !== cid);
      setDirectoryCollections((prev) => {
        const next = prev.map((c) =>
          c.id === cid ? { ...c, productIds: (c.productIds ?? []).filter((x) => x !== productId) } : c
        );
        const nextRefs = buildDirectoryCollectionRefs(nextIds, next);
        patchProduct(productId, {
          collectionIds: nextIds,
          collections: nextRefs,
          collectionCount: nextIds.length,
        });
        return next;
      });
      toast("Removed from collection");
    },
    [collectionFilter, products, patchProduct, toast]
  );

  const showRemoveOnCards = collectionFilter.length === 1 && canEditActiveCollection;

  const addBulkToCollection = useCallback(
    (colId: string) => {
      const col = directoryCollections.find((c) => c.id === colId);
      if (!col) return;
      const ids = Array.from(selectedProductIds);
      let added = 0;
      setDirectoryCollections((prev) => {
        let catalog = prev;
        for (const pid of ids) {
          const p = products.find((x) => x.id === pid);
          if (!p || p.collectionIds.includes(colId)) continue;
          const nextIds = [...p.collectionIds, colId];
          catalog = catalog.map((c) =>
            c.id === colId && !(c.productIds ?? []).includes(pid)
              ? { ...c, productIds: [...(c.productIds ?? []), pid] }
              : c
          );
          const refs = buildDirectoryCollectionRefs(nextIds, catalog);
          patchProduct(pid, { collectionIds: nextIds, collections: refs, collectionCount: nextIds.length });
          added += 1;
        }
        return catalog;
      });
      toast(`Added ${added} product${added !== 1 ? "s" : ""} to ${col.name}`);
      setBulkCollectionOpen(false);
      clearSelection();
    },
    [directoryCollections, selectedProductIds, products, patchProduct, toast, clearSelection]
  );

  const bulkRemoveFromActiveCollection = useCallback(() => {
    if (collectionFilter.length !== 1 || !activeCollectionMeta) return;
    const cid = collectionFilter[0];
    const ids = Array.from(selectedProductIds);
    setDirectoryCollections((prev) => {
      let catalog = prev;
      for (const pid of ids) {
        const p = products.find((x) => x.id === pid);
        if (!p || !p.collectionIds.includes(cid)) continue;
        const nextIds = p.collectionIds.filter((c) => c !== cid);
        catalog = catalog.map((c) =>
          c.id === cid ? { ...c, productIds: (c.productIds ?? []).filter((x) => x !== pid) } : c
        );
        const refs = buildDirectoryCollectionRefs(nextIds, catalog);
        patchProduct(pid, { collectionIds: nextIds, collections: refs, collectionCount: nextIds.length });
      }
      return catalog;
    });
    toast(`Removed ${ids.length} product${ids.length !== 1 ? "s" : ""} from ${activeCollectionMeta.name}`);
    clearSelection();
  }, [collectionFilter, activeCollectionMeta, selectedProductIds, products, patchProduct, toast, clearSelection]);

  const collectionScopeForBadge = (c: DirectoryCollectionOption) =>
    c.scope === "private" ? "private" : (c.teamId ?? TEAM_EVERYONE_ID);

  const headerCollection = activeCollectionMeta
    ? {
        ...activeCollectionMeta,
        name: collectionCopyEdits[activeCollectionMeta.id]?.name ?? activeCollectionMeta.name,
        description:
          collectionCopyEdits[activeCollectionMeta.id]?.description ?? activeCollectionMeta.description,
      }
    : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#08080c] text-[#F5F5F5]">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] px-6 py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-none text-[#F5F5F5]">Product Directory</h1>
          <p className="mt-1 text-[11px] leading-snug text-[rgba(245,245,245,0.5)]">
            {mainTab === "browse"
              ? `${sortedProducts.length} product${sortedProducts.length !== 1 ? "s" : ""}`
              : mainTab === "collections"
                ? `${availableCollections.length} collection${availableCollections.length !== 1 ? "s" : ""}`
                : `${portalRowCount} partner program${portalRowCount !== 1 ? "s" : ""}`}
          </p>
        </div>
      </header>

      <div className="flex shrink-0 gap-0.5 border-b border-[rgba(255,255,255,0.08)] px-6">
        {(
          [
            { id: "browse" as const, label: "Products" },
            { id: "collections" as const, label: "Collections" },
            { id: "partner-portal" as const, label: "Partner portal" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMainTab(t.id)}
            className={cn(
              "relative px-3 py-2.5 text-[11px] font-medium transition-colors",
              mainTab === t.id ? "text-[#F5F5F5]" : "text-[#6B6560] hover:text-[#9B9590]"
            )}
          >
            {t.label}
            {mainTab === t.id ? (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#C9A96E]" />
            ) : null}
          </button>
        ))}
      </div>

      {mainTab === "browse" ? (
      <div className="shrink-0 px-6 pb-0 pt-4">
        <ProductDirectoryFilterBar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        activeTypeFilters={activeTypeFilters}
        onToggleTypeFilter={toggleTypeFilter}
        onClearTypeFilters={clearTypeFilters}
        locationCountries={locationCountries}
        onLocationCountriesChange={setLocationCountries}
        collectionFilter={collectionFilter}
        onCollectionFilterChange={setCollectionFilter}
        onRequestNewCollection={() => openCreateCollectionModal("general")}
        collections={availableCollections}
        teams={MOCK_TEAMS}
        selectedProgramIds={selectedProgramIds}
        onSelectedProgramIdsChange={setSelectedProgramIds}
        selectedAmenities={selectedAmenities}
        onSelectedAmenitiesChange={setSelectedAmenities}
        commissionRange={commissionRange}
        onCommissionRangeChange={setCommissionRange}
        commissionFilterActive={commissionFilterActive}
        onCommissionFilterActiveChange={setCommissionFilterActive}
        sortByCommission={sortByCommission}
        onSortByCommissionChange={setSortByCommission}
        selectedTiers={selectedTiers}
        onSelectedTiersChange={setSelectedTiers}
        selectedPriceTiers={selectedPriceTiers}
        onSelectedPriceTiersChange={setSelectedPriceTiers}
        showExpiringOnly={showExpiringOnly}
        onShowExpiringOnlyChange={setShowExpiringOnly}
        showMyEnrichedOnly={showMyEnrichedOnly}
        onShowMyEnrichedOnlyChange={setShowMyEnrichedOnly}
        enrichFilterTeam={enrichFilterTeam}
        onEnrichFilterTeamChange={setEnrichFilterTeam}
        enrichFilterPersonal={enrichFilterPersonal}
        onEnrichFilterPersonalChange={setEnrichFilterPersonal}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        canViewCommissions={canViewCommissions}
        resultCount={sortedProducts.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        bulkMode={bulkMode}
        bulkSelectedCount={selectedProductIds.size}
        onBulkModeToggle={handleBulkToggle}
      />

      {(locationCountries.length > 0 ||
        selectedProgramIds.length > 0 ||
        selectedAmenities.length > 0 ||
        (canViewCommissions && commissionFilterActive) ||
        selectedTiers.length > 0 ||
        selectedPriceTiers.length > 0 ||
        showExpiringOnly ||
        showMyEnrichedOnly ||
        activeTypeFilters.length > 0 ||
        collectionFilter.length > 0 ||
        debouncedSearch.trim()) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {debouncedSearch.trim() ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-[#9B9590] transition-colors hover:bg-white/[0.06]"
            >
              &quot;{debouncedSearch.slice(0, 24)}
              {debouncedSearch.length > 24 ? "…" : ""}&quot;
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {activeTypeFilters.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTypeFilters([])}
              className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-[#9B9590] transition-colors hover:bg-white/[0.06]"
            >
              {activeTypeFilters.map((id) => directoryCategoryLabel(id)).join(", ")}
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {locationCountries.length > 0 ? (
            <button
              type="button"
              onClick={() => setLocationCountries([])}
              className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-[#9B9590] transition-colors hover:bg-white/[0.06]"
            >
              {locationCountries.slice(0, 2).join(", ")}
              {locationCountries.length > 2 ? ` +${locationCountries.length - 2}` : ""}
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {collectionFilter.length > 0 ? (
            <button
              type="button"
              onClick={() => setCollectionFilter([])}
              className="flex items-center gap-1 rounded-full bg-[rgba(201,169,110,0.06)] px-2 py-0.5 text-[9px] text-[#B8976E] transition-colors hover:bg-[rgba(201,169,110,0.10)]"
            >
              {collectionFilter.length === 1
                ? availableCollections.find((c) => c.id === collectionFilter[0])?.name ?? "Collection"
                : `${collectionFilter.length} collections`}
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {selectedProgramIds.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedProgramIds([])}
              className="flex items-center gap-1 rounded-full bg-[rgba(201,169,110,0.06)] px-2 py-0.5 text-[9px] text-[#B8976E] transition-colors hover:bg-[rgba(201,169,110,0.10)]"
            >
              {AGENCY_PROGRAM_OPTIONS.filter((p) => selectedProgramIds.includes(p.id))
                .map((p) => p.name)
                .join(", ")}
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {selectedAmenities.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedAmenities([])}
              className="flex items-center gap-1 rounded-full bg-[rgba(91,138,110,0.06)] px-2 py-0.5 text-[9px] text-[#5B8A6E] transition-colors hover:bg-[rgba(91,138,110,0.10)]"
            >
              {selectedAmenities.map((b) => AMENITY_LABELS[b]).join(", ")}
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {canViewCommissions && commissionFilterActive ? (
            <button
              type="button"
              onClick={() => {
                setCommissionFilterActive(false);
                setCommissionRange([0, 25]);
              }}
              className="flex items-center gap-1 rounded-full bg-[rgba(184,151,110,0.06)] px-2 py-0.5 text-[9px] text-[#B8976E] transition-colors hover:bg-[rgba(184,151,110,0.10)]"
            >
              {commissionRange[0]}%–{commissionRange[1]}%
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {selectedTiers.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedTiers([])}
              className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-[#9B9590] transition-colors hover:bg-white/[0.06]"
            >
              {selectedTiers.map((t) => DIRECTORY_TIER_FILTER_UI.find((x) => x.id === t)?.label ?? t).join(", ")}
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {selectedPriceTiers.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedPriceTiers([])}
              className="flex items-center gap-1 rounded-full bg-[rgba(201,169,110,0.06)] px-2 py-0.5 text-[9px] text-[#C9A96E] transition-colors hover:bg-[rgba(201,169,110,0.10)]"
            >
              {selectedPriceTiers.join(" ")}
              <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {showExpiringOnly ? (
            <button
              type="button"
              onClick={() => setShowExpiringOnly(false)}
              className="flex items-center gap-1 rounded-full bg-[rgba(184,151,110,0.06)] px-2 py-0.5 text-[9px] text-[#B8976E] transition-colors hover:bg-[rgba(184,151,110,0.10)]"
            >
              Expiring soon <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          {showMyEnrichedOnly ? (
            <button
              type="button"
              onClick={() => setShowMyEnrichedOnly(false)}
              className="flex items-center gap-1 rounded-full bg-[rgba(160,140,180,0.06)] px-2 py-0.5 text-[9px] text-[rgba(160,140,180,0.60)] transition-colors hover:bg-[rgba(160,140,180,0.10)]"
            >
              My enriched <span className="text-[#6B6560]">✕</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-1.5 text-[9px] text-[#6B6560] transition-colors hover:text-[#9B9590]"
          >
            Clear all
          </button>
        </div>
      )}

      {headerCollection && activeCollectionMeta && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[rgba(255,255,255,0.03)] bg-[#0c0c12] p-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {editingCollectionHeader && canEditActiveCollection ? (
              <div className="space-y-2">
                <input
                  type="text"
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#08080c] px-2 py-1.5 text-[13px] text-[#F5F0EB]"
                  value={headerCollection.name}
                  onChange={(e) =>
                    setCollectionCopyEdits((prev) => ({
                      ...prev,
                      [activeCollectionMeta.id]: {
                        ...prev[activeCollectionMeta.id],
                        name: e.target.value,
                        description:
                          prev[activeCollectionMeta.id]?.description ?? activeCollectionMeta.description ?? "",
                      },
                    }))
                  }
                />
                <textarea
                  className="min-h-[52px] w-full resize-none rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#08080c] px-2 py-1.5 text-[11px] text-[#9B9590]"
                  value={headerCollection.description ?? ""}
                  placeholder="Description"
                  onChange={(e) =>
                    setCollectionCopyEdits((prev) => ({
                      ...prev,
                      [activeCollectionMeta.id]: {
                        ...prev[activeCollectionMeta.id],
                        name: prev[activeCollectionMeta.id]?.name ?? activeCollectionMeta.name,
                        description: e.target.value,
                      },
                    }))
                  }
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-[10px] text-[#C9A96E]"
                    onClick={() => {
                      setEditingCollectionHeader(false);
                      toast("Collection saved (demo — not persisted)");
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="text-[10px] text-[#6B6560]"
                    onClick={() => {
                      setCollectionCopyEdits((prev) => {
                        const next = { ...prev };
                        delete next[activeCollectionMeta.id];
                        return next;
                      });
                      setEditingCollectionHeader(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-[14px] font-medium text-[#F5F0EB]">{headerCollection.name}</h3>
                  <ScopeBadge scope={collectionScopeForBadge(activeCollectionMeta)} teams={MOCK_TEAMS} />
                </div>
                {headerCollection.description ? (
                  <p className="text-[11px] text-[#9B9590]">{headerCollection.description}</p>
                ) : null}
                <p className="mt-1 text-[10px] text-[#6B6560]">
                  {activeCollectionProductCount} products
                  {activeCollectionMeta.ownerName ? ` · Created by ${activeCollectionMeta.ownerName}` : ""}
                </p>
              </>
            )}
          </div>
          {!editingCollectionHeader && (
            <div className="flex shrink-0 gap-2">
              {canEditActiveCollection && (
                <button
                  type="button"
                  className="text-[10px] text-[#9B9590] transition-colors hover:text-[#F5F0EB]"
                  onClick={() => setEditingCollectionHeader(true)}
                >
                  Edit
                </button>
              )}
              {canShareActiveCollection && (
                <button
                  type="button"
                  className="text-[10px] text-[#C9A96E] transition-colors hover:text-[#D4B383]"
                  onClick={() => toast("Share with team (demo)")}
                >
                  Share with…
                </button>
              )}
            </div>
          )}
        </div>
      )}

      </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
      {mainTab === "collections" ? (
        <ProductDirectoryCollectionsTab
          collections={availableCollections}
          products={products}
          teams={MOCK_TEAMS}
          onOpenCollection={(id) => {
            setCollectionFilter([id]);
            setMainTab("browse");
          }}
        />
      ) : mainTab === "partner-portal" ? (
        <ProductDirectoryPartnerPortalTab
          products={products}
          teams={MOCK_TEAMS}
          canViewCommissions={canViewCommissions}
          isAdmin={isAdmin}
          onSelectProduct={(id) => setDetailProductId(id)}
          onAdminSaveProgram={saveProgramFromPartnerPortal}
        />
      ) : compareMode && compareProducts.length >= 2 ? (
        <ProductDirectoryCompareView
          products={compareProducts}
          canViewCommissions={canViewCommissions}
          onClose={clearSelection}
          onViewFullDetails={(p) => {
            clearSelection();
            setDetailProductId(p.id);
          }}
        />
      ) : (
        <>
          {viewMode === "grid" && (
            <div
              className={cn(
                "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
                !detailProduct && "xl:grid-cols-4"
              )}
            >
              {sortedProducts.map((product) => (
                <DirectoryProductCard
                  key={product.id}
                  product={product}
                  canViewCommissions={canViewCommissions}
                  bookmarked={isBookmarked(product)}
                  onProductClick={() => {
                    if (bulkMode) {
                      toggleProductSelection(product.id);
                      return;
                    }
                    setDetailProductId(product.id);
                  }}
                  onAddToCollectionClick={() => setPickerProductId(product.id)}
                  showRemoveFromCollection={showRemoveOnCards}
                  onRemoveFromCollection={
                    showRemoveOnCards ? () => removeProductFromFilteredCollection(product.id) : undefined
                  }
                  bulkMode={bulkMode}
                  bulkSelected={selectedProductIds.has(product.id)}
                  onToggleBulkSelect={() => toggleProductSelection(product.id)}
                  onEnterBulkMode={(id) => {
                    setBulkMode(true);
                    setSelectedProductIds(new Set([id]));
                  }}
                />
              ))}
            </div>
          )}

          {viewMode === "list" && (
            <DirectoryProductListView
              products={sortedProducts}
              canViewCommissions={canViewCommissions}
              isBookmarked={isBookmarked}
              onRowClick={(p) => {
                if (bulkMode) {
                  toggleProductSelection(p.id);
                  return;
                }
                setDetailProductId(p.id);
              }}
              onAddToCollectionClick={(p) => setPickerProductId(p.id)}
              showRemoveFromCollection={showRemoveOnCards}
              onRemoveFromFilteredCollection={
                showRemoveOnCards ? removeProductFromFilteredCollection : undefined
              }
              bulkMode={bulkMode}
              bulkSelectedIds={selectedProductIds}
              onToggleBulkSelect={toggleProductSelection}
              onEnterBulkMode={(id) => {
                setBulkMode(true);
                setSelectedProductIds(new Set([id]));
              }}
            />
          )}

          {viewMode === "map" && (
            <ProductDirectoryMapSplit
              products={sortedProducts}
              selectedId={detailProductId}
              clusterProducts={mapCluster}
              canViewCommissions={canViewCommissions}
              onSelectProduct={handleMapSelect}
              onClusterOpen={setMapCluster}
              onClusterClose={() => setMapCluster(null)}
            />
          )}

          {sortedProducts.length === 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
              <Search className="mx-auto mb-3 h-6 w-6 text-[#4A4540]" aria-hidden />
              <p className="mb-1 text-[13px] font-medium text-[#F5F0EB]">No products match</p>
              <p className="mb-4 text-[11px] text-[#6B6560]">Your current filters are too narrow.</p>
              {emptyStateHint ? (
                <button
                  type="button"
                  onClick={emptyStateHint.onClear}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.12)] bg-[rgba(201,169,110,0.06)] px-3 py-1.5 text-[11px] text-[#C9A96E] transition-colors hover:bg-[rgba(201,169,110,0.10)]"
                >
                  {`Remove ${emptyStateHint.label} filter → ${emptyStateHint.count} result${emptyStateHint.count === 1 ? "" : "s"}`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.03] px-3 py-1.5 text-[11px] text-[#9B9590] transition-colors hover:bg-white/[0.06]"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </>
      )}

      </div>

      {/* Slide-in detail: 7-block layout + layer mock data in ProductDirectoryDetailBody */}
      {detailProduct && (
        <ProductDirectoryDetailPanel
          product={detailProduct}
          canViewCommissions={canViewCommissions}
          isAdmin={isAdmin}
          teams={MOCK_TEAMS}
          onClose={() => setDetailProductId(null)}
          onOpenCollectionPicker={() => {
            setPickerProductId(detailProduct.id);
          }}
          onPatchProduct={patchProduct}
          onAddToItinerary={handleAddToItinerary}
          canRemoveFromCollection={canRemoveFromCollection}
          availableCollections={availableCollections}
          onQuickAddToCollection={handleQuickAddToCollection}
          onRequestCreateCollection={() => setPickerProductId(detailProduct.id)}
          partnerProgramCustomKeys={detailProductCustomProgramKeys}
        />
      )}

      {pickerProduct && (
        <ProductDirectoryCollectionPicker
          product={pickerProduct}
          collections={availableCollections}
          teams={MOCK_TEAMS}
          initialSelectedIds={pickerProduct.collectionIds}
          onClose={() => setPickerProductId(null)}
          onSave={(ids) => savePicker(pickerProduct.id, ids)}
            onCreateCollection={createDirectoryCollection}
        />
      )}

      {bulkCollectionOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[45] cursor-default bg-black/20"
          aria-label="Close menu"
          onClick={() => setBulkCollectionOpen(false)}
        />
      )}

      {bulkCollectionOpen && (
        <div className="fixed bottom-20 left-1/2 z-[50] w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] py-1 shadow-2xl">
          <p className="px-3 py-2 text-[9px] uppercase tracking-wider text-[#4A4540]">
            Add {selectedProductIds.size} products to…
          </p>
          {availableCollections.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => addBulkToCollection(col.id)}
              className="w-full px-3 py-2 text-left text-xs text-[#C8C0B8] transition-colors hover:bg-white/[0.04]"
            >
              {col.teamName ? `[${col.teamName}] ${col.name}` : col.name}
            </button>
          ))}
          <div className="mt-1 border-t border-white/[0.04] pt-1">
            <button
              type="button"
              onClick={() => {
                setBulkCollectionOpen(false);
                openCreateCollectionModal("bulk");
              }}
              className="flex w-full items-center gap-1 px-3 py-2 text-left text-xs text-[#C9A96E] transition-colors hover:bg-white/[0.04]"
            >
              + New Collection
            </button>
          </div>
        </div>
      )}

      {selectedProductIds.size > 0 && !compareMode && mainTab === "browse" && (
        <div className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0c0c12]/95 px-5 py-3 shadow-2xl backdrop-blur-xl">
          <span className="text-[12px] font-medium text-[#F5F0EB]">{selectedProductIds.size} selected</span>
          <div className="h-5 w-px bg-white/[0.06]" />
          <button
            type="button"
            onClick={() => setBulkCollectionOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.08)] px-3 py-1.5 text-[11px] text-[#C9A96E] transition-colors hover:bg-[rgba(201,169,110,0.12)]"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Add to Collection
          </button>
          {activeCollectionMeta && canEditActiveCollection && collectionFilter.length === 1 && (
            <button
              type="button"
              onClick={bulkRemoveFromActiveCollection}
              className="flex items-center gap-1.5 rounded-lg border border-[rgba(166,107,107,0.15)] bg-[rgba(166,107,107,0.08)] px-3 py-1.5 text-[11px] text-[#A66B6B] transition-colors hover:bg-[rgba(166,107,107,0.12)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove from Collection
            </button>
          )}
          <button
            type="button"
            disabled={selectedProductIds.size < 2 || selectedProductIds.size > 4}
            title={
              selectedProductIds.size < 2
                ? "Select 2–4 products to compare"
                : selectedProductIds.size > 4
                  ? "Compare supports up to 4 products"
                  : "Compare selected"
            }
            onClick={() => {
              if (selectedProductIds.size < 2 || selectedProductIds.size > 4) return;
              setCompareMode(true);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.03] px-3 py-1.5 text-[11px] text-[#9B9590] transition-colors disabled:opacity-30",
              selectedProductIds.size >= 2 &&
                selectedProductIds.size <= 4 &&
                "hover:bg-white/[0.06] hover:text-[#F5F0EB]"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Compare
          </button>
          <button type="button" onClick={clearSelection} className="px-2 py-1.5 text-[11px] text-[#6B6560] transition-colors hover:text-[#9B9590]">
            ✕ Clear
          </button>
        </div>
      )}

      {createCollectionOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0c0c12] p-4">
            <h3 className="text-sm font-semibold text-[#F5F0EB]">Create Collection</h3>
            <p className="mt-1 text-[11px] text-[#6B6560]">Set the basics, then save.</p>
            <div className="mt-3 space-y-2">
              <input
                value={createCollectionName}
                onChange={(e) => setCreateCollectionName(e.target.value)}
                placeholder="Collection name"
                className="w-full rounded-lg border border-white/[0.08] bg-[#08080c] px-3 py-2 text-[12px] text-[#F5F0EB] outline-none"
              />
              <textarea
                value={createCollectionDescription}
                onChange={(e) => setCreateCollectionDescription(e.target.value)}
                rows={2}
                placeholder="Description (optional)"
                className="w-full resize-none rounded-lg border border-white/[0.08] bg-[#08080c] px-3 py-2 text-[12px] text-[#F5F0EB] outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreateCollectionScope("private")}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[11px]",
                    createCollectionScope === "private"
                      ? "border-[#C9A96E] bg-[rgba(201,169,110,0.12)] text-[#F5F0EB]"
                      : "border-white/[0.08] text-[#9B9590]"
                  )}
                >
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => setCreateCollectionScope("team")}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[11px]",
                    createCollectionScope === "team"
                      ? "border-[#C9A96E] bg-[rgba(201,169,110,0.12)] text-[#F5F0EB]"
                      : "border-white/[0.08] text-[#9B9590]"
                  )}
                >
                  Team
                </button>
              </div>
              {createCollectionScope === "team" ? (
                <select
                  value={createCollectionTeamId}
                  onChange={(e) => setCreateCollectionTeamId(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#08080c] px-3 py-2 text-[12px] text-[#F5F0EB] outline-none"
                >
                  {myCollectionTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-[11px] text-[#9B9590]"
                onClick={() => setCreateCollectionOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#C9A96E] px-3 py-1.5 text-[11px] font-medium text-[#08080c]"
                onClick={submitCreateCollectionModal}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
