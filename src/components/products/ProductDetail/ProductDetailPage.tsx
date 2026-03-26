"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/types/product";
import type {
  DirectoryCollectionOption,
  DirectoryProduct,
  NewDirectoryCollectionInput,
} from "@/types/product-directory";
import { fetchProduct, getProductId } from "@/lib/products-api";
import { FAKE_PRODUCTS } from "../fakeData";
import {
  buildDirectoryCollectionRefs,
  cloneDirectoryProduct,
  getDirectoryProductById,
  MOCK_DIRECTORY_COLLECTIONS,
  MOCK_DIRECTORY_PRODUCTS,
} from "../productDirectoryMock";
import { useUser } from "@/contexts/UserContext";
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
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import type { ProductCategory } from "@/types/product";
import { ProductDetailLayers } from "./ProductDetailLayers";
import { getProductLayerMock } from "./productLayerMock";
import { ProductDirectoryDetailBody } from "../ProductDirectoryDetailBody";
import ProductDirectoryCollectionPicker from "../ProductDirectoryCollectionPicker";
import { MOCK_TEAMS, resolveUserPolicies } from "@/lib/teamsMock";
import type { Team } from "@/types/teams";
import { programFilterId } from "../productDirectoryCommission";

type Props = { productId: string };

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

export default function ProductDetailPage({ productId }: Props) {
  const router = useRouter();
  const { user, directoryViewAsAdmin } = useUser();
  const toast = useToast();

  const dirSeed = useMemo(() => getDirectoryProductById(productId), [productId]);
  const [directoryProduct, setDirectoryProduct] = useState<DirectoryProduct | null>(() =>
    dirSeed ? cloneDirectoryProduct(dirSeed) : null
  );

  useEffect(() => {
    const d = getDirectoryProductById(productId);
    setDirectoryProduct(d ? cloneDirectoryProduct(d) : null);
  }, [productId]);

  const uid = user ? String(user.id) : "1";
  const policies = useMemo(
    () => resolveUserPolicies(user ? { id: String(user.id), role: user.role } : null, MOCK_TEAMS),
    [user]
  );
  const canViewCommissions = policies.canViewCommissions;
  const isAdmin =
    directoryViewAsAdmin || user?.role === "admin" || user?.role === "agency_admin";

  const [pickerOpen, setPickerOpen] = useState(false);
  const [directoryCollections, setDirectoryCollections] = useState<DirectoryCollectionOption[]>(() =>
    MOCK_DIRECTORY_COLLECTIONS.map((c) => ({
      ...c,
      productIds: c.productIds ? [...c.productIds] : undefined,
    }))
  );

  const availableCollections = useMemo(
    () => filterCollectionsForUser(uid, directoryCollections, MOCK_TEAMS),
    [uid, directoryCollections]
  );

  const patchDirectoryProduct = useCallback((id: string, patch: Partial<DirectoryProduct>) => {
    setDirectoryProduct((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }, []);

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
        patchDirectoryProduct(directoryProduct.id, {
          collectionIds: selectedIds,
          collections: refs,
          collectionCount: selectedIds.length,
        });
        return next;
      });
      setPickerOpen(false);
      toast("Collections updated");
    },
    [directoryProduct, patchDirectoryProduct, toast]
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

      setDirectoryCollections((prev) => [...prev, newCol]);
      toast(`Created “${newCol.name}”`);
      return id;
    },
    [directoryProduct, uid, user, toast]
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
        patchDirectoryProduct(directoryProduct.id, {
          collectionIds: nextIds,
          collections: refs,
          collectionCount: nextIds.length,
        });
        return next;
      });
    },
    [directoryProduct, patchDirectoryProduct]
  );

  const canRemoveFromCollectionDir = useCallback(
    (collectionId: string) => {
      if (isAdmin) return true;
      const c = directoryCollections.find((x) => x.id === collectionId);
      return c?.ownerId === uid;
    },
    [isAdmin, uid, directoryCollections]
  );
  const customProgramKeys = useMemo(
    () => (directoryProduct ? customProgramKeysForProduct(directoryProduct, MOCK_DIRECTORY_PRODUCTS) : []),
    [directoryProduct]
  );

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(() => !getDirectoryProductById(productId));
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalProduct, setEditModalProduct] = useState<Product | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [enrichModalOpen, setEnrichModalOpen] = useState(false);
  const [itineraryModalOpen, setItineraryModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!productId || getDirectoryProductById(productId)) return;
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
  }, [productId]);

  useEffect(() => {
    if (getDirectoryProductById(productId)) {
      setLoading(false);
      setError(null);
      setProduct(null);
      return;
    }
    load();
  }, [productId, load]);

  if (dirSeed && directoryProduct) {
    return (
      <div className="min-h-screen bg-[#08080c] p-6 md:p-8">
        {IS_PREVIEW_MODE && <PreviewBanner feature="Product detail" variant="compact" sampleDataOnly />}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-6 text-[#9B9590] hover:text-[#F5F0EB]"
        >
          <Link href="/dashboard/products" className="inline-flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Products
          </Link>
        </Button>
        <div className="mx-auto w-full max-w-[420px]">
          <ProductDirectoryDetailBody
            product={directoryProduct}
            canViewCommissions={canViewCommissions}
            isAdmin={isAdmin}
            teams={MOCK_TEAMS}
            onOpenCollectionPicker={() => setPickerOpen(true)}
            onPatchProduct={patchDirectoryProduct}
            onAddToItinerary={() => toast("Add to itinerary (connect API when ready)")}
            canRemoveFromCollection={canRemoveFromCollectionDir}
            availableCollections={availableCollections}
            onQuickAddToCollection={handleQuickAddDirectoryCollection}
            onRequestCreateCollection={() => setPickerOpen(true)}
            partnerProgramCustomKeys={customProgramKeys}
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
    return <div className="p-6 text-[rgba(245,245,245,0.6)]">Loading product…</div>;
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
    <h2 className="mb-3 text-[9px] font-semibold uppercase tracking-[0.08em] text-[rgba(245,245,245,0.45)]">{t}</h2>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0C0C0C]">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Product detail" variant="compact" sampleDataOnly />}
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
                onClick={() => toast("Suggestion review — coming in v2")}
                className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400 hover:bg-amber-500/20"
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
      <header className="flex flex-wrap items-center gap-3 border-b border-[rgba(255,255,255,0.08)] p-4">
        <Button variant="ghost" size="sm" asChild className="text-[rgba(245,245,245,0.7)] hover:text-[#F5F5F5]">
          <Link href="/dashboard/products" className="inline-flex items-center gap-1">
            <ArrowLeft size={18} /> Back to Products
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-[rgba(245,245,245,0.6)]">
            <Icon size={14} />
            {CATEGORY_LABELS[product.category]}
          </span>
          <span className="inline-flex items-center gap-1 rounded border bg-white/10 px-1.5 py-0.5 text-xs text-[rgba(245,245,245,0.8)]">
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
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditModalProduct(product);
                setEditModalOpen(true);
              }}
              className="border-white/10 text-[#F5F5F5]"
            >
              <Pencil size={14} className="mr-1" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(true)} className="border-white/10 text-red-400">
              <Trash2 size={14} className="mr-1" /> Delete
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-[#F5F5F5]"
            onClick={() => {
              setEditModalProduct({ ...product, id: "", _id: undefined } as Product);
              setEditModalOpen(true);
            }}
          >
            <Copy size={14} className="mr-1" /> Duplicate
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]" onClick={() => setItineraryModalOpen(true)}>
            <Plus size={14} className="mr-1" /> Add to Itinerary
          </Button>
          {isEnable && (
            <Button size="sm" onClick={() => setCopyModalOpen(true)}>
              <Copy size={14} className="mr-1" /> Copy to Agency
            </Button>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-6">
          {sectionTitle("Overview")}
          <div className="rounded-xl border border-white/[0.06] bg-[#0e0e14] p-3">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6B6560]">Key facts</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm sm:grid-cols-3">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#6B6560]">Category</p>
                <p className="mt-0.5 font-medium text-[#F5F0EB]">{CATEGORY_LABELS[product.category]}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#6B6560]">Price range</p>
                <p className="mt-0.5 font-medium text-[#F5F0EB]">
                  {product.price_range ? PRICE_RANGE_DISPLAY[product.price_range] : "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#6B6560]">Tier</p>
                <p className="mt-0.5 font-medium text-[#F5F0EB]">
                  {product.partnership_tier ? PARTNERSHIP_TIER_LABELS[product.partnership_tier] : "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#6B6560]">Verification</p>
                <p className="mt-0.5 font-medium text-[#F5F0EB]">
                  {VERIFICATION_BADGES[ver]?.label ?? product.verification_status ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#6B6560]">Data layer</p>
                <p className="mt-0.5 font-medium text-[#F5F0EB]">{product.data_ownership_level ?? "—"}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#6B6560]">Status</p>
                <p className="mt-0.5 font-medium capitalize text-[#F5F0EB]">{product.status ?? "—"}</p>
              </div>
            </div>
          </div>
          {product.description ? (
            <p className="text-[12px] leading-relaxed text-[rgba(245,240,235,0.75)]">{product.description}</p>
          ) : null}
          {(product.tags?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags!.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[9px] lowercase text-[#9B9590]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {sectionTitle("Location")}
          <div className="space-y-2 text-sm text-[rgba(245,245,245,0.7)]">
            <p>Address: {product.address || "—"}</p>
            {product.latitude != null && product.longitude != null && (
              <p className="text-[rgba(245,245,245,0.5)]">
                Coordinates: {product.latitude}, {product.longitude}
              </p>
            )}
          </div>

          {sectionTitle("Commercial")}
          {canViewFinancials_ ? (
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[rgba(245,245,245,0.5)]">Commission</dt>
                <dd className="text-[#F5F5F5]">
                  {product.commission_rate ?? "—"} {product.commission_type ?? ""}
                </dd>
              </div>
              <div>
                <dt className="text-[rgba(245,245,245,0.5)]">Partnership tier</dt>
                <dd className="text-[#F5F5F5]">{product.partnership_tier ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[rgba(245,245,245,0.5)]">You don’t have permission to view commercial details.</p>
          )}

          {sectionTitle("Content")}
          <div className="space-y-4">
            {product.hero_image_url && (
              <img src={product.hero_image_url} alt="" className="max-h-48 rounded-lg object-cover" />
            )}
            <Button variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]" onClick={() => setEnrichModalOpen(true)}>
              Enrich with AI
            </Button>
          </div>

          {sectionTitle("Suitability")}
          <div className="space-y-2 text-sm text-[rgba(245,245,245,0.8)]">
            <p>Best for occasions: {product.best_for_occasions?.join(", ") || "—"}</p>
            <p>Ideal group size: {product.ideal_group_size || "—"}</p>
            <p>Languages: {product.languages_supported?.join(", ") || "—"}</p>
          </div>

          {sectionTitle("Category details")}
          <div className="space-y-4 text-sm">
            {product.category === "accommodation" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Star rating</dt>
                  <dd className="text-[#F5F5F5]">{(product as { star_rating?: number }).star_rating ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Room count</dt>
                  <dd className="text-[#F5F5F5]">{(product as { room_count?: number }).room_count ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Check-in</dt>
                  <dd className="text-[#F5F5F5]">{(product as { check_in_time?: string }).check_in_time ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Check-out</dt>
                  <dd className="text-[#F5F5F5]">{(product as { check_out_time?: string }).check_out_time ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[rgba(245,245,245,0.5)]">Amenities</dt>
                  <dd className="text-[#F5F5F5]">{(product as { amenities?: string[] }).amenities?.join(", ") ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "restaurant" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Michelin stars</dt>
                  <dd className="text-[#F5F5F5]">{(product as { michelin_stars?: number }).michelin_stars ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Cuisine</dt>
                  <dd className="text-[#F5F5F5]">{(product as { cuisine_type?: string }).cuisine_type ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[rgba(245,245,245,0.5)]">Dietary options</dt>
                  <dd className="text-[#F5F5F5]">{(product as { dietary_options?: string[] }).dietary_options?.join(", ") ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "activity" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Duration</dt>
                  <dd className="text-[#F5F5F5]">{(product as { duration?: string }).duration ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Difficulty</dt>
                  <dd className="text-[#F5F5F5]">{(product as { difficulty_level?: string }).difficulty_level ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Season</dt>
                  <dd className="text-[#F5F5F5]">{(product as { seasonality_notes?: string }).seasonality_notes ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "dmc" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-[rgba(245,245,245,0.5)]">Destinations</dt>
                  <dd className="text-[#F5F5F5]">{(product as { destinations_covered?: string[] }).destinations_covered?.join(", ") ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[rgba(245,245,245,0.5)]">Services</dt>
                  <dd className="text-[#F5F5F5]">{(product as { service_types?: string[] }).service_types?.join(", ") ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "cruise" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Ship name</dt>
                  <dd className="text-[#F5F5F5]">{(product as { ship_name?: string }).ship_name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Cruise line</dt>
                  <dd className="text-[#F5F5F5]">{(product as { cruise_line?: string }).cruise_line ?? "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[rgba(245,245,245,0.5)]">Departure ports</dt>
                  <dd className="text-[#F5F5F5]">{(product as { departure_ports?: string[] }).departure_ports?.join(", ") ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "service_provider" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-[rgba(245,245,245,0.5)]">Service types</dt>
                  <dd className="text-[#F5F5F5]">{(product as { service_types?: string[] }).service_types?.join(", ") ?? "—"}</dd>
                </div>
              </dl>
            )}
            {product.category === "transportation" && (
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-[rgba(245,245,245,0.5)]">Vehicle types</dt>
                  <dd className="text-[#F5F5F5]">{(product as { vehicle_types?: string[] }).vehicle_types?.join(", ") ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[rgba(245,245,245,0.5)]">Capacity</dt>
                  <dd className="text-[#F5F5F5]">{(product as { capacity?: number }).capacity ?? "—"}</dd>
                </div>
              </dl>
            )}
          </div>

          {sectionTitle("Governance")}
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[rgba(245,245,245,0.5)]">Data ownership</dt>
              <dd className="text-[#F5F5F5]">{product.data_ownership_level ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[rgba(245,245,245,0.5)]">Created by</dt>
              <dd className="text-[#F5F5F5]">{product.created_by_name ?? product.created_by ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[rgba(245,245,245,0.5)]">Updated by</dt>
              <dd className="text-[#F5F5F5]">{product.updated_by_name ?? product.updated_by ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[rgba(245,245,245,0.5)]">Last verified</dt>
              <dd className="text-[#F5F5F5]">{product.last_verified ?? "—"}</dd>
            </div>
            {product.quality_score != null && (
              <div className="sm:col-span-2">
                <dt className="text-[rgba(245,245,245,0.5)]">Quality score</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <div className="h-2 max-w-[200px] flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[var(--muted-success-text)]" style={{ width: `${product.quality_score}%` }} />
                  </div>
                  <span className="text-[#F5F5F5]">{product.quality_score}%</span>
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
