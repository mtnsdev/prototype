"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Building2, LayoutGrid, Search, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_LIST_PAGE_HEADER,
  DASHBOARD_LIST_PAGE_HEADER_SUBTITLE,
  DASHBOARD_LIST_PAGE_HEADER_TITLE,
  DASHBOARD_LIST_PAGE_HEADER_TITLE_STACK,
} from "@/lib/dashboardChrome";
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
import AddProductModal from "./Modals/AddProductModal";
import DirectoryProductCard from "./DirectoryProductCard";
import DirectoryProductListView from "./DirectoryProductListView";
import ProductDirectoryDetailPanel from "./ProductDirectoryDetailPanel";
import ProductDirectoryCollectionPicker from "./ProductDirectoryCollectionPicker";
import ProductDirectoryMapSplit from "./ProductDirectoryMapSplit";
import {
  buildPartnerPortalRows,
  ProductDirectoryCollectionsTab,
  ProductDirectoryPartnerPortalTab,
  ProductDirectoryRepFirmsTab,
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
import {
  cloneDirectoryCollectionsForState,
  cloneDirectoryProductsForState,
  cloneRepFirmsForState,
  loadRepFirmsFromStorage,
  persistDirectorySnapshot,
  persistRepFirmsSnapshot,
  repFirmsEqual,
  subscribeRepFirmsRegistry,
} from "./productDirectoryPersistence";
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
import { MOCK_REP_FIRMS } from "./productDirectoryRepFirmMock";
import type { RepFirm, RepFirmProductLink } from "@/types/rep-firm";
import { getProductId } from "@/lib/products-api";

type ProductDirectoryMainTab = "browse" | "collections" | "partner-portal" | "rep-firms";

function maxActiveIncentiveValue(product: DirectoryProduct): number {
  const active = (product.commissionAdvisories ?? []).filter((a) => a.status === "active");
  if (active.length === 0) return -1;
  return active.reduce((best, advisory) => {
    const raw = advisory.incentiveValue ?? 0;
    return raw > best ? raw : best;
  }, -1);
}

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

function clonePartnerProgramTemplate(
  program: DirectoryProduct["partnerPrograms"][number]
): DirectoryProduct["partnerPrograms"][number] {
  return {
    ...program,
    activePromotions: (program.activePromotions ?? []).map((promo) => ({ ...promo })),
    amenityTags: program.amenityTags ? [...program.amenityTags] : undefined,
  };
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
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground/65">VIC amenities</p>
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
  const editorDisplayName = user?.username ?? user?.email?.split("@")[0] ?? "Admin";

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
  const [selectedRepFirmIds, setSelectedRepFirmIds] = useState<string[]>([]);
  const [hasActiveIncentive, setHasActiveIncentive] = useState(false);
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
  const [bulkProgramOpen, setBulkProgramOpen] = useState(false);
  const [bulkRepFirmOpen, setBulkRepFirmOpen] = useState(false);
  const [bulkCollectionSearch, setBulkCollectionSearch] = useState("");
  const [bulkProgramSearch, setBulkProgramSearch] = useState("");
  const [bulkRepFirmSearch, setBulkRepFirmSearch] = useState("");
  const [bulkCollectionTargetIds, setBulkCollectionTargetIds] = useState<string[]>([]);
  const [bulkProgramTargetIds, setBulkProgramTargetIds] = useState<string[]>([]);
  const [bulkRepFirmTargetIds, setBulkRepFirmTargetIds] = useState<string[]>([]);
  const [bulkSuggestionOpen, setBulkSuggestionOpen] = useState(false);
  const [bulkSuggestionAction, setBulkSuggestionAction] = useState<"partner-program" | "rep-firm" | null>(null);
  const [bulkSuggestionNote, setBulkSuggestionNote] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const browseScrollRef = useRef<HTMLDivElement>(null);

  const [mainTab, setMainTab] = useState<ProductDirectoryMainTab>("browse");
  const [partnerPortalDirty, setPartnerPortalDirty] = useState(false);
  const [partnerPortalMountKey, setPartnerPortalMountKey] = useState(0);
  const [repFirmsMountKey, setRepFirmsMountKey] = useState(0);
  const [repFirmsDirty, setRepFirmsDirty] = useState(false);
  const [tabLeaveDialogOpen, setTabLeaveDialogOpen] = useState(false);
  const [pendingMainTab, setPendingMainTab] = useState<ProductDirectoryMainTab | null>(null);

  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [createCollectionFromBulk, setCreateCollectionFromBulk] = useState(false);
  const [createCollectionName, setCreateCollectionName] = useState("");
  const [createCollectionDescription, setCreateCollectionDescription] = useState("");
  const [createCollectionScope, setCreateCollectionScope] = useState<"private" | "team">("private");
  const [createCollectionTeamId, setCreateCollectionTeamId] = useState("");
  const [repFirms, setRepFirms] = useState<RepFirm[]>(() => {
    const loaded = loadRepFirmsFromStorage();
    if (loaded && loaded.length > 0) return cloneRepFirmsForState(loaded);
    return cloneRepFirmsForState(MOCK_REP_FIRMS);
  });

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
        : tab === "rep-firms" || tab === "rep_firms"
          ? "rep-firms"
        : tab === "partner" || tab === "partner-portal"
          ? "partner-portal"
          : "browse";
    setMainTab((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  useEffect(() => {
    const selectedProductId = searchParams.get("selected");
    if (!selectedProductId) return;
    const exists = products.some((product) => product.id === selectedProductId);
    if (!exists) return;
    setMainTab("browse");
    setDetailProductId(selectedProductId);
  }, [products, searchParams]);

  const applyUrlForTab = useCallback(
    (t: ProductDirectoryMainTab) => {
      const p = new URLSearchParams(searchParams.toString());
      if (t === "browse") {
        p.delete("tab");
        p.delete("program");
      } else if (t === "collections") {
        p.set("tab", "collections");
        p.delete("program");
      } else if (t === "rep-firms") {
        p.set("tab", "rep-firms");
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
      const partnerBlocked =
        mainTab === "partner-portal" && t !== "partner-portal" && partnerPortalDirty;
      const repFirmBlocked = mainTab === "rep-firms" && t !== "rep-firms" && repFirmsDirty;
      if (partnerBlocked || repFirmBlocked) {
        setPendingMainTab(t);
        setTabLeaveDialogOpen(true);
        return;
      }
      setMainTab(t);
      applyUrlForTab(t);
    },
    [applyUrlForTab, mainTab, partnerPortalDirty, repFirmsDirty]
  );

  const confirmLeavePartnerTab = useCallback(() => {
    const t = pendingMainTab;
    const leavingPartner = mainTab === "partner-portal";
    const leavingRepFirms = mainTab === "rep-firms";
    setTabLeaveDialogOpen(false);
    setPendingMainTab(null);
    if (leavingPartner) {
      setPartnerPortalMountKey((k) => k + 1);
      setPartnerPortalDirty(false);
    }
    if (leavingRepFirms) {
      setRepFirmsMountKey((k) => k + 1);
      setRepFirmsDirty(false);
    }
    if (t) {
      setMainTab(t);
      applyUrlForTab(t);
    }
  }, [applyUrlForTab, pendingMainTab, mainTab]);

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
    setBulkProgramOpen(false);
    setBulkRepFirmOpen(false);
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

  const repFirmFilterOptions = useMemo(
    () => repFirms.map((f) => ({ id: f.id, name: f.name })),
    [repFirms]
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
      selectedRepFirmIds,
      hasActiveIncentive,
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
      selectedRepFirmIds,
      hasActiveIncentive,
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
    if (f.selectedRepFirmIds.length > 0) {
      push("repFirm", "rep firm filters", () => {
        setSelectedRepFirmIds([]);
      });
    }
    if (f.hasActiveIncentive) push("activeIncentive", "active incentives", () => setHasActiveIncentive(false));
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
    setSelectedRepFirmIds([]);
    setHasActiveIncentive(false);
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
      case "highest-incentive":
        if (!canViewCommissions) {
          list.sort((a, b) => a.name.localeCompare(b.name));
          return list;
        }
        list.sort((a, b) => {
          const ai = maxActiveIncentiveValue(a);
          const bi = maxActiveIncentiveValue(b);
          if (bi !== ai) return bi - ai;
          return a.name.localeCompare(b.name);
        });
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

  const filteredProductIds = useMemo(() => sortedProducts.map((p) => p.id), [sortedProducts]);
  const areAllFilteredSelected =
    filteredProductIds.length > 0 && filteredProductIds.every((productId) => selectedProductIds.has(productId));
  const selectedProgramTemplateById = useMemo(() => {
    const templates = new Map<string, DirectoryProduct["partnerPrograms"][number]>();
    for (const product of products) {
      for (const program of product.partnerPrograms) {
        const key = programFilterId(program);
        if (!templates.has(key)) templates.set(key, clonePartnerProgramTemplate(program));
      }
    }
    return templates;
  }, [products]);
  const partnerProgramTargets = useMemo(
    () =>
      AGENCY_PROGRAM_OPTIONS.map((option) => ({
        id: option.id,
        name: option.name,
        disabled: !selectedProgramTemplateById.has(option.id),
      })),
    [selectedProgramTemplateById]
  );
  const filteredCollectionTargets = useMemo(() => {
    const q = bulkCollectionSearch.trim().toLowerCase();
    const list = [...availableCollections].sort((a, b) => Number(!!b.isSystem) - Number(!!a.isSystem));
    if (!q) return list;
    return list.filter((col) =>
      `${col.name} ${col.teamName ?? ""}`.toLowerCase().includes(q)
    );
  }, [availableCollections, bulkCollectionSearch]);
  const filteredProgramTargets = useMemo(() => {
    const q = bulkProgramSearch.trim().toLowerCase();
    if (!q) return partnerProgramTargets;
    return partnerProgramTargets.filter((program) => program.name.toLowerCase().includes(q));
  }, [partnerProgramTargets, bulkProgramSearch]);
  const filteredRepFirmTargets = useMemo(() => {
    const q = bulkRepFirmSearch.trim().toLowerCase();
    if (!q) return repFirms;
    return repFirms.filter((firm) => firm.name.toLowerCase().includes(q));
  }, [repFirms, bulkRepFirmSearch]);
  const hiddenSelectedCount = selectedProductIds.size - filteredProductIds.filter((id) => selectedProductIds.has(id)).length;

  const openBulkSuggestion = useCallback(
    (action: "partner-program" | "rep-firm") => {
      setBulkProgramOpen(false);
      setBulkRepFirmOpen(false);
      setBulkSuggestionAction(action);
      setBulkSuggestionNote("");
      setBulkSuggestionOpen(true);
    },
    []
  );

  const applyBulkPartnerPrograms = useCallback(() => {
    const targetKeys = new Set(bulkProgramTargetIds);
    if (targetKeys.size === 0) {
      toast({ title: "Select at least one partner program", tone: "destructive" });
      return;
    }
    const selectedIds = Array.from(selectedProductIds);
    if (selectedIds.length === 0) return;
    if (!isAdmin) {
      openBulkSuggestion("partner-program");
      return;
    }

    let changedProducts = 0;
    setProducts((prev) =>
      prev.map((product) => {
        if (!selectedProductIds.has(product.id)) return product;
        const currentByKey = new Map(product.partnerPrograms.map((program) => [programFilterId(program), program]));
        const nextPrograms: DirectoryProduct["partnerPrograms"] = product.partnerPrograms.map((program) =>
          clonePartnerProgramTemplate(program)
        );
        for (const key of targetKeys) {
          if (currentByKey.has(key)) continue;
          const template = selectedProgramTemplateById.get(key);
          if (template) nextPrograms.push(clonePartnerProgramTemplate(template));
        }
        const prevKeys = product.partnerPrograms.map((program) => programFilterId(program)).sort().join("|");
        const nextKeys = nextPrograms.map((program) => programFilterId(program)).sort().join("|");
        if (prevKeys === nextKeys) return product;
        changedProducts += 1;
        return {
          ...product,
          partnerPrograms: nextPrograms,
          partnerProgramCount: nextPrograms.length,
        };
      })
    );

    toast({
      title:
        changedProducts === 0
          ? "No partner program changes needed"
          : `Updated partner programs on ${changedProducts} product${changedProducts === 1 ? "" : "s"}`,
      tone: "success",
    });
    setBulkProgramOpen(false);
    clearSelection();
  }, [bulkProgramTargetIds, selectedProductIds, isAdmin, openBulkSuggestion, selectedProgramTemplateById, toast, clearSelection]);

  const applyBulkRepFirms = useCallback(() => {
    const targetIds = new Set(bulkRepFirmTargetIds);
    if (targetIds.size === 0) {
      toast({ title: "Select at least one rep firm", tone: "destructive" });
      return;
    }
    if (selectedProductIds.size === 0) return;
    if (!isAdmin) {
      openBulkSuggestion("rep-firm");
      return;
    }

    const repFirmById = new Map(repFirms.map((firm) => [firm.id, firm]));
    const now = new Date().toISOString();
    let changedProducts = 0;
    setProducts((prev) =>
      prev.map((product) => {
        if (!selectedProductIds.has(product.id)) return product;
        const existingByFirmId = new Map((product.repFirmLinks ?? []).map((link) => [link.repFirmId, link]));
        const nextLinks: RepFirmProductLink[] = [...(product.repFirmLinks ?? [])];
        for (const repFirmId of targetIds) {
          const existing = existingByFirmId.get(repFirmId);
          if (existing) {
            continue;
          }
          const firm = repFirmById.get(repFirmId);
          if (!firm) continue;
          nextLinks.push({
            id: `rfl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            repFirmId,
            repFirmName: firm.name,
            scope: firm.scope,
            status: firm.status,
            contactName: firm.contactName,
            contactEmail: firm.contactEmail,
            contactPhone: firm.contactPhone,
            lastEditedAt: now,
            lastEditedByName: editorDisplayName,
          });
        }
        const prevKeys = (product.repFirmLinks ?? []).map((link) => link.repFirmId).sort().join("|");
        const nextKeys = nextLinks.map((link) => link.repFirmId).sort().join("|");
        if (prevKeys === nextKeys) return product;
        changedProducts += 1;
        return {
          ...product,
          repFirmLinks: nextLinks,
          repFirmCount: nextLinks.length,
        };
      })
    );

    toast({
      title:
        changedProducts === 0
          ? "No rep firm changes needed"
          : `Updated rep firms on ${changedProducts} product${changedProducts === 1 ? "" : "s"}`,
      tone: "success",
    });
    setBulkRepFirmOpen(false);
    clearSelection();
  }, [bulkRepFirmTargetIds, selectedProductIds, isAdmin, repFirms, editorDisplayName, toast, clearSelection, openBulkSuggestion]);

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

  const syncRepFirmProductLinks = useCallback(
    (args: {
      repFirmId: string;
      attachedProductIds: string[];
      firmName: string;
      firmScope: string;
      firmStatus: "active" | "inactive";
      usePerProductContacts: boolean;
      perProductContacts: Record<
        string,
        { contactName: string; contactEmail: string; contactPhone: string; notes: string }
      >;
      firmContact: { contactName?: string; contactEmail?: string; contactPhone?: string };
    }) => {
      const editorName = editorDisplayName;
      const attachedSet = new Set(args.attachedProductIds);
      const now = new Date().toISOString();
      const scopeVal = args.firmScope === "enable" ? "enable" : args.firmScope;

      setProducts((prev) =>
        prev.map((p) => {
          const links = [...(p.repFirmLinks ?? [])];
          const idx = links.findIndex((l) => l.repFirmId === args.repFirmId);
          if (p.type === "rep_firm") {
            if (idx < 0) return p;
            const nextLinks = links.filter((l) => l.repFirmId !== args.repFirmId);
            return { ...p, repFirmLinks: nextLinks, repFirmCount: nextLinks.length };
          }
          const shouldAttach = attachedSet.has(p.id);

          if (!shouldAttach) {
            if (idx < 0) return p;
            const nextLinks = links.filter((l) => l.repFirmId !== args.repFirmId);
            return { ...p, repFirmLinks: nextLinks, repFirmCount: nextLinks.length };
          }

          if (idx < 0) {
            const row = args.usePerProductContacts ? args.perProductContacts[p.id] : undefined;
            const newLink: RepFirmProductLink = {
              id: `rfl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              repFirmId: args.repFirmId,
              repFirmName: args.firmName,
              scope: scopeVal,
              status: args.firmStatus,
              ...(args.usePerProductContacts && row
                ? {
                    contactName: row.contactName.trim() || undefined,
                    contactEmail: row.contactEmail.trim() || undefined,
                    contactPhone: row.contactPhone.trim() || undefined,
                    notes: row.notes.trim() || undefined,
                  }
                : {
                    contactName: args.firmContact.contactName,
                    contactEmail: args.firmContact.contactEmail,
                    contactPhone: args.firmContact.contactPhone,
                  }),
              lastEditedAt: now,
              lastEditedByName: editorName,
            };
            const nextLinks = [...links, newLink];
            return { ...p, repFirmLinks: nextLinks, repFirmCount: nextLinks.length };
          }

          const existing = links[idx];
          const row = args.usePerProductContacts ? args.perProductContacts[p.id] : undefined;
          const contactPatch =
            args.usePerProductContacts && row
              ? {
                  contactName: row.contactName.trim() || undefined,
                  contactEmail: row.contactEmail.trim() || undefined,
                  contactPhone: row.contactPhone.trim() || undefined,
                  notes: row.notes.trim() || undefined,
                }
              : {
                  contactName: args.firmContact.contactName,
                  contactEmail: args.firmContact.contactEmail,
                  contactPhone: args.firmContact.contactPhone,
                  notes: existing.notes,
                };

          const merged: RepFirmProductLink = {
            ...existing,
            repFirmName: args.firmName,
            scope: scopeVal,
            status: args.firmStatus,
            ...contactPatch,
            lastEditedAt: now,
            lastEditedByName: editorName,
          };
          const nextLinks = links.map((l, i) => (i === idx ? merged : l));
          return { ...p, repFirmLinks: nextLinks, repFirmCount: nextLinks.length };
        })
      );
    },
    [editorDisplayName]
  );

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
    (colIds: string[]) => {
      const targetIds = new Set(colIds);
      if (targetIds.size === 0) {
        toast({ title: "Select at least one collection", tone: "destructive" });
        return;
      }
      const targetNames = directoryCollections
        .filter((collection) => targetIds.has(collection.id))
        .map((collection) => collection.name);
      const ids = Array.from(selectedProductIds);
      let changedProducts = 0;
      setDirectoryCollections((prev) => {
        let catalog = prev;
        for (const pid of ids) {
          const p = products.find((x) => x.id === pid);
          if (!p) continue;
          let productChanged = false;
          const nextIds = [...p.collectionIds];
          for (const colId of targetIds) {
            if (nextIds.includes(colId)) continue;
            nextIds.push(colId);
            productChanged = true;
            catalog = catalog.map((c) =>
              c.id === colId && !(c.productIds ?? []).includes(pid)
                ? { ...c, productIds: [...(c.productIds ?? []), pid] }
                : c
            );
          }
          if (!productChanged) continue;
          const refs = buildDirectoryCollectionRefs(nextIds, catalog);
          patchProduct(pid, { collectionIds: nextIds, collections: refs, collectionCount: nextIds.length });
          changedProducts += 1;
        }
        return catalog;
      });
      toast({
        title:
          changedProducts === 0
            ? "No collection changes needed"
            : `Added ${changedProducts} product${changedProducts !== 1 ? "s" : ""} to ${targetNames.length === 1 ? targetNames[0] : `${targetNames.length} collections`}`,
        tone: "success",
      });
      setBulkCollectionOpen(false);
      setBulkCollectionTargetIds([]);
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
      <header className={DASHBOARD_LIST_PAGE_HEADER}>
        <div className={DASHBOARD_LIST_PAGE_HEADER_TITLE_STACK}>
          <h1 className={DASHBOARD_LIST_PAGE_HEADER_TITLE}>Product Directory</h1>
          <p className={DASHBOARD_LIST_PAGE_HEADER_SUBTITLE}>
            {mainTab === "browse"
              ? `${sortedProducts.length} product${sortedProducts.length !== 1 ? "s" : ""}`
              : mainTab === "collections"
                ? `${availableCollections.length} collection${availableCollections.length !== 1 ? "s" : ""}`
                : mainTab === "rep-firms"
                  ? `${repFirms.length} rep firm${repFirms.length !== 1 ? "s" : ""}`
                : `${portalRowCount} program${portalRowCount !== 1 ? "s" : ""} · rates, linked properties & incentives`}
          </p>
        </div>
      </header>

      <div className="flex shrink-0 gap-0.5 border-b border-border pl-6 pr-[4.5rem]">
        {(
          [
            { id: "browse" as const, label: "Products" },
            { id: "collections" as const, label: "Collections" },
            { id: "rep-firms" as const, label: "Rep Firms" },
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
        onAddProduct={() => setAddProductModalOpen(true)}
        collections={availableCollections}
        selectedProgramIds={selectedProgramIds}
        onSelectedProgramIdsChange={setSelectedProgramIds}
        repFirmFilterOptions={repFirmFilterOptions}
        selectedRepFirmIds={selectedRepFirmIds}
        onSelectedRepFirmIdsChange={setSelectedRepFirmIds}
        selectedAmenities={selectedAmenities}
        onSelectedAmenitiesChange={setSelectedAmenities}
        commissionRange={commissionRange}
        onCommissionRangeChange={setCommissionRange}
        commissionFilterActive={commissionFilterActive}
        onCommissionFilterActiveChange={setCommissionFilterActive}
        hasActiveIncentive={hasActiveIncentive}
        onHasActiveIncentiveChange={setHasActiveIncentive}
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
        selectedRepFirmIds.length > 0 ||
        selectedAmenities.length > 0 ||
        (canViewCommissions && commissionFilterActive) ||
        hasActiveIncentive ||
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
          {hasActiveIncentive ? (
            <button
              type="button"
              onClick={() => setHasActiveIncentive(false)}
              className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] text-amber-400 transition-colors hover:bg-amber-500/20"
            >
              Active incentives
              <span className="text-muted-foreground">✕</span>
            </button>
          ) : null}
          {selectedRepFirmIds.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedRepFirmIds([])}
              className="flex max-w-[min(100%,280px)] items-center gap-1 truncate rounded-full bg-[rgba(176,122,91,0.12)] px-2 py-0.5 text-[9px] text-[#B07A5B] transition-colors hover:bg-[rgba(176,122,91,0.18)]"
            >
              <span className="min-w-0 truncate">
                {selectedRepFirmIds
                  .map((id) => repFirms.find((f) => f.id === id)?.name ?? id)
                  .slice(0, 3)
                  .join(", ")}
                {selectedRepFirmIds.length > 3 ? ` +${selectedRepFirmIds.length - 3}` : ""}
              </span>
              <span className="shrink-0 text-muted-foreground">✕</span>
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
            onNewCollection={() => openCreateCollectionModal("general")}
          />
        </div>
        <div
          className={cn(
            "min-h-0",
            mainTab !== "rep-firms" && "pointer-events-none hidden"
          )}
          aria-hidden={mainTab !== "rep-firms"}
        >
          <ProductDirectoryRepFirmsTab
            key={repFirmsMountKey}
            repFirms={repFirms}
            products={products}
            teams={MOCK_TEAMS}
            isAdmin={isAdmin}
            editorDisplayName={editorDisplayName}
            canViewCommissions={canViewCommissions}
            externalSearchCollectionId={DIRECTORY_EXTERNAL_COLLECTION_ID}
            getExternalSearchTooltip={externalSearchTooltipForProduct}
            onSaveRepFirm={(id, patch) =>
              setRepFirms((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
            }
            onAddRepFirm={(firm) => setRepFirms((prev) => [firm, ...prev])}
            onRemoveRepFirm={(id) => {
              setRepFirms((prev) => prev.filter((f) => f.id !== id));
              setProducts((prev) =>
                prev.map((p) => {
                  const nextLinks = (p.repFirmLinks ?? []).filter((l) => l.repFirmId !== id);
                  if (nextLinks.length === (p.repFirmLinks ?? []).length) return p;
                  return { ...p, repFirmLinks: nextLinks, repFirmCount: nextLinks.length };
                })
              );
            }}
            onSelectProduct={(id) => {
              trySetMainTab("browse");
              setDetailProductId(id);
            }}
            onOpenCollectionPicker={(id) => {
              trySetMainTab("browse");
              setPickerProductId(id);
            }}
            onBrowseByRepFirm={(repFirmId) => {
              setSelectedRepFirmIds([repFirmId]);
              trySetMainTab("browse");
            }}
            onSyncRepFirmProductLinks={syncRepFirmProductLinks}
            onDirtyChange={setRepFirmsDirty}
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
          repFirmsRegistry={repFirms}
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
          onClick={() => {
            setBulkCollectionOpen(false);
            setBulkCollectionTargetIds([]);
          }}
        />
      )}
      {bulkProgramOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[45] cursor-default bg-black/20"
          aria-label="Close menu"
          onClick={() => setBulkProgramOpen(false)}
        />
      )}
      {bulkRepFirmOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[45] cursor-default bg-black/20"
          aria-label="Close menu"
          onClick={() => setBulkRepFirmOpen(false)}
        />
      )}

      {bulkCollectionOpen && (
        <div className="fixed bottom-20 left-1/2 z-[50] w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-border bg-popover py-1 shadow-2xl">
          <p className="px-3 py-2 text-[9px] uppercase tracking-wider text-muted-foreground/65">
            Add {selectedProductIds.size} products to…
          </p>
          <div className="px-3 pb-2">
            <input
              value={bulkCollectionSearch}
              onChange={(e) => setBulkCollectionSearch(e.target.value)}
              placeholder="Search collections…"
              className="w-full rounded-md border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
            />
          </div>
          {filteredCollectionTargets.map((col) => (
              <label
                key={col.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs text-[#C8C0B8] transition-colors hover:bg-white/[0.04]"
              >
                <input
                  type="checkbox"
                  checked={bulkCollectionTargetIds.includes(col.id)}
                  onChange={() =>
                    setBulkCollectionTargetIds((prev) =>
                      prev.includes(col.id) ? prev.filter((id) => id !== col.id) : [...prev, col.id]
                    )
                  }
                  className="checkbox-on-dark"
                />
                {col.teamName ? `[${col.teamName}] ${col.name}` : col.name}
              </label>
            ))}
          {filteredCollectionTargets.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No collections found.</p>
          ) : null}
          <div className="mt-1 border-t border-white/[0.04] pt-1">
            <div className="flex justify-end gap-2 px-3 pb-1">
              <button
                type="button"
                className="px-2 py-1 text-xs text-muted-foreground"
                onClick={() => {
                  setBulkCollectionOpen(false);
                  setBulkCollectionTargetIds([]);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkCollectionTargetIds.length === 0}
                className="rounded-lg border border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] px-2.5 py-1 text-xs text-brand-cta disabled:opacity-50"
                onClick={() => addBulkToCollection(bulkCollectionTargetIds)}
              >
                Apply
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setBulkCollectionOpen(false);
                setBulkCollectionTargetIds([]);
                openCreateCollectionModal("bulk");
              }}
              className="flex w-full items-center gap-1 px-3 py-2 text-left text-xs text-brand-cta transition-colors hover:bg-white/[0.04]"
            >
              + New Collection
            </button>
          </div>
        </div>
      )}

      {bulkProgramOpen && (
        <div className="fixed bottom-20 left-1/2 z-[50] w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-border bg-popover p-3 shadow-2xl">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/65">Add to partner programs…</p>
          <input
            value={bulkProgramSearch}
            onChange={(e) => setBulkProgramSearch(e.target.value)}
            placeholder="Search partner programs"
            className="mt-2 w-full rounded-md border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
          />
          <div className="mt-2 max-h-56 space-y-1 overflow-auto">
            {filteredProgramTargets.map((program) => (
              <label
                key={program.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs",
                  program.disabled ? "opacity-50" : "cursor-pointer hover:bg-white/[0.04]"
                )}
              >
                <input
                  type="checkbox"
                  disabled={program.disabled}
                  checked={bulkProgramTargetIds.includes(program.id)}
                  onChange={() =>
                    setBulkProgramTargetIds((prev) =>
                      prev.includes(program.id) ? prev.filter((id) => id !== program.id) : [...prev, program.id]
                    )
                  }
                  className="checkbox-on-dark"
                />
                <span>{program.name}</span>
              </label>
            ))}
            {filteredProgramTargets.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No partner programs found.</p>
            ) : null}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="px-2 py-1 text-xs text-muted-foreground" onClick={() => setBulkProgramOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={bulkProgramTargetIds.length === 0}
              className="rounded-lg border border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] px-2.5 py-1 text-xs text-brand-cta"
              onClick={applyBulkPartnerPrograms}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {bulkRepFirmOpen && (
        <div className="fixed bottom-20 left-1/2 z-[50] w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-border bg-popover p-3 shadow-2xl">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/65">Add to rep firms…</p>
          <input
            value={bulkRepFirmSearch}
            onChange={(e) => setBulkRepFirmSearch(e.target.value)}
            placeholder="Search rep firms"
            className="mt-2 w-full rounded-md border border-border bg-inset px-2 py-1.5 text-xs text-foreground outline-none"
          />
          <div className="mt-2 max-h-56 space-y-1 overflow-auto">
            {filteredRepFirmTargets.map((firm) => (
              <label key={firm.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white/[0.04]">
                <input
                  type="checkbox"
                  checked={bulkRepFirmTargetIds.includes(firm.id)}
                  onChange={() =>
                    setBulkRepFirmTargetIds((prev) =>
                      prev.includes(firm.id) ? prev.filter((id) => id !== firm.id) : [...prev, firm.id]
                    )
                  }
                  className="checkbox-on-dark"
                />
                <span>{firm.name}</span>
              </label>
            ))}
            {filteredRepFirmTargets.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No rep firms found.</p>
            ) : null}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="px-2 py-1 text-xs text-muted-foreground" onClick={() => setBulkRepFirmOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={bulkRepFirmTargetIds.length === 0}
              className="rounded-lg border border-[rgba(201,169,110,0.20)] bg-[rgba(201,169,110,0.08)] px-2.5 py-1 text-xs text-brand-cta"
              onClick={applyBulkRepFirms}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {selectedProductIds.size > 0 && !compareMode && mainTab === "browse" && (
        <div className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center gap-3 rounded-2xl border border-border bg-popover/95 px-5 py-3 shadow-2xl backdrop-blur-xl">
          <span className="text-sm font-medium text-foreground">{selectedProductIds.size} selected</span>
          {hiddenSelectedCount > 0 ? (
            <span className="text-2xs text-muted-foreground">
              {hiddenSelectedCount} selected outside current filters
            </span>
          ) : null}
          <div className="h-5 w-px bg-white/[0.06]" />
          <button
            type="button"
            onClick={() => setBulkCollectionOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.08)] px-3 py-1.5 text-xs text-brand-cta transition-colors hover:bg-[rgba(201,169,110,0.12)]"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Add to Collection
          </button>
          <button
            type="button"
            onClick={() => {
              setBulkCollectionOpen(false);
              setBulkRepFirmOpen(false);
              setBulkCollectionTargetIds([]);
              setBulkProgramTargetIds([]);
              setBulkProgramOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.08)] px-3 py-1.5 text-xs text-brand-cta transition-colors hover:bg-[rgba(201,169,110,0.12)]"
          >
            <Building2 className="h-3.5 w-3.5" />
            Add Partner Program
          </button>
          <button
            type="button"
            onClick={() => {
              setBulkCollectionOpen(false);
              setBulkProgramOpen(false);
              setBulkCollectionTargetIds([]);
              setBulkRepFirmTargetIds([]);
              setBulkRepFirmOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(201,169,110,0.15)] bg-[rgba(201,169,110,0.08)] px-3 py-1.5 text-xs text-brand-cta transition-colors hover:bg-[rgba(201,169,110,0.12)]"
          >
            <Users className="h-3.5 w-3.5" />
            Add Rep Firm
          </button>
          <button
            type="button"
            onClick={() => {
              if (areAllFilteredSelected) {
                setSelectedProductIds(new Set());
                return;
              }
              setSelectedProductIds(new Set(filteredProductIds));
            }}
            className="rounded-lg border border-white/[0.04] bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            {areAllFilteredSelected ? "Clear filtered" : `Select all filtered (${filteredProductIds.length})`}
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

      <AddProductModal
        open={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        product={null}
        onSaved={() => setAddProductModalOpen(false)}
        onCreated={(p) => {
          const id = String(getProductId(p) ?? "").trim();
          if (id) router.push(`/dashboard/products/${id}`);
        }}
      />

      <Dialog
        open={bulkSuggestionOpen}
        onOpenChange={(open) => {
          setBulkSuggestionOpen(open);
          if (!open) setBulkSuggestionNote("");
        }}
      >
        <DialogContent className="border-border bg-popover text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest bulk update</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You do not have direct edit access. Submit this request for admin review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Action: {bulkSuggestionAction === "rep-firm" ? "Add to rep firms" : "Add to partner programs"} on {selectedProductIds.size} selected products.
            </p>
            <textarea
              value={bulkSuggestionNote}
              onChange={(e) => setBulkSuggestionNote(e.target.value)}
              rows={3}
              placeholder="Add context for admin review"
              className="w-full resize-none rounded-lg border border-border bg-inset px-3 py-2 text-xs text-foreground outline-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBulkSuggestionOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!bulkSuggestionNote.trim()) {
                  toast({ title: "Add a short note for admins", tone: "destructive" });
                  return;
                }
                toast({
                  title: "Suggestion submitted for admin review",
                  tone: "success",
                });
                setBulkSuggestionOpen(false);
                clearSelection();
              }}
            >
              Submit suggestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={tabLeaveDialogOpen}
        onOpenChange={(open) => {
          if (!open) cancelLeavePartnerTab();
        }}
      >
        <DialogContent className="border-border bg-popover text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You have unsaved edits on this tab. Switching away will discard your draft for this session.
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
