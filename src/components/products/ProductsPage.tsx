"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/types/product";
import type { ProductTab } from "./ProductTabBar";
import { fetchProductList, getProductId, deleteProduct, copyFromEnable } from "@/lib/products-api";
import { useUser } from "@/contexts/UserContext";
import { canEditProduct, canDeleteProduct } from "@/utils/productPermissions";
import { FAKE_PRODUCTS, filterAndPaginateFakeProducts } from "./fakeData";
import ProductTabBar from "./ProductTabBar";
import ProductToolbar from "./ProductToolbar";
import ProductListView from "./ProductListView";
import ProductCardView from "./ProductCardView";
import ProductsEmptyState from "./ProductsEmptyState";
import AddProductModal from "./Modals/AddProductModal";
import ImportProductsModal from "./Modals/ImportProductsModal";
import DeleteProductModal from "./Modals/DeleteProductModal";
import CopyToAgencyModal from "./Modals/CopyToAgencyModal";
import EnrichProductModal from "./Modals/EnrichProductModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PreviewBanner from "@/components/ui/PreviewBanner";
import { IS_PREVIEW_MODE } from "@/config/preview";

const PRODUCT_VIEW_KEY = "product_view";
const PRODUCT_SORT_KEY = "product_sortBy";
const PRODUCT_SORT_ORDER_KEY = "product_sortOrder";
const PAGE_SIZE = 20;

