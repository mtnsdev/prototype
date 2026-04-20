/**
 * ProductDetailPage — Canonical full-detail product view
 *
 * This component renders TWO different detail views depending on the product type:
 *
 * 1. DirectoryProduct (directory view) — sidebar preview in product directory
 *    Routed via: /dashboard/products/[id] when viewing a DirectoryProduct
 *    Features: Focused summary, collection management, quick actions
 *    Related: ProductDirectoryDetailPanel is a simpler modal preview variant of this view
 *
 * 2. Product (standard product) — full comprehensive view with all metadata
 *    Routed via: /dashboard/products/[id] when viewing a standard Product
 *    Features: Hero image, full details, edit/delete/copy actions, layers, verification
 *    Note: This is the richer, full-featured view
 *
 * Architecture pattern:
 * - This page is the CANONICAL detail view (not a modal, not sidebar)
 * - ProductDirectoryDetailPanel is intentionally SIMPLER — use it as a preview/summary
 * - From the directory modal: ProductDirectoryDetailPanel has a "View full detail →" link
 * - To edit: Click Edit button on this page, which opens AddProductModal
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/types/product";
import type {
  DirectoryCollectionOption,
  DirectoryProduct,
  NewDirectoryCollectionInput,
} from "@/types/product-directory";
import type { RepFirm } from "@/types/rep-firm";
import { fetchProduct, getProductId } from "@/lib/products-api";
import { FAKE_PRODUCTS } from "../fakeData";
import {
  buildDirectoryCollectionRefs,
  cloneDirectoryProduct,
  cloneMockDirectoryCatalogForAdvisor,
  DIRECTORY_EXTERNAL_COLLECTION_ID,
  DIRECTORY_EXTERNAL_SEARCH_MOCK_SEED_ADVISOR_ID,
  getDirectoryProductById,
  MOCK_DIRECTORY_PRODUCTS,
} from "../productDirectoryMock";
import { MOCK_REP_FIRMS } from "../productDirectoryRepFirmMock";
import {
  cloneRepFirmsForState,
  loadRepFirmsFromStorage,
  repFirmsEqual,
  subscribeRepFirmsRegistry,
} from "../productDirectoryPersistence";
import { resolveAdvisorCatalogFromStorage } from "../productDirectoryCatalogResolve";
import { useProductDirectoryCatalog } from "../ProductDirectoryCatalogContext";
import { useUser } from "@/contexts/UserContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/contexts/ToastContext";
import { canEditProduct, canDeleteProduct, canViewFinancials } from "@/utils/productPermissions";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  COUNTRY_NAMES,
  DATA_LAYER_BADGES,
  PARTNERSHIP_TIER_LABELS,
  PRICE_RANGE_DISPLAY,
  VERIFICATION_BADGES,
} from "@/config/productCategoryConfig";
import { Button } from "@/components/ui/button";
import DeleteProductModal from "../Modals/DeleteProductModal";
import AddProductModal from "../Modals/AddProductModal";
import CopyToAgencyModal from "../Modals/CopyToAgencyModal";
import EnrichProductModal from "../Modals/EnrichProductModal";
import AddToItineraryModal from "../Modals/AddToItineraryModal";
import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import type { ProductCategory } from "@/types/product";
import { ProductDetailLayers } from "./ProductDetailLayers";
import { getProductLayerMock } from "./productLayerMock";
import { ProductDirectoryDetailBody } from "../ProductDirectoryDetailBody";
import ProductDirectoryCollectionPicker from "../ProductDirectoryCollectionPicker";
import { MOCK_TEAMS } from "@/lib/teamsMock";
import type { Team } from "@/types/teams";
import { programFilterId } from "../productDirectoryCommission";
import { usePartnerProgramsOptional } from "@/contexts/PartnerProgramsContext";
import { applyPartnerRegistryToProduct } from "@/lib/partnerProgramMerge";

type Props = { productId: string };

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

const DIRECTORY_DETAIL_SEED_NAME = "Janet";

export default function ProductDetailPage({ productId }: Props) {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { isAdmin, canViewCommissions } = usePermissions();
  const toast = useToast();
  const { catalogRevision, patchPersistedDirectory } = useProductDirectoryCatalog();

  const [directoryProduct, setDirectoryProduct] = useState<DirectoryProduct | null>(null);

  const isCatalogDirectoryProduct = useMemo(() => {
    if (!productId) return false;
    const advisorUid = String(user?.id ?? "1");
    const advisorName = user?.username ?? user?.email?.split("@")[0] ?? "You";
    const { products } = resolveAdvisorCatalogFromStorage(advisorUid, advisorName);
    return products.some((p) => p.id === productId) || Boolean(getDirectoryProductById(productId));
  }, [productId, user?.id, user?.username, user?.email, catalogRevision]);

  useEffect(() => {
    if (userLoading) return;
    const advisorUid = String(user?.id ?? "1");
    const advisorName = user?.username ?? user?.email?.split("@")[0] ?? "You";
    const { products } = resolveAdvisorCatalogFromStorage(advisorUid, advisorName);
    const fromResolved = products.find((p) => p.id === productId);
    const d = fromResolved ?? getDirectoryProductById(productId);
    if (!d) {
      setDirectoryProduct(null);
      return;
    }
    let p = cloneDirectoryProduct(d);
    if (
      advisorUid !== DIRECTORY_EXTERNAL_SEARCH_MOCK_SEED_ADVISOR_ID &&
      p.collectionIds.includes(DIRECTORY_EXTERNAL_COLLECTION_ID)
    ) {
      const nextIds = p.collectionIds.filter((id) => id !== DIRECTORY_EXTERNAL_COLLECTION_ID);
      const nextRefs = p.collections.filter((x) => x.id !== DIRECTORY_EXTERNAL_COLLECTION_ID);
      p = { ...p, collectionIds: nextIds, collections: nextRefs, collectionCount: nextIds.length };
    }
    setDirectoryProduct(p);
  }, [productId, userLoading, user?.id, user?.username, user?.email, catalogRevision]);

  useEffect(() => {
    return subscribeRepFirmsRegistry(() => {
      setRepFirmsRegistry((prev) => {
        const next = loadRepFirmsFromStorage();
        if (!next || next.length === 0) return prev;
        const cloned = cloneRepFirmsForState(next);
        return repFirmsEqual(prev, cloned) ? prev : cloned;
      });
    });
  }, []);

  const uid = user ? String(user.id) : "1";

  const [pickerOpen, setPickerOpen] = useState(false);
  const [repFirmsRegistry, setRepFirmsRegistry] = useState<RepFirm[]>(() => {
    const loaded = loadRepFirmsFromStorage();
    if (loaded && loaded.length > 0) return cloneRepFirmsForState(loaded);
    return cloneRepFirmsForState(MOCK_REP_FIRMS);
  });
  const [directoryCollections, setDirectoryCollections] = useState<DirectoryCollectionOption[]>(() =>
    cloneMockDirectoryCatalogForAdvisor("1", DIRECTORY_DETAIL_SEED_NAME).collections
  );

  useEffect(() => {
    if (userLoading) return;
    const advisorUid = String(user?.id ?? "1");
    const advisorName = user?.username ?? user?.email?.split("@")[0] ?? "You";
    const { directoryCollections: cols } = resolveAdvisorCatalogFromStorage(advisorUid, advisorName);
    setDirectoryCollections(cols);
  }, [userLoading, user?.id, user?.username, user?.email, catalogRevision]);

  const availableCollections = useMemo(
    () => filterCollectionsForUser(uid, directoryCollections, MOCK_TEAMS),
    [uid, directoryCollections]
  );

  const patchDirectoryProduct = useCallback(
    (
      id: string,
      patch: Partial<DirectoryProduct>,
      persistOptions?: { replaceCollections?: DirectoryCollectionOption[] }
    ) => {
      setDirectoryProduct((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
      patchPersistedDirectory(id, patch, persistOptions);
    },
    [patchPersistedDirectory]
  );

  const saveDirectoryCollections = useCallback(
    (selectedIds: string[]) => {
      if (!directoryProduct) return;
      const pid = directoryProduct.id;
      setDirectoryCollections((prev) => {
        const next = prev.map((c) => {
          const inSet = selectedIds.includes(c.id);
          const base = [...(c.productIds ?? [])];
          const has = base.includes(pid);
          if (inSet && !has) return { ...c, productIds: [...base, pid] };
          if (!inSet && has) return { ...c, productIds: base.filter((x) => x !== pid) };
          return c;
        });
        const refs = buildDirectoryCollectionRefs(selectedIds, next);
        const productPatch = {
          collectionIds: selectedIds,
          collections: refs,
          collectionCount: selectedIds.length,
        };
        setDirectoryProduct((dp) => (dp && dp.id === pid ? { ...dp, ...productPatch } : dp));
        patchPersistedDirectory(pid, productPatch, { replaceCollections: next });
        return next;
      });
      setPickerOpen(false);
      toast({ title: "Collections updated", tone: "success" });
    },
    [directoryProduct, patchPersistedDirectory, toast]
  );

  const createDirectoryCollectionDetail = useCallback(
    (input: NewDirectoryCollectionInput): string => {
      if (!directoryProduct) return "";
      const trimmed = input.name.trim();
      if (!trimmed) return "";
      if (input.scope === "team" && !input.teamId) return "";

      const id = `col_${Date.now()}`;
      const ownerName = user?.username ?? user?.email?.split("@")[0] ?? "You";
      const pid = directoryProduct.id;

      let newCol: DirectoryCollectionOption;
      if (input.scope === "private") {
        newCol = {
          id,
          name: trimmed,
          description: input.description?.trim() || undefined,
          scope: "private",
          ownerId: uid,
          ownerName,
          teamId: null,
          productIds: [pid],
        };
      } else {
        const tid = input.teamId as string;
        newCol = {
          id,
          name: trimmed,
          description: input.description?.trim() || undefined,
          scope: "team",
          ownerId: uid,
          ownerName,
          teamId: tid,
          teamName: MOCK_TEAMS.find((t) => t.id === tid)?.name,
          productIds: [pid],
        };
      }

      setDirectoryCollections((prev) => {
        const nextCols = [...prev, newCol];
        const nextIds = [...directoryProduct.collectionIds, id];
        const refs = buildDirectoryCollectionRefs(nextIds, nextCols);
        const productPatch = {
          collectionIds: nextIds,
          collections: refs,
          collectionCount: nextIds.length,
        };
        setDirectoryProduct((dp) => (dp && dp.id === pid ? { ...dp, ...productPatch } : dp));
        patchPersistedDirectory(pid, productPatch, { replaceCollections: nextCols });
        return nextCols;
      });
      toast({ title: `Created “${newCol.name}”`, tone: "success" });
      return id;
    },
    [directoryProduct, uid, user, toast, patchPersistedDirectory]
  );

  const handleQuickAddDirectoryCollection = useCallback(
    (collectionId: string) => {
      if (!directoryProduct || directoryProduct.collectionIds.includes(collectionId)) return;
      const nextIds = [...directoryProduct.collectionIds, collectionId];
      const pid = directoryProduct.id;
      setDirectoryCollections((prev) => {
        const next = prev.map((c) =>
          c.id === collectionId && !(c.productIds ?? []).includes(pid)
            ? { ...c, productIds: [...(c.productIds ?? []), pid] }
            : c
        );
        const refs = buildDirectoryCollectionRefs(nextIds, next);
        const productPatch = {
          collectionIds: nextIds,
          collections: refs,
          collectionCount: nextIds.length,
        };
        setDirectoryProduct((dp) => (dp && dp.id === pid ? { ...dp, ...productPatch } : dp));
        patchPersistedDirectory(pid, productPatch, { replaceCollections: next });
        return next;
      });
    },
    [directoryProduct, patchPersistedDirectory]
  );

  const canRemoveFromCollectionDir = useCallback(
    (collectionId: string) => {
      if (isAdmin) return true;
      const c = directoryCollections.find((x) => x.id === collectionId);
      if (!c) return false;
      if (c.scope === "team") return false;
      if (c.isSystem && c.scope === "private") return c.ownerId === uid;
      return c.ownerId === uid;
    },
    [isAdmin, uid, directoryCollections]
  );
  const allCatalogProducts = useMemo(() => {
    const advisorUid = String(user?.id ?? "1");
    const advisorName = user?.username ?? user?.email?.split("@")[0] ?? "You";
    return resolveAdvisorCatalogFromStorage(advisorUid, advisorName).products;
  }, [user?.id, user?.username, user?.email, catalogRevision]);

  const customProgramKeys = useMemo(
    () => (directoryProduct ? customProgramKeysForProduct(directoryProduct, allCatalogProducts) : []),
    [directoryProduct, allCatalogProducts]
  );

  const partnerProgramsCtx = usePartnerProgramsOptional();
  const directoryProductView = useMemo(() => {
    if (!directoryProduct) return null;
    if (!partnerProgramsCtx) return directoryProduct;
    return applyPartnerRegistryToProduct(directoryProduct, partnerProgramsCtx.snapshot);
  }, [directoryProduct, partnerProgramsCtx]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalProduct, setEditModalProduct] = useState<Product | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [enrichModalOpen, setEnrichModalOpen] = useState(false);
  const [itineraryModalOpen, setItineraryModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!productId) return;
    const advisorUid = String(user?.id ?? "1");
    const advisorName = user?.username ?? user?.email?.split("@")[0] ?? "You";
    const { products } = resolveAdvisorCatalogFromStorage(advisorUid, advisorName);
    if (products.some((p) => p.id === productId) || getDirectoryProductById(productId)) return;
    setLoading(true);
    setError(null);
    try {
      const p = await fetchProduct(productId);
      setProduct(p);
    } catch (err) {
      if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
        const fake = FAKE_PRODUCTS.find((f) => getProductId(f) === productId);
        if (fake) {
          setProduct(fake);
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Failed to load product");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId, user?.id, user?.username, user?.email]);

  useEffect(() => {
    if (isCatalogDirectoryProduct) {
      setLoading(false);
      setError(null);
      setProduct(null);
      return;
    }
    load();
  }, [productId, load, isCatalogDirectoryProduct]);

  if (isCatalogDirectoryProduct && !directoryProduct) {
    return (
      <div className="min-h-screen bg-inset p-6 md:p-8">
        <div className="mx-auto w-full max-w-[420px] p-6 text-muted-foreground">Loading catalog product…</div>
      </div>
    );
  }

  if (directoryProduct) {
    const directoryProductForView = directoryProductView ?? directoryProduct;
    return (
      <div className="min-h-screen bg-inset p-6 md:p-8">
        <div className="mx-auto w-full max-w-[420px]">
          <ProductDirectoryDetailBody
            product={directoryProductForView}
            canViewCommissions={canViewCommissions}
            isAdmin={isAdmin}
            teams={MOCK_TEAMS}
            onOpenCollectionPicker={() => setPickerOpen(true)}
            onPatchProduct={patchDirectoryProduct}
            onAddToItinerary={() =>
              toast({
                title: "Add to itinerary",
                description: "Connect API when ready.",
                tone: "success",
              })
            }
            canRemoveFromCollection={canRemoveFromCollectionDir}
            availableCollections={availableCollections}
            onQuickAddToCollection={handleQuickAddDirectoryCollection}
            onRequestCreateCollection={() => setPickerOpen(true)}
            partnerProgramCustomKeys={customProgramKeys}
            repFirmsRegistry={repFirmsRegistry}
          />
        </div>
        {pickerOpen && (
          <ProductDirectoryCollectionPicker
            product={directoryProduct}
            collections={availableCollections}
            teams={MOCK_TEAMS}
            initialSelectedIds={directoryProduct.collectionIds}
            onClose={() => setPickerOpen(false)}
            onSave={saveDirectoryCollections}
            onCreateCollection={createDirectoryCollectionDetail}
          />
        )}
      </div>
    );
  }

  const currentUser = user ? { id: user.id, role: user.role, agency_id: user.agency_id } : null;
  const canEdit = product ? canEditProduct(currentUser, product) : false;
  const canDelete = product ? canDeleteProduct(currentUser, product) : false;
  const canViewFinancials_ = product ? canViewFinancials(currentUser, product) : false;
  const isEnable = product?.data_ownership_level === "Enable";
  const layer = (product?.data_ownership_level ?? "Advisor") as keyof typeof DATA_LAYER_BADGES;
  const ver = (product?.verification_status ?? "unverified") as keyof typeof VERIFICATION_BADGES;

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading product…</div>;
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <p className="text-red-400">{error ?? "Product not found"}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/products")} className="mt-4">
          Back to products
        </Button>
      </div>
    );
  }

  const Icon = CATEGORY_ICONS[product.category] ?? CATEGORY_ICONS.accommodation;
  const pendingSuggestions = isAdmin ? getProductLayerMock(getProductId(product)).pendingSuggestions : 0;

  const sectionTitle = (t: string) => (
    <h2 className="mb-3 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">{t}</h2>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="relative h-[240px] w-full shrink-0 overflow-hidden bg-zinc-900">
        <ImageWithFallback
          fallbackType="product"
          src={product.hero_image_url}
          alt={product.name}
          productCategory={product.category as ProductCategory}
          className="h-full w-full object-cover opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-white drop-shadow-sm">{product.name}</h1>
            {isAdmin && pendingSuggestions > 0 && (
              <button
                type="button"
                onClick={() =>
                  toast({ title: "Suggestion review — coming in v2", tone: "success" })
                }
                className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-2xs text-[var(--color-warning)] hover:bg-amber-500/20"
              >
                {pendingSuggestions} suggestion{pendingSuggestions > 1 ? "s" : ""}
              </button>
            )}
          </div>
          <p className="mt-0.5 text-sm text-white/90">
            {[product.city, (product.country && COUNTRY_NAMES[product.country]) || product.country].filter(Boolean).join(", ") ||
              "—"}
          </p>
        </div>
      </div>
      <header className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:flex-1 lg:gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
              {CATEGORY_LABELS[product.category]}
            </span>
            <span className="inline-flex items-center gap-1 rounded border border-border bg-white/10 px-1.5 py-0.5 text-xs text-muted-foreground">
              {product.status}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs",
                VERIFICATION_BADGES[ver]?.variant === "default" && "bg-green-500/20 text-green-400"
              )}
            >
              {VERIFICATION_BADGES[ver]?.label ?? ver}
            </span>
            <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs", DATA_LAYER_BADGES[layer]?.className)}>
              {DATA_LAYER_BADGES[layer]?.label}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditModalProduct(product);
                setEditModalOpen(true);
              }}
              className="border-input text-foreground"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(true)} className="border-input text-red-400">
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-input text-foreground"
            onClick={() => {
              setEditModalProduct({ ...product, id: "", _id: undefined } as Product);
              setEditModalOpen(true);
            }}
          >
            <Copy className="size-3.5" aria-hidden />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" className="border-input text-foreground" onClick={() => setItineraryModalOpen(true)}>
            <Plus className="size-3.5" aria-hidden />
            Add to Itinerary
          </Button>
          {isEnable && (
            <Button variant="cta" size="sm" onClick={() => setCopyModalOpen(true)}>
              <Copy className="size-3.5" aria-hidden />
              Copy to Agency
            </Button>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-6">
          {sectionTitle("Overview")}
          <div className="rounded-xl border border-border bg-white/[0.03] p-3">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Key facts</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm sm:grid-cols-3">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Category</p>
                <p className="mt-0.5 font-medium text-foreground">{CATEGORY_LABELS[product.category]}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Price range</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {product.price_range ? PRICE_RANGE_DISPLAY[product.price_range] : "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Tier</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {product.partnership_tier ? PARTNERSHIP_TIER_LABELS[product.partnership_tier] : "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Verification</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {VERIFICATION_BADGES[ver]?.label ?? product.verification_status ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Data layer</p>
                <p className="mt-0.5 font-medium text-foreground">{product.data_ownership_level ?? "—"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Status</p>
                <p className="mt-0.5 font-medium capitalize text-foreground">{product.status ?? "—"}</p>
              </div>
            </div>
          </div>
          {product.description ? (
            <p className="text-sm leading-relaxed text-[rgba(245,240,235,0.75)]">{product.description}</p>
          ) : null}
          {(product.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags!.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-foreground/[0.03] px-2 py-0.5 text-[9px] lowercase text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {sectionTitle("Location")}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Address: {product.address || "—"}</p>
            {product.latitude != null && product.longitude != null && (
              <p className="text-muted-foreground/75">
                Coordinates: {product.latitude}, {product.longitude}
              </p>
            )}
          </div>

          {sectionTitle("Commercial")}
          {canViewFinancials_ ? (
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground/75">Commission</dt>
                <dd className="text-foreground">
                  {product.commission_rate ?? "—"} {product.commission_type ?? ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground/75">Partnership tier</dt>
                <dd className="text-foreground">{product.partnership_tier ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground/75">You don’t have permission to view commercial details.</p>
          )}

          {sectionTitle("Content")}
          <div className="space-y-4">
            {product.hero_image_url && (
              <img src={product.hero_image_url} alt="" className="max-h-48 rounded-lg object-cover" />
            )}
            <Button variant="outline" size="sm" className="border-input text-foreground" onClick={() => setEnrichModalOpen(true)}>
              Enrich with AI
            </Button>
          </div>

          {sectionTitle("Suitability")}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Best for occasions: {product.best_for_occasions?.join(", ") || "—"}</p>
            <p>Ideal group size: {product.ideal_group_size || "—"}</p>
            <p>Languages: {product.languages_supported?.join(", ") || "—"}</p>
          </div>

          {sectionTitle("Category details")}
          <div className="space-y-4 text-sm">
            {product.category === "accommodation" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground/75">Star rating</dt>
                  <dd className="text-foreground">{(product as { star_rating?: number }).star_rating ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/75">Room count</dt>
                  <dd className="text-foreground">{(product as { room_count?: number }).room_count ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/75">Check-in</dt>
                  <dd className="text-foreground">{(product as { check_in_time?: string }).check_in_time ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/75">Check-out</dt>
                  <dd className="text-foreground">{(product as { check_out_time?: string }).check_out_time ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground/75">Amenities</dt>
                  <dd className="text-foreground">{(product as { amenities?: string[] }).amenities?.join(", ") ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "restaurant" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground/75">Michelin stars</dt>
                  <dd className="text-foreground">{(product as { michelin_stars?: number }).michelin_stars ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/75">Cuisine</dt>
                  <dd className="text-foreground">{(product as { cuisine_type?: string }).cuisine_type ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground/75">Dietary options</dt>
                  <dd className="text-foreground">{(product as { dietary_options?: string[] }).dietary_options?.join(", ") ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "activity" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground/75">Duration</dt>
                  <dd className="text-foreground">{(product as { duration?: string }).duration ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/75">Difficulty</dt>
                  <dd className="text-foreground">{(product as { difficulty_level?: string }).difficulty_level ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/75">Season</dt>
                  <dd className="text-foreground">{(product as { seasonality_notes?: string }).seasonality_notes ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "dmc" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground/75">Destinations</dt>
                  <dd className="text-foreground">{(product as { destinations_covered?: string[] }).destinations_covered?.join(", ") ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground/75">Services</dt>
                  <dd className="text-foreground">{(product as { service_types?: string[] }).service_types?.join(", ") ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "cruise" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground/75">Ship name</dt>
                  <dd className="text-foreground">{(product as { ship_name?: string }).ship_name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/75">Cruise line</dt>
                  <dd className="text-foreground">{(product as { cruise_line?: string }).cruise_line ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground/75">Departure ports</dt>
                  <dd className="text-foreground">{(product as { departure_ports?: string[] }).departure_ports?.join(", ") ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "service_provider" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground/75">Service types</dt>
                  <dd className="text-foreground">{(product as { service_types?: string[] }).service_types?.join(", ") ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "transportation" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground/75">Vehicle types</dt>
                  <dd className="text-foreground">{(product as { vehicle_types?: string[] }).vehicle_types?.join(", ") ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground/75">Capacity</dt>
                  <dd className="text-foreground">{(product as { capacity?: number }).capacity ?? "—"}</dd>
                </div>
              </dl>
            )}
          </div>

          {sectionTitle("Governance")}
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground/75">Data ownership</dt>
              <dd className="text-foreground">{product.data_ownership_level ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground/75">Created by</dt>
              <dd className="text-foreground">{product.created_by_name ?? product.created_by ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground/75">Updated by</dt>
              <dd className="text-foreground">{product.updated_by_name ?? product.updated_by ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground/75">Last verified</dt>
              <dd className="text-foreground">{product.last_verified ?? "—"}</dd>
            </div>
            {product.quality_score != null && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground/75">Quality score</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <div className="h-2 max-w-[200px] flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[var(--muted-success-text)]" style={{ width: `${product.quality_score}%` }} />
                  </div>
                  <span className="text-foreground">{product.quality_score}%</span>
                </dd>
              </div>
            )}
          </dl>

          <ProductDetailLayers key={product.id} product={product} />
        </div>
      </div>

      <DeleteProductModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        product={product}
        productIds={null}
        onDeleted={() => router.push("/dashboard/products")}
      />
      <AddProductModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditModalProduct(null);
        }}
        product={editModalProduct}
        onSaved={() => {
          setEditModalOpen(false);
          setEditModalProduct(null);
          load();
        }}
      />
      <CopyToAgencyModal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        product={product}
        onCopied={() => {
          setCopyModalOpen(false);
          load();
        }}
      />
      <EnrichProductModal
        open={enrichModalOpen}
        onClose={() => setEnrichModalOpen(false)}
        product={product}
        onEnriched={() => {
          setEnrichModalOpen(false);
          load();
        }}
      />
      <AddToItineraryModal
        open={itineraryModalOpen}
        onClose={() => setItineraryModalOpen(false)}
        product={product}
        onAdded={() => setItineraryModalOpen(false)}
      />
    </div>
  );
}
