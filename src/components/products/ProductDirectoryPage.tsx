"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, LayoutGrid, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/contexts/ToastContext";
import { MOCK_TEAMS, resolveUserPolicies } from "@/lib/teamsMock";
import type {
  DirectoryAmenityTag,
  DirectoryCollectionOption,
  DirectoryExternalSearchMeta,
  DirectoryProduct,
  DirectoryProductCategory,
  NewDirectoryCollectionInput,
} from "@/types/product-directory";
import {
  buildDirectoryCollectionRefs,
  cloneMockDirectoryCatalogForAdvisor,
  DIRECTORY_EXTERNAL_COLLECTION_ID,
  externalSearchSavedTooltip,
} from "./productDirectoryMock";
import ProductDirectoryFilterBar from "./ProductDirectoryFilterBar";
import DirectoryProductCard from "./DirectoryProductCard";
import DirectoryProductListView from "./DirectoryProductListView";
import ProductDirectoryDetailPanel from "./ProductDirectoryDetailPanel";
import ProductDirectoryCollectionPicker from "./ProductDirectoryCollectionPicker";
import ProductDirectoryMapSplit from "./ProductDirectoryMapSplit";
import {
  buildPartnerPortalRows,
  ProductDirectoryCollectionsTab,
  ProductDirectoryPartnerPortalTab,
} from "./ProductDirectoryTabsViews";
import type { Team } from "@/types/teams";
import type { DirectoryPriceTier, DirectoryTierLevel } from "@/components/products/productDirectoryDetailMeta";
import {
  AGENCY_PROGRAM_OPTIONS,
  AMENITY_LABELS,
  compareProductsByRegistryCommission,
  DIRECTORY_TIER_FILTER_UI,
  type DirectoryProductSortOption,
  DEFAULT_DIRECTORY_PRODUCT_SORT,
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
import { cloneDirectoryCollectionsForState, cloneDirectoryProductsForState, persistDirectorySnapshot } from "./productDirectoryPersistence";
import { resolveAdvisorCatalogFromStorage } from "./productDirectoryCatalogResolve";
import { useProductDirectoryCatalog } from "./ProductDirectoryCatalogContext";
import { directoryCategoryColors, directoryCategoryLabel } from "./productDirectoryVisual";
import { ScopeBadge } from "@/components/ui/ScopeBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TEAM_EVERYONE_ID } from "@/types/teams";

type ProductDirectoryMainTab = "browse" | "collections" | "partner-portal";

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
        <span className="text-compact font-medium text-foreground">Comparing {products.length} products</span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
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
                  <h3 className="text-compact font-medium text-foreground">{product.name}</h3>
                  <p className="text-2xs text-muted-foreground">
                    {product.city && product.country ? `${product.city}, ${product.country}` : product.location}
                  </p>
                </div>

                <div className={diffWrapClass(typeDiffers)}>
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground/65">Type</p>
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-2xs"
                    style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}` }}
                  >
                    {directoryCategoryLabel(product.type)}
                  </span>
                </div>

                <div className={diffWrapClass(progDiffers)}>
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground/65">Programs</p>
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
                    <span className="text-2xs italic text-muted-foreground/65">None</span>
                  )}
                </div>

                <div className={diffWrapClass(amenityDiffers)}>
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground/65">Client amenities</p>
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
                    <span className="text-2xs italic text-muted-foreground/65">Direct booking</span>
                  )}
                </div>

                {canViewCommissions && (
                  <div className={diffWrapClass(!!commDiffers)}>
                    <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground/65">Commission</p>
                    {topRate != null ? (
                      <span className="text-base font-medium text-[#B8976E]">{topRate}%</span>
                    ) : (
                      <span className="text-2xs italic text-muted-foreground/65">—</span>
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
                      <span className="text-[9px] text-muted-foreground">Team data</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: product.hasAdvisorNotes ? "rgba(160,140,180,0.60)" : "rgba(255,255,255,0.06)",
                        }}
                      />
                      <span className="text-[9px] text-muted-foreground">My notes</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onViewFullDetails(product)}
                  className="w-full rounded-lg bg-white/[0.03] py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
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
    if (c.isSystem) {
      if (c.scope === "team" && c.teamId) return memberTeamIds.includes(c.teamId);
      if (c.scope === "private") return c.ownerId === uid;
      return true;
    }
    if (c.scope === "private" && c.ownerId === uid) return true;
    if (c.scope === "team" && c.teamId && memberTeamIds.includes(c.teamId)) return true;
    return false;
  });
}

const DIRECTORY_SEED_NAME = "Janet";

export default function ProductDirectoryPage() {
  const { user, directoryViewAsAdmin, isLoading: userLoading } = useUser();
  const toast = useToast();
  const { catalogRevision } = useProductDirectoryCatalog();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const uid = user ? String(user.id) : "1";

  const policies = useMemo(
    () => resolveUserPolicies(user ? { id: String(user.id), role: user.role } : null, MOCK_TEAMS),
    [user]
  );
  const canViewCommissions = policies.canViewCommissions;
  const isAdmin =
    directoryViewAsAdmin || user?.role === "admin" || user?.role === "agency_admin";

  const [products, setProducts] = useState<DirectoryProduct[]>(
    () => cloneMockDirectoryCatalogForAdvisor("1", DIRECTORY_SEED_NAME).products
  );

  const [directoryCollections, setDirectoryCollections] = useState<DirectoryCollectionOption[]>(
    () => cloneMockDirectoryCatalogForAdvisor("1", DIRECTORY_SEED_NAME).collections
  );

  const [externalSearchMeta, setExternalSearchMeta] = useState<Record<string, DirectoryExternalSearchMeta>>({});

  useEffect(() => {
    if (userLoading) return;
    const advisorUid = String(user?.id ?? "1");
    const advisorName = user?.username ?? user?.email?.split("@")[0] ?? "You";
    const r = resolveAdvisorCatalogFromStorage(advisorUid, advisorName);
    setProducts(r.products);
    setDirectoryCollections(r.directoryCollections);
    setExternalSearchMeta(r.externalSearchMeta);
  }, [userLoading, user?.id, user?.username, user?.email, catalogRevision]);

  const externalSearchTooltipForProduct = useCallback(
    (productId: string) => externalSearchSavedTooltip(productId, externalSearchMeta),
    [externalSearchMeta]
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
  const [sortBy, setSortBy] = useState<DirectoryProductSortOption>(DEFAULT_DIRECTORY_PRODUCT_SORT);
  const urlViewParam = searchParams.get("view");
  const viewFromUrl: "grid" | "list" | "map" =
    urlViewParam === "list" || urlViewParam === "map" ? urlViewParam : "grid";
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">(viewFromUrl);
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
  const browseScrollRef = useRef<HTMLDivElement>(null);

  const [mainTab, setMainTab] = useState<ProductDirectoryMainTab>("browse");
  const [partnerPortalDirty, setPartnerPortalDirty] = useState(false);
  const [partnerPortalMountKey, setPartnerPortalMountKey] = useState(0);
  const [tabLeaveDialogOpen, setTabLeaveDialogOpen] = useState(false);
  const [pendingMainTab, setPendingMainTab] = useState<ProductDirectoryMainTab | null>(null);

  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [createCollectionFromBulk, setCreateCollectionFromBulk] = useState(false);
  const [createCollectionName, setCreateCollectionName] = useState("");
  const [createCollectionDescription, setCreateCollectionDescription] = useState("");
  const [createCollectionScope, setCreateCollectionScope] = useState<"private" | "team">("private");
  const [createCollectionTeamId, setCreateCollectionTeamId] = useState("");

  const portalRowCount = useMemo(() => buildPartnerPortalRows(products).length, [products]);

  useEffect(() => {
    const t = setTimeout(() => {
      persistDirectorySnapshot(products, directoryCollections, externalSearchMeta);
    }, 500);
    return () => clearTimeout(t);
  }, [products, directoryCollections, externalSearchMeta]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    const next: ProductDirectoryMainTab =
      tab === "collections"
        ? "collections"
        : tab === "partner" || tab === "partner-portal"
          ? "partner-portal"
          : "browse";
    setMainTab((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  const applyUrlForTab = useCallback(
    (t: ProductDirectoryMainTab) => {
      const p = new URLSearchParams(searchParams.toString());
      if (t === "browse") {
        p.delete("tab");
        p.delete("program");
      } else if (t === "collections") {
        p.set("tab", "collections");
        p.delete("program");
      } else {
        p.set("tab", "partner");
      }
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const applyViewToUrl = useCallback(
    (mode: "grid" | "list" | "map") => {
      const p = new URLSearchParams(searchParams.toString());
      if (mode === "grid") p.delete("view");
      else p.set("view", mode);
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleViewModeChange = useCallback(
    (mode: "grid" | "list" | "map") => {
      setViewMode(mode);
      applyViewToUrl(mode);
    },
    [applyViewToUrl]
  );

  useEffect(() => {
    setViewMode((prev) => (prev === viewFromUrl ? prev : viewFromUrl));
  }, [viewFromUrl]);

  const trySetMainTab = useCallback(
    (t: ProductDirectoryMainTab) => {
      if (t === mainTab) return;
      if (mainTab === "partner-portal" && t !== "partner-portal" && partnerPortalDirty) {
        setPendingMainTab(t);
        setTabLeaveDialogOpen(true);
        return;
      }
      setMainTab(t);
      applyUrlForTab(t);
    },
    [applyUrlForTab, mainTab, partnerPortalDirty]
  );

  const confirmLeavePartnerTab = useCallback(() => {
    const t = pendingMainTab;
    setTabLeaveDialogOpen(false);
    setPendingMainTab(null);
    setPartnerPortalMountKey((k) => k + 1);
    setPartnerPortalDirty(false);
    if (t) {
      setMainTab(t);
      applyUrlForTab(t);
    }
  }, [applyUrlForTab, pendingMainTab]);

  const cancelLeavePartnerTab = useCallback(() => {
    setTabLeaveDialogOpen(false);
    setPendingMainTab(null);
  }, []);

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
  const canManageProductsInActiveCollection =
    canEditActiveCollection ||
    (activeCollectionMeta?.isSystem === true &&
      activeCollectionMeta.scope === "private" &&
      activeCollectionMeta.ownerId === uid);
  /** System collections cannot be renamed or have metadata edited in the browse header. */
  const canEditActiveCollectionMetadata = canEditActiveCollection && !activeCollectionMeta?.isSystem;
  const canShareActiveCollection =
    canEditActiveCollection && activeCollectionMeta != null && !activeCollectionMeta.isSystem;

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
    setSortByCommission(false);
    setSortBy(DEFAULT_DIRECTORY_PRODUCT_SORT);
  }, []);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    const addedOrUpdatedTs = (p: (typeof list)[0]) => {
      const iso = p.addedAt ?? p.updatedAt;
      if (!iso) return 0;
      const t = new Date(iso).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    /** Commission filter’s “highest commission” only tie-breaks; main Sort dropdown always wins. */
    const withCommissionTieBreak = (a: (typeof list)[0], b: (typeof list)[0], primary: number): number => {
      if (primary !== 0) return primary;
      if (sortByCommission && canViewCommissions && sortBy !== "commission-desc") {
        return compareProductsByRegistryCommission(a, b);
      }
      return 0;
    };

    switch (sortBy) {
      case "name-asc":
        list.sort((a, b) => withCommissionTieBreak(a, b, a.name.localeCompare(b.name)));
        return list;
      case "name-desc":
        list.sort((a, b) => withCommissionTieBreak(a, b, b.name.localeCompare(a.name)));
        return list;
      case "commission-desc":
        if (!canViewCommissions) {
          list.sort((a, b) => a.name.localeCompare(b.name));
          return list;
        }
        list.sort((a, b) => {
          const c = compareProductsByRegistryCommission(a, b);
          if (c !== 0) return c;
          return a.name.localeCompare(b.name);
        });
        return list;
      case "tier-desc":
        list.sort((a, b) =>
          withCommissionTieBreak(
            a,
            b,
            DIRECTORY_TIER_SORT_RANK[a.tier ?? "unrated"] - DIRECTORY_TIER_SORT_RANK[b.tier ?? "unrated"]
          )
        );
        return list;
      case "recently-added":
        list.sort((a, b) => withCommissionTieBreak(a, b, addedOrUpdatedTs(b) - addedOrUpdatedTs(a)));
        return list;
      case "enrichment-desc":
        list.sort((a, b) =>
          withCommissionTieBreak(a, b, (b.enrichmentScore ?? 0) - (a.enrichmentScore ?? 0))
        );
        return list;
      default:
        return list;
    }
  }, [filteredProducts, sortBy, sortByCommission, canViewCommissions]);

  useEffect(() => {
    if (mainTab !== "browse" || !detailProductId) return;
    if (viewMode !== "list" && viewMode !== "map") return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable=true]")) return;
      e.preventDefault();
      const idx = sortedProducts.findIndex((p) => p.id === detailProductId);
      if (idx < 0) return;
      const next =
        e.key === "ArrowDown" ? Math.min(sortedProducts.length - 1, idx + 1) : Math.max(0, idx - 1);
      if (next === idx) return;
      setDetailProductId(sortedProducts[next]!.id);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mainTab, detailProductId, viewMode, sortedProducts]);

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

  useLayoutEffect(() => {
    if (mainTab !== "browse" || viewMode !== "grid" || !detailProductId) return;
    const el = document.querySelector(`[data-directory-product-id="${CSS.escape(detailProductId)}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [detailProductId, mainTab, viewMode, sortedProducts.length]);

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
      if (c?.isSystem && c.scope === "private") return c.ownerId === uid;
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
      toast({ title: "Collections updated", tone: "success" });
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
      toast({ title: `Created “${newCol.name}”`, tone: "success" });
      return id;
    },
    [uid, user, pickerProductId, products, toast]
  );

  const saveProgramFromPartnerPortal = useCallback(
    (programKey: string, payload: PartnerPortalAdminSavePayload): boolean => {
      const validationError = validatePartnerPortalAdminPayload(payload);
      if (validationError) {
        toast({ title: validationError, tone: "destructive" });
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
      toast({
        title: `Updated program across ${updatedCount} product${updatedCount !== 1 ? "s" : ""}`,
        description: "Saved in this browser until API sync.",
        tone: "success",
      });
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
      toast({ title: "Collection name is required", tone: "destructive" });
      return;
    }
    if (createCollectionScope === "team" && !createCollectionTeamId) {
      toast({ title: "Pick a team", tone: "destructive" });
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
      toast({
        title: `Created "${name}" and added ${ids.length} product${ids.length !== 1 ? "s" : ""}`,
        tone: "success",
      });
      setBulkCollectionOpen(false);
      clearSelection();
    } else {
      setCollectionFilter([id]);
      trySetMainTab("browse");
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
    trySetMainTab,
  ]);

  const handleAddToItinerary = useCallback(() => {
    toast({
      title: "Add to itinerary",
      description: "Connect API when ready.",
      tone: "success",
    });
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
      toast({ title: "Removed from collection", tone: "success" });
    },
    [collectionFilter, products, patchProduct, toast]
  );

  const showRemoveOnCards = collectionFilter.length === 1 && canManageProductsInActiveCollection;

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
      toast({
        title: `Added ${added} product${added !== 1 ? "s" : ""} to ${col.name}`,
        tone: "success",
      });
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
    toast({
      title: `Removed ${ids.length} product${ids.length !== 1 ? "s" : ""} from ${activeCollectionMeta.name}`,
      tone: "success",
    });
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
    <div className="flex h-full min-h-0 flex-1 flex-col bg-inset text-foreground">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border pl-6 pr-[4.5rem] py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-semibold leading-none text-foreground">Product Directory</h1>
          <p className="mt-1 text-xs leading-snug text-muted-foreground/75">
            {mainTab === "browse"
              ? `${sortedProducts.length} product${sortedProducts.length !== 1 ? "s" : ""}`
              : mainTab === "collections"
                ? `${availableCollections.length} collection${availableCollections.length !== 1 ? "s" : ""}`
                : `${portalRowCount} program${portalRowCount !== 1 ? "s" : ""} · rates, linked properties & incentives`}
          </p>
        </div>
      </header>

      <div className="flex shrink-0 gap-0.5 border-b border-border pl-6 pr-[4.5rem]">
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
            onClick={() => trySetMainTab(t.id)}
            className={cn(
              "relative px-3 py-2.5 text-xs font-medium transition-colors",
              mainTab === t.id ? "text-foreground" : "text-muted-foreground hover:text-muted-foreground"
            )}
          >
            {t.label}
            {mainTab === t.id ? (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-brand-cta" />
            ) : null}
          </button>
        ))}
      </div>

      {mainTab === "browse" ? (
      <div className="relative z-10 shrink-0 px-6 pb-0 pt-4">
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
        sortBy={sortBy}
        onSortByChange={setSortBy}
        canViewCommissions={canViewCommissions}
        resultCount={sortedProducts.length}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
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
        activeTypeFilters.length > 0 ||
        collectionFilter.length > 0 ||
        debouncedSearch.trim()) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {debouncedSearch.trim() ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-muted-foreground transition-colors hover:bg-white/[0.06]"
            >
              &quot;{debouncedSearch.slice(0, 24)}
              {debouncedSearch.length > 24 ? "…" : ""}&quot;
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {activeTypeFilters.length > 0 ? (
            <button
              type="button"
              onClick={() => setActiveTypeFilters([])}
              className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-muted-foreground transition-colors hover:bg-white/[0.06]"
            >
              {activeTypeFilters.map((id) => directoryCategoryLabel(id)).join(", ")}
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {locationCountries.length > 0 ? (
            <button
              type="button"
              onClick={() => setLocationCountries([])}
              className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-muted-foreground transition-colors hover:bg-white/[0.06]"
            >
              {locationCountries.slice(0, 2).join(", ")}
              {locationCountries.length > 2 ? ` +${locationCountries.length - 2}` : ""}
              <span className="text-muted-foreground">✕</span>
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
              <span className="text-muted-foreground">✕</span>
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
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {selectedAmenities.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedAmenities([])}
              className="flex items-center gap-1 rounded-full bg-[rgba(91,138,110,0.06)] px-2 py-0.5 text-[9px] text-[#5B8A6E] transition-colors hover:bg-[rgba(91,138,110,0.10)]"
            >
              {selectedAmenities.map((b) => AMENITY_LABELS[b]).join(", ")}
              <span className="text-muted-foreground">✕</span>
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
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {selectedTiers.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedTiers([])}
              className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-muted-foreground transition-colors hover:bg-white/[0.06]"
            >
              {selectedTiers.map((t) => DIRECTORY_TIER_FILTER_UI.find((x) => x.id === t)?.label ?? t).join(", ")}
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {selectedPriceTiers.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedPriceTiers([])}
              className="flex items-center gap-1 rounded-full bg-[rgba(201,169,110,0.06)] px-2 py-0.5 text-[9px] text-brand-cta transition-colors hover:bg-[rgba(201,169,110,0.10)]"
            >
              {selectedPriceTiers.join(" ")}
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-1.5 text-[9px] text-muted-foreground transition-colors hover:text-muted-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {headerCollection && activeCollectionMeta && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-popover p-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {editingCollectionHeader && canEditActiveCollectionMetadata ? (
              <div className="space-y-2">
                <input
                  type="text"
                  className="w-full rounded-lg border border-border bg-inset px-2 py-1.5 text-compact text-foreground"
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
                  className="min-h-[52px] w-full resize-none rounded-lg border border-border bg-inset px-2 py-1.5 text-xs text-muted-foreground"
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
                    className="text-2xs text-brand-cta"
                    onClick={() => {
                      setEditingCollectionHeader(false);
                      toast({
                        title: "Collection saved (demo — not persisted)",
                        tone: "success",
                      });
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="text-2xs text-muted-foreground"
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
                  <h3 className="text-base font-medium text-foreground">{headerCollection.name}</h3>
                  <ScopeBadge scope={collectionScopeForBadge(activeCollectionMeta)} teams={MOCK_TEAMS} />
                </div>
                {headerCollection.description ? (
                  <p className="text-xs text-muted-foreground">{headerCollection.description}</p>
                ) : null}
                <p className="mt-1 text-2xs text-muted-foreground">
                  {activeCollectionProductCount} products
                  {activeCollectionMeta.ownerName ? ` · Created by ${activeCollectionMeta.ownerName}` : ""}
                </p>
              </>
            )}
          </div>
          {!editingCollectionHeader && (
            <div className="flex shrink-0 gap-2">
              {canEditActiveCollectionMetadata && (
                <button
                  type="button"
                  className="text-2xs text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setEditingCollectionHeader(true)}
                >
                  Edit
                </button>
              )}
              {canShareActiveCollection && (
                <button
                  type="button"
                  className="text-2xs text-brand-cta transition-colors hover:text-[#D4B383]"
                  onClick={() => toast({ title: "Share with team (demo)", tone: "success" })}
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

      <div ref={browseScrollRef} className="relative z-0 min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-4">
        <div
          className={cn(
            "min-h-0",
            mainTab !== "collections" && "pointer-events-none hidden"
          )}
          aria-hidden={mainTab !== "collections"}
        >
          <ProductDirectoryCollectionsTab
            collections={availableCollections}
            products={products}
            teams={MOCK_TEAMS}
            onOpenCollection={(id) => {
              setCollectionFilter([id]);
              trySetMainTab("browse");
            }}
          />
        </div>
        <div
          className={cn(
            "min-h-0",
            mainTab !== "partner-portal" && "pointer-events-none hidden"
          )}
          aria-hidden={mainTab !== "partner-portal"}
        >
          <ProductDirectoryPartnerPortalTab
            key={partnerPortalMountKey}
            products={products}
            teams={MOCK_TEAMS}
            canViewCommissions={canViewCommissions}
            isAdmin={isAdmin}
            onSelectProduct={(id) => setDetailProductId(id)}
            onAdminSaveProgram={saveProgramFromPartnerPortal}
            onDirtyChange={setPartnerPortalDirty}
          />
        </div>
        <div
          className={cn(
            "min-h-0",
            mainTab !== "browse" && "pointer-events-none hidden"
          )}
          aria-hidden={mainTab !== "browse"}
        >
          {compareMode && compareProducts.length >= 2 ? (
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
                  showSavedFromSearch={product.collectionIds.includes(DIRECTORY_EXTERNAL_COLLECTION_ID)}
                  savedFromSearchTitle={externalSearchTooltipForProduct(product.id)}
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
              externalSearchCollectionId={DIRECTORY_EXTERNAL_COLLECTION_ID}
              externalSearchTooltip={externalSearchTooltipForProduct}
              scrollToProductId={detailProductId}
              scrollParentRef={browseScrollRef}
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
              externalSearchCollectionId={DIRECTORY_EXTERNAL_COLLECTION_ID}
              externalSearchTooltip={externalSearchTooltipForProduct}
            />
          )}

          {sortedProducts.length === 0 && (
            <div className="rounded-xl border border-border bg-white/[0.02] p-8 text-center">
              <Search className="mx-auto mb-3 h-6 w-6 text-muted-foreground/65" aria-hidden />
              <p className="mb-1 text-compact font-medium text-foreground">No products match</p>
              <p className="mb-4 text-xs text-muted-foreground">Your current filters are too narrow.</p>
              {emptyStateHint ? (
                <button
                  type="button"
                  onClick={emptyStateHint.onClear}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.12)] bg-[rgba(201,169,110,0.06)] px-3 py-1.5 text-xs text-brand-cta transition-colors hover:bg-[rgba(201,169,110,0.10)]"
                >
                  {`Remove ${emptyStateHint.label} filter → ${emptyStateHint.count} result${emptyStateHint.count === 1 ? "" : "s"}`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.06]"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
            </>
          )}
        </div>
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
        <div className="fixed bottom-20 left-1/2 z-[50] w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-border bg-popover py-1 shadow-2xl">
          <p className="px-3 py-2 text-[9px] uppercase tracking-wider text-muted-foreground/65">
            Add {selectedProductIds.size} products to…
          </p>
          {[...availableCollections]
            .sort((a, b) => Number(!!b.isSystem) - Number(!!a.isSystem))
            .map((col) => (
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
              className="flex w-full items-center gap-1 px-3 py-2 text-left text-xs text-brand-cta transition-colors hover:bg-white/[0.04]"
            >
              + New Collection
            </button>
          </div>
        </div>
      )}

      {selectedProductIds.size > 0 && !compareMode && mainTab === "browse" && (
        <div className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-3 rounded-2xl border border-border bg-popover/95 px-5 py-3 shadow-2xl backdrop-blur-xl">
          <span className="text-sm font-medium text-foreground">{selectedProductIds.size} selected</span>
          <div className="h-5 w-px bg-white/[0.06]" />
          <button
            type="button"
            onClick={() => setBulkCollectionOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.08)] px-3 py-1.5 text-xs text-brand-cta transition-colors hover:bg-[rgba(201,169,110,0.12)]"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Add to Collection
          </button>
          {activeCollectionMeta && canManageProductsInActiveCollection && collectionFilter.length === 1 && (
            <button
              type="button"
              onClick={bulkRemoveFromActiveCollection}
              className="flex items-center gap-1.5 rounded-lg border border-[rgba(166,107,107,0.15)] bg-[rgba(166,107,107,0.08)] px-3 py-1.5 text-xs text-[#A66B6B] transition-colors hover:bg-[rgba(166,107,107,0.12)]"
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
              "flex items-center gap-1.5 rounded-lg border border-white/[0.04] bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground transition-colors disabled:opacity-30",
              selectedProductIds.size >= 2 &&
                selectedProductIds.size <= 4 &&
                "hover:bg-white/[0.06] hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Compare
          </button>
          <button type="button" onClick={clearSelection} className="px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-muted-foreground">
            ✕ Clear
          </button>
        </div>
      )}

      {createCollectionOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-popover p-4">
            <h3 className="text-sm font-semibold text-foreground">Create Collection</h3>
            <p className="mt-1 text-xs text-muted-foreground">Set the basics, then save.</p>
            <div className="mt-3 space-y-2">
              <input
                value={createCollectionName}
                onChange={(e) => setCreateCollectionName(e.target.value)}
                placeholder="Collection name"
                className="w-full rounded-lg border border-border bg-inset px-3 py-2 text-sm text-foreground outline-none"
              />
              <textarea
                value={createCollectionDescription}
                onChange={(e) => setCreateCollectionDescription(e.target.value)}
                rows={2}
                placeholder="Description (optional)"
                className="w-full resize-none rounded-lg border border-border bg-inset px-3 py-2 text-sm text-foreground outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreateCollectionScope("private")}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs",
                    createCollectionScope === "private"
                      ? "border-brand-cta bg-[rgba(201,169,110,0.12)] text-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => setCreateCollectionScope("team")}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs",
                    createCollectionScope === "team"
                      ? "border-brand-cta bg-[rgba(201,169,110,0.12)] text-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  Team
                </button>
              </div>
              {createCollectionScope === "team" ? (
                <select
                  value={createCollectionTeamId}
                  onChange={(e) => setCreateCollectionTeamId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-inset px-3 py-2 text-sm text-foreground outline-none"
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
                className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground"
                onClick={() => setCreateCollectionOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-brand-cta px-3 py-1.5 text-xs font-medium text-[#08080c]"
                onClick={submitCreateCollectionModal}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={tabLeaveDialogOpen}
        onOpenChange={(open) => {
          if (!open) cancelLeavePartnerTab();
        }}
      >
        <DialogContent className="border-border bg-popover text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave Partner portal?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You have unsaved edits. Switching tabs will discard your draft for this session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={cancelLeavePartnerTab}>
              Stay
            </Button>
            <Button type="button" variant="destructive" onClick={confirmLeavePartnerTab}>
              Discard and leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