export default function ProductsPage() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const viewFromUrl = searchParams.get("view");
  const tabFromUrl = (searchParams.get("tab") as ProductTab) || "mine";
  const activeTab: ProductTab = tabFromUrl === "agency" || tabFromUrl === "enable" ? tabFromUrl : "mine";

  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Product["category"] | null>(null);
  const [statusFilter, setStatusFilter] = useState<Product["status"] | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [partnershipTierFilter, setPartnershipTierFilter] = useState<Product["partnership_tier"] | null>(null);
  const [priceRangeFilter, setPriceRangeFilter] = useState<Product["price_range"] | null>(null);
  const [verificationFilter, setVerificationFilter] = useState<Product["verification_status"] | null>(null);

  const [viewMode, setViewMode] = useState<"list" | "cards" | "compact">("list");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[] | null>(null);
  const [isCopyModalOpen, setCopyModalOpen] = useState(false);
  const [copyProduct, setCopyProduct] = useState<Product | null>(null);
  const [enrichModalOpen, setEnrichModalOpen] = useState(false);

  const isDev = typeof process !== "undefined" && process.env.NODE_ENV === "development";
  const currentUser = user ? { id: user.id, role: user.role, agency_id: user.agency_id } : null;

  const loadProducts = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    const params = {
      tab: activeTab,
      agency_id: user?.agency_id != null ? String(user.agency_id) : undefined,
      search: searchQuery || undefined,
      category: categoryFilter ?? undefined,
      status: statusFilter ?? undefined,
      country: countryFilter ?? undefined,
      partnership_tier: partnershipTierFilter ?? undefined,
      price_range: priceRangeFilter ?? undefined,
      verification: verificationFilter ?? undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      limit: PAGE_SIZE,
    };
    try {
      const data = await fetchProductList(params);
      const apiEmpty = !data.products?.length && (data.total ?? 0) === 0;
      if (IS_PREVIEW_MODE || apiEmpty) {
        const fake = filterAndPaginateFakeProducts(FAKE_PRODUCTS, {
          tab: activeTab,
          userId: user?.id != null ? String(user.id) : undefined,
          agencyId: user?.agency_id != null ? String(user.agency_id) : undefined,
          search: params.search,
          category: params.category,
          status: params.status ?? undefined,
          country: params.country ?? undefined,
          partnership_tier: params.partnership_tier ?? undefined,
          price_range: params.price_range ?? undefined,
          verification: params.verification ?? undefined,
          sortBy,
          sortOrder,
          page,
          limit: PAGE_SIZE,
        });
        setProducts(fake.products);
        setTotalCount(fake.total);
      } else {
        setProducts(data.products ?? []);
        setTotalCount(data.total ?? 0);
      }
    } catch (e) {
      const fake = filterAndPaginateFakeProducts(FAKE_PRODUCTS, {
        tab: activeTab,
        userId: user?.id != null ? String(user.id) : undefined,
        agencyId: user?.agency_id != null ? String(user.agency_id) : undefined,
        search: params.search,
        category: params.category,
        status: params.status ?? undefined,
        country: params.country ?? undefined,
        partnership_tier: params.partnership_tier ?? undefined,
        price_range: params.price_range ?? undefined,
        verification: params.verification ?? undefined,
        sortBy,
        sortOrder,
        page,
        limit: PAGE_SIZE,
      });
      setProducts(fake.products);
      setTotalCount(fake.total);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, user?.id, user?.agency_id, searchQuery, categoryFilter, statusFilter, countryFilter, partnershipTierFilter, priceRangeFilter, verificationFilter, sortBy, sortOrder, page, isDev]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (viewFromUrl === "cards") setViewMode("cards");
    else if (typeof window !== "undefined") {
      const stored = localStorage.getItem(PRODUCT_VIEW_KEY) as "list" | "cards" | "compact" | null;
      if (stored && (stored === "cards" || stored === "compact")) setViewMode(stored);
    }
  }, [viewFromUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = localStorage.getItem(PRODUCT_SORT_KEY);
    const o = localStorage.getItem(PRODUCT_SORT_ORDER_KEY) as "asc" | "desc" | null;
    if (s) setSortBy(s);
    if (o === "asc" || o === "desc") setSortOrder(o);
  }, []);

  const [forceCardView, setForceCardView] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const fn = () => setForceCardView(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  const effectiveViewMode = forceCardView ? "cards" : viewMode;

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCT_VIEW_KEY, viewMode);
      localStorage.setItem(PRODUCT_SORT_KEY, sortBy);
      localStorage.setItem(PRODUCT_SORT_ORDER_KEY, sortOrder);
    } catch (_) {}
  }, [viewMode, sortBy, sortOrder]);

  const hasActiveFilters =
    searchQuery !== "" ||
    categoryFilter != null ||
    statusFilter != null ||
    countryFilter != null ||
    partnershipTierFilter != null ||
    priceRangeFilter != null ||
    verificationFilter != null;
  const isEmpty = !isLoading && products.length === 0 && !hasActiveFilters;
  const noResults = !isLoading && products.length === 0 && hasActiveFilters;

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter(null);
    setStatusFilter(null);
    setCountryFilter(null);
    setPartnershipTierFilter(null);
    setPriceRangeFilter(null);
    setVerificationFilter(null);
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map((p) => getProductId(p))));
  };

  const openAdd = () => {
    setEditingProduct(null);
    setAddModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setEditingProduct(null);
    loadProducts();
  };

  const openDelete = (p: Product) => {
    setDeletingProduct(p);
    setBulkDeleteIds(null);
    setDeleteModalOpen(true);
  };

  const openBulkDelete = () => {
    setBulkDeleteIds(Array.from(selectedIds));
    setDeletingProduct(null);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingProduct(null);
    setBulkDeleteIds(null);
    setSelectedIds(new Set());
    loadProducts();
  };

  const handleCopyToAgency = (p: Product) => {
    setCopyProduct(p);
    setCopyModalOpen(true);
  };

  const closeCopyModal = () => {
    setCopyModalOpen(false);
    setCopyProduct(null);
    loadProducts();
  };

  return (
    <div className="h-full flex flex-col bg-[#0C0C0C] overflow-hidden">
      {IS_PREVIEW_MODE && <PreviewBanner feature="Product Cards" variant="full" dismissible sampleDataOnly />}
      <ProductTabBar activeTab={activeTab} />
      <ProductToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        countryFilter={countryFilter}
        onCountryChange={setCountryFilter}
        partnershipTierFilter={partnershipTierFilter ?? null}
        onPartnershipTierChange={setPartnershipTierFilter}
        priceRangeFilter={priceRangeFilter ?? null}
        onPriceRangeChange={setPriceRangeFilter}
        verificationFilter={verificationFilter ?? null}
        onVerificationChange={setVerificationFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => {
          setSortBy(by);
          setSortOrder(order);
        }}
        onAddProduct={activeTab === "mine" ? openAdd : undefined}
        onImportCSV={() => setImportModalOpen(true)}
        onClearFilters={clearFilters}
        bulkSelectedCount={selectedIds.size}
        onBulkDelete={selectedIds.size > 0 ? openBulkDelete : undefined}
        onBulkEnrich={selectedIds.size > 0 ? () => setEnrichModalOpen(true) : undefined}
        onBulkExport={selectedIds.size > 0 ? () => {} : undefined}
        isEnableTab={activeTab === "enable"}
      />

      {error && (
        <div className="px-4 py-2 text-sm text-[var(--muted-amber-text)] bg-[var(--muted-amber-bg)] border-b border-[var(--muted-amber-border)]">
          {error}
        </div>
      )}

      {(isEmpty || noResults) && (
        <ProductsEmptyState
          hasNoProducts={isEmpty}
          tab={activeTab}
          onAddProduct={activeTab === "mine" ? openAdd : undefined}
          onImportCSV={() => setImportModalOpen(true)}
          onClearFilters={noResults ? clearFilters : undefined}
        />
      )}

      {!isEmpty && !noResults && (
        <>
          {effectiveViewMode === "list" && (
            <div className="flex-1 overflow-auto">
              <ProductListView
                products={products}
                isLoading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(by, order) => {
                  setSortBy(by);
                  setSortOrder(order);
                }}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onEdit={openEdit}
                onDelete={openDelete}
                onCopyToAgency={activeTab === "enable" ? handleCopyToAgency : undefined}
                canEdit={(p) => canEditProduct(currentUser, p)}
                canDelete={(p) => canDeleteProduct(currentUser, p)}
                isEnableTab={activeTab === "enable"}
                searchQuery={searchQuery}
              />
            </div>
          )}
          {(viewMode === "cards" || viewMode === "compact") && (
            <div className="flex-1 overflow-auto">
              <ProductCardView
                products={products}
                isLoading={isLoading}
                user={currentUser}
                isEnableTab={activeTab === "enable"}
                compact={effectiveViewMode === "compact"}
                onEdit={openEdit}
                onDelete={openDelete}
                onCopyToAgency={activeTab === "enable" ? handleCopyToAgency : undefined}
                searchQuery={searchQuery}
              />
            </div>
          )}
        </>
      )}

      <AddProductModal open={isAddModalOpen} onClose={closeAddModal} product={editingProduct} onSaved={closeAddModal} />
      <ImportProductsModal open={isImportModalOpen} onClose={() => setImportModalOpen(false)} onImported={loadProducts} />
      <DeleteProductModal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        product={deletingProduct}
        productIds={bulkDeleteIds}
        onDeleted={closeDeleteModal}
      />
      <CopyToAgencyModal open={isCopyModalOpen} onClose={closeCopyModal} product={copyProduct} onCopied={closeCopyModal} />
      <EnrichProductModal
        open={enrichModalOpen}
        onClose={() => setEnrichModalOpen(false)}
        product={null}
        products={enrichModalOpen && selectedIds.size > 0 ? products.filter((p) => selectedIds.has(getProductId(p))) : undefined}
        onEnriched={() => { setEnrichModalOpen(false); setSelectedIds(new Set()); loadProducts(); }}
      />
    </div>
  );
}
