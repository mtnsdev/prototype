"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Copy, Plus } from "lucide-react";
import type { Product } from "@/types/product";
import { fetchProduct, getProductId } from "@/lib/products-api";
import { FAKE_PRODUCTS } from "../fakeData";
import { useUser } from "@/contexts/UserContext";
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
import ProductDetailTabBar from "./ProductDetailTabBar";
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

const TAB_IDS = ["overview", "location", "commercial", "content", "suitability", "category", "governance"] as const;

type Props = { productId: string };

export default function ProductDetailPage({ productId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const tabParam = searchParams.get("tab");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TAB_IDS)[number]>(
    tabParam && TAB_IDS.includes(tabParam as (typeof TAB_IDS)[number]) ? (tabParam as (typeof TAB_IDS)[number]) : "overview"
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalProduct, setEditModalProduct] = useState<Product | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [enrichModalOpen, setEnrichModalOpen] = useState(false);
  const [itineraryModalOpen, setItineraryModalOpen] = useState(false);

  const load = async () => {
    if (!productId) return;
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
  };

  useEffect(() => {
    load();
  }, [productId]);

  useEffect(() => {
    if (tabParam && TAB_IDS.includes(tabParam as (typeof TAB_IDS)[number])) {
      setActiveTab(tabParam as (typeof TAB_IDS)[number]);
    }
  }, [tabParam]);

  const currentUser = user ? { id: user.id, role: user.role, agency_id: user.agency_id } : null;
  const canEdit = product ? canEditProduct(currentUser, product) : false;
  const canDelete = product ? canDeleteProduct(currentUser, product) : false;
  const canViewFinancials_ = product ? canViewFinancials(currentUser, product) : false;
  const isEnable = product?.data_ownership_level === "Enable";
  const layer = (product?.data_ownership_level ?? "Advisor") as keyof typeof DATA_LAYER_BADGES;
  const ver = (product?.verification_status ?? "unverified") as keyof typeof VERIFICATION_BADGES;

  if (loading) {
    return (
      <div className="p-6 text-[rgba(245,245,245,0.6)]">Loading product…</div>
    );
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

  return (
    <div className="h-full flex flex-col bg-[#0C0C0C] overflow-hidden">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Product detail" variant="compact" sampleDataOnly />}
      <div className="relative h-[240px] w-full shrink-0 overflow-hidden bg-zinc-900">
        <ImageWithFallback
          fallbackType="product"
          src={product.hero_image_url}
          alt={product.name}
          productCategory={product.category as ProductCategory}
          className="w-full h-full object-cover opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h1 className="text-xl font-semibold text-white drop-shadow-sm">{product.name}</h1>
          <p className="text-sm text-white/90 mt-0.5">
            {[product.city, (product.country && COUNTRY_NAMES[product.country]) || product.country].filter(Boolean).join(", ") || "—"}
          </p>
        </div>
      </div>
      <header className="border-b border-[rgba(255,255,255,0.08)] p-4 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="text-[rgba(245,245,245,0.7)] hover:text-[#F5F5F5]">
          <Link href="/dashboard/products" className="inline-flex items-center gap-1">
            <ArrowLeft size={18} /> Back to Products
          </Link>
        </Button>
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-[rgba(245,245,245,0.6)]">
              <Icon size={14} />
              {CATEGORY_LABELS[product.category]}
            </span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded border", "bg-white/10 text-[rgba(245,245,245,0.8)]")}>
              {product.status}
            </span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded border", VERIFICATION_BADGES[ver]?.variant === "default" && "bg-green-500/20 text-green-400")}>
              {VERIFICATION_BADGES[ver]?.label ?? ver}
            </span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded border", DATA_LAYER_BADGES[layer]?.className)}>
              {DATA_LAYER_BADGES[layer]?.label}
            </span>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => { setEditModalProduct(product); setEditModalOpen(true); }} className="border-white/10 text-[#F5F5F5]">
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
            onClick={() => { setEditModalProduct({ ...product, id: "", _id: undefined } as Product); setEditModalOpen(true); }}
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

      <ProductDetailTabBar activeTab={activeTab} onTabChange={setActiveTab} canViewCommercial={canViewFinancials_} />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 overflow-auto p-4 min-w-0">
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-3xl">
              {product.description && (
                <p className="text-sm text-[rgba(245,245,245,0.85)] leading-relaxed">{product.description}</p>
              )}
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-3">Key facts</h2>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-[rgba(245,245,245,0.5)]">Category</dt><dd className="text-[#F5F5F5]">{CATEGORY_LABELS[product.category]}</dd></div>
                  <div><dt className="text-[rgba(245,245,245,0.5)]">Price range</dt><dd className="text-[#F5F5F5]">{product.price_range ? PRICE_RANGE_DISPLAY[product.price_range] : "—"}</dd></div>
                  <div><dt className="text-[rgba(245,245,245,0.5)]">Tier</dt><dd className="text-[#F5F5F5]">{product.partnership_tier ? PARTNERSHIP_TIER_LABELS[product.partnership_tier] : "—"}</dd></div>
                  <div><dt className="text-[rgba(245,245,245,0.5)]">Verification</dt><dd className="text-[#F5F5F5]">{VERIFICATION_BADGES[ver]?.label ?? product.verification_status ?? "—"}</dd></div>
                  <div><dt className="text-[rgba(245,245,245,0.5)]">Data layer</dt><dd className="text-[#F5F5F5]">{product.data_ownership_level ?? "—"}</dd></div>
                  <div><dt className="text-[rgba(245,245,245,0.5)]">Status</dt><dd className="text-[#F5F5F5] capitalize">{product.status ?? "—"}</dd></div>
                </dl>
              </section>
              {(product.tags?.length ?? 0) > 0 && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">Tags</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags!.map((t) => (
                      <span key={t} className="text-xs lowercase border border-gray-600 text-gray-400 rounded-full px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </section>
              )}
              {product.category === "accommodation" && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">Accommodation</h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><dt className="text-[rgba(245,245,245,0.5)]">Star rating</dt><dd className="text-[#F5F5F5]">{(product as { star_rating?: number }).star_rating ?? "—"}</dd></div>
                    <div><dt className="text-[rgba(245,245,245,0.5)]">Room count</dt><dd className="text-[#F5F5F5]">{(product as { room_count?: number }).room_count ?? "—"}</dd></div>
                    <div><dt className="text-[rgba(245,245,245,0.5)]">Check-in</dt><dd className="text-[#F5F5F5]">{(product as { check_in_time?: string }).check_in_time ?? "—"}</dd></div>
                    <div><dt className="text-[rgba(245,245,245,0.5)]">Check-out</dt><dd className="text-[#F5F5F5]">{(product as { check_out_time?: string }).check_out_time ?? "—"}</dd></div>
                    <div className="col-span-2"><dt className="text-[rgba(245,245,245,0.5)]">Amenities</dt><dd className="text-[#F5F5F5]">{(product as { amenities?: string[] }).amenities?.join(", ") ?? "—"}</dd></div>
                  </dl>
                </section>
              )}
              {product.category === "restaurant" && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">Restaurant</h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><dt className="text-[rgba(245,245,245,0.5)]">Michelin stars</dt><dd className="text-[#F5F5F5]">{(product as { michelin_stars?: number }).michelin_stars ?? "—"}</dd></div>
                    <div><dt className="text-[rgba(245,245,245,0.5)]">Cuisine</dt><dd className="text-[#F5F5F5]">{(product as { cuisine_type?: string }).cuisine_type ?? "—"}</dd></div>
                    <div className="col-span-2"><dt className="text-[rgba(245,245,245,0.5)]">Dietary options</dt><dd className="text-[#F5F5F5]">{(product as { dietary_options?: string[] }).dietary_options?.join(", ") ?? "—"}</dd></div>
                  </dl>
                </section>
              )}
              {product.category === "activity" && (
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">Activity</h2>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><dt className="text-[rgba(245,245,245,0.5)]">Duration</dt><dd className="text-[#F5F5F5]">{(product as { duration?: string }).duration ?? "—"}</dd></div>
                    <div><dt className="text-[rgba(245,245,245,0.5)]">Difficulty</dt><dd className="text-[#F5F5F5]">{(product as { difficulty_level?: string }).difficulty_level ?? "—"}</dd></div>
                    <div><dt className="text-[rgba(245,245,245,0.5)]">Season</dt><dd className="text-[#F5F5F5]">{(product as { seasonality_notes?: string }).seasonality_notes ?? "—"}</dd></div>
                  </dl>
                </section>
              )}
            </div>
          )}
        {activeTab === "location" && (
          <div className="space-y-4 max-w-3xl">
            <p className="text-sm text-[rgba(245,245,245,0.7)]">Address: {product.address || "—"}</p>
            {product.latitude != null && product.longitude != null && (
              <p className="text-sm text-[rgba(245,245,245,0.5)]">Map placeholder: {product.latitude}, {product.longitude}</p>
            )}
          </div>
        )}
        {activeTab === "commercial" && (
          <div className="space-y-4 max-w-3xl">
            {canViewFinancials_ ? (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div><dt className="text-[rgba(245,245,245,0.5)]">Commission</dt><dd className="text-[#F5F5F5]">{product.commission_rate ?? "—"} {product.commission_type ?? ""}</dd></div>
                <div><dt className="text-[rgba(245,245,245,0.5)]">Partnership tier</dt><dd className="text-[#F5F5F5]">{product.partnership_tier ?? "—"}</dd></div>
              </dl>
            ) : (
              <p className="text-sm text-[rgba(245,245,245,0.5)]">You don’t have permission to view commercial details.</p>
            )}
          </div>
        )}
        {activeTab === "content" && (
          <div className="space-y-4">
            {product.hero_image_url && <img src={product.hero_image_url} alt="" className="max-h-48 rounded-lg object-cover" />}
            <p className="text-sm text-[rgba(245,245,245,0.8)]">{product.description || "—"}</p>
            <p className="text-sm text-[rgba(245,245,245,0.5)]">Tags: {product.tags?.join(", ") || "—"}</p>
            <Button variant="outline" size="sm" className="border-white/10 text-[#F5F5F5]" onClick={() => setEnrichModalOpen(true)}>Enrich with AI</Button>
          </div>
        )}
        {activeTab === "suitability" && (
          <div className="space-y-2 text-sm text-[rgba(245,245,245,0.8)]">
            <p>Best for occasions: {product.best_for_occasions?.join(", ") || "—"}</p>
            <p>Ideal group size: {product.ideal_group_size || "—"}</p>
            <p>Languages: {product.languages_supported?.join(", ") || "—"}</p>
          </div>
        )}
        {activeTab === "category" && (
          <div className="space-y-4 max-w-3xl text-sm">
            {product.category === "accommodation" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><dt className="text-[rgba(245,245,245,0.5)]">Star rating</dt><dd className="text-[#F5F5F5]">{(product as { star_rating?: number }).star_rating ?? "—"}</dd></div>
                <div><dt className="text-[rgba(245,245,245,0.5)]">Room count</dt><dd className="text-[#F5F5F5]">{(product as { room_count?: number }).room_count ?? "—"}</dd></div>
                <div><dt className="text-[rgba(245,245,245,0.5)]">Check-in</dt><dd className="text-[#F5F5F5]">{(product as { check_in_time?: string }).check_in_time ?? "—"}</dd></div>
                <div><dt className="text-[rgba(245,245,245,0.5)]">Check-out</dt><dd className="text-[#F5F5F5]">{(product as { check_out_time?: string }).check_out_time ?? "—"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-[rgba(245,245,245,0.5)]">Amenities</dt><dd className="text-[#F5F5F5]">{(product as { amenities?: string[] }).amenities?.join(", ") ?? "—"}</dd></div>
              </dl>
            )}
            {product.category === "dmc" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="sm:col-span-2"><dt className="text-[rgba(245,245,245,0.5)]">Destinations covered</dt><dd className="text-[#F5F5F5]">{(product as { destinations_covered?: string[] }).destinations_covered?.join(", ") ?? "—"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-[rgba(245,245,245,0.5)]">Service types</dt><dd className="text-[#F5F5F5]">{(product as { service_types?: string[] }).service_types?.join(", ") ?? "—"}</dd></div>
              </dl>
            )}
            {product.category === "cruise" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><dt className="text-[rgba(245,245,245,0.5)]">Ship name</dt><dd className="text-[#F5F5F5]">{(product as { ship_name?: string }).ship_name ?? "—"}</dd></div>
                <div><dt className="text-[rgba(245,245,245,0.5)]">Cruise line</dt><dd className="text-[#F5F5F5]">{(product as { cruise_line?: string }).cruise_line ?? "—"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-[rgba(245,245,245,0.5)]">Departure ports</dt><dd className="text-[#F5F5F5]">{(product as { departure_ports?: string[] }).departure_ports?.join(", ") ?? "—"}</dd></div>
              </dl>
            )}
            {product.category === "service_provider" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="sm:col-span-2"><dt className="text-[rgba(245,245,245,0.5)]">Service types</dt><dd className="text-[#F5F5F5]">{(product as { service_types?: string[] }).service_types?.join(", ") ?? "—"}</dd></div>
              </dl>
            )}
            {product.category === "activity" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><dt className="text-[rgba(245,245,245,0.5)]">Duration</dt><dd className="text-[#F5F5F5]">{(product as { duration?: string }).duration ?? "—"}</dd></div>
                <div><dt className="text-[rgba(245,245,245,0.5)]">Difficulty</dt><dd className="text-[#F5F5F5]">{(product as { difficulty_level?: string }).difficulty_level ?? "—"}</dd></div>
                <div><dt className="text-[rgba(245,245,245,0.5)]">Minimum age</dt><dd className="text-[#F5F5F5]">{(product as { minimum_age?: number }).minimum_age ?? "—"}</dd></div>
              </dl>
            )}
            {product.category === "restaurant" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><dt className="text-[rgba(245,245,245,0.5)]">Michelin stars</dt><dd className="text-[#F5F5F5]">{(product as { michelin_stars?: number }).michelin_stars ?? "—"}</dd></div>
                <div><dt className="text-[rgba(245,245,245,0.5)]">Cuisine type</dt><dd className="text-[#F5F5F5]">{(product as { cuisine_type?: string }).cuisine_type ?? "—"}</dd></div>
                <div><dt className="text-[rgba(245,245,245,0.5)]">Dining style</dt><dd className="text-[#F5F5F5]">{(product as { dining_style?: string }).dining_style ?? "—"}</dd></div>
                <div><dt className="text-[rgba(245,245,245,0.5)]">Opening hours</dt><dd className="text-[#F5F5F5]">{(product as { opening_hours?: string }).opening_hours ?? "—"}</dd></div>
              </dl>
            )}
            {product.category === "transportation" && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><dt className="text-[rgba(245,245,245,0.5)]">Vehicle types</dt><dd className="text-[#F5F5F5]">{(product as { vehicle_types?: string[] }).vehicle_types?.join(", ") ?? "—"}</dd></div>
                <div><dt className="text-[rgba(245,245,245,0.5)]">Capacity</dt><dd className="text-[#F5F5F5]">{(product as { capacity?: number }).capacity ?? "—"}</dd></div>
              </dl>
            )}
          </div>
        )}
        {activeTab === "governance" && (
          <div className="space-y-4 max-w-3xl text-sm">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div><dt className="text-[rgba(245,245,245,0.5)]">Data ownership</dt><dd className="text-[#F5F5F5]">{product.data_ownership_level ?? "—"}</dd></div>
              <div><dt className="text-[rgba(245,245,245,0.5)]">Created by</dt><dd className="text-[#F5F5F5]">{product.created_by_name ?? product.created_by ?? "—"}</dd></div>
              <div><dt className="text-[rgba(245,245,245,0.5)]">Updated by</dt><dd className="text-[#F5F5F5]">{product.updated_by_name ?? product.updated_by ?? "—"}</dd></div>
              <div><dt className="text-[rgba(245,245,245,0.5)]">Last verified</dt><dd className="text-[#F5F5F5]">{product.last_verified ?? "—"}</dd></div>
              {product.quality_score != null && (
                <div className="sm:col-span-2">
                  <dt className="text-[rgba(245,245,245,0.5)]">Quality score</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 max-w-[200px] rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[var(--muted-success-text)] rounded-full" style={{ width: `${product.quality_score}%` }} />
                    </div>
                    <span className="text-[#F5F5F5]">{product.quality_score}%</span>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
        </div>

        <aside className="w-72 shrink-0 border-l border-[rgba(255,255,255,0.08)] bg-[#0C0C0C] p-4 overflow-y-auto max-md:hidden">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-3">Quick info</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-[rgba(245,245,245,0.5)]">Category</span><p className="text-[#F5F5F5]">{CATEGORY_LABELS[product.category]}</p></div>
            <div><span className="text-[rgba(245,245,245,0.5)]">Status</span><p className="text-[#F5F5F5] capitalize">{product.status ?? "—"}</p></div>
            <div><span className="text-[rgba(245,245,245,0.5)]">Tier</span><p className="text-[#F5F5F5]">{product.partnership_tier ? PARTNERSHIP_TIER_LABELS[product.partnership_tier] : "—"}</p></div>
            <div><span className="text-[rgba(245,245,245,0.5)]">Price range</span><p className="text-[#F5F5F5]">{product.price_range ? PRICE_RANGE_DISPLAY[product.price_range] : "—"}</p></div>
            <div><span className="text-[rgba(245,245,245,0.5)]">Verification</span><p className="text-[#F5F5F5]">{VERIFICATION_BADGES[ver]?.label ?? "—"}</p></div>
            <div><span className="text-[rgba(245,245,245,0.5)]">Data layer</span><p className="text-[#F5F5F5]">{product.data_ownership_level ?? "—"}</p></div>
          </div>
          {(product.tags?.length ?? 0) > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {product.tags!.map((t) => (
                  <span key={t} className="text-xs lowercase border border-gray-600 text-gray-400 rounded-full px-2 py-0.5">{t}</span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">Linked VICs</h3>
            <p className="text-xs text-[rgba(245,245,245,0.5)]">No VICs linked yet.</p>
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgba(245,245,245,0.5)] mb-2">Linked itineraries</h3>
            <p className="text-xs text-[rgba(245,245,245,0.5)]">No itineraries linked yet.</p>
          </div>
        </aside>
      </div>

      <DeleteProductModal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} product={product} productIds={null} onDeleted={() => router.push("/dashboard/products")} />
      <AddProductModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditModalProduct(null); }}
        product={editModalProduct}
        onSaved={() => { setEditModalOpen(false); setEditModalProduct(null); load(); }}
      />
      <CopyToAgencyModal open={copyModalOpen} onClose={() => setCopyModalOpen(false)} product={product} onCopied={() => { setCopyModalOpen(false); load(); }} />
      <EnrichProductModal open={enrichModalOpen} onClose={() => setEnrichModalOpen(false)} product={product} onEnriched={() => { setEnrichModalOpen(false); load(); }} />
      <AddToItineraryModal open={itineraryModalOpen} onClose={() => setItineraryModalOpen(false)} product={product} onAdded={() => { setItineraryModalOpen(false); }} />
    </div>
  );
}
