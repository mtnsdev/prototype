"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectoryProduct, DirectoryProductCategory } from "@/types/product-directory";
import { getPrimaryDirectoryType } from "@/components/products/directoryProductTypeHelpers";
import { clusterMapPinsGeo } from "./productDirectoryMapUtils";
import { formatProductOpeningLine } from "@/lib/productDirectoryOpening";
import {
  directoryCategoryColors,
  directoryCategoryLabel,
  directoryProductPlaceLabel,
  getDirectoryCategoryPinColor,
} from "./productDirectoryVisual";
import { DIRECTORY_PRODUCT_TYPE_CONFIG } from "./productDirectoryProductTypes";

const ProductDirectoryMapLeaflet = dynamic(() => import("./ProductDirectoryMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] w-full items-center justify-center rounded-r-xl bg-background text-xs text-muted-foreground">
      Loading map…
    </div>
  ),
});

type Props = {
  products: DirectoryProduct[];
  selectedId: string | null;
  clusterProducts: DirectoryProduct[] | null;
  canViewCommissions: boolean;
  onSelectProduct: (id: string) => void;
  onClusterOpen: (products: DirectoryProduct[]) => void;
  onClusterClose: () => void;
  externalSearchCollectionId?: string;
  externalSearchTooltip?: (productId: string) => string | undefined;
};

const SIDEBAR_ROW_EST = 52;

export default function ProductDirectoryMapSplit({
  products,
  selectedId,
  clusterProducts,
  canViewCommissions,
  onSelectProduct,
  onClusterOpen,
  onClusterClose,
  externalSearchCollectionId,
  externalSearchTooltip,
}: Props) {
  const geoPins = useMemo(() => clusterMapPinsGeo(products, 5), [products]);
  const withoutCoordsCount = useMemo(
    () => products.filter((p) => p.latitude == null || p.longitude == null).length,
    [products]
  );
  const typesOnMap = useMemo(() => {
    const s = new Set<DirectoryProductCategory>();
    for (const pin of geoPins) {
      if (pin.kind === "single") pin.product.types.forEach((t) => s.add(t));
      else pin.products.forEach((p) => p.types.forEach((t) => s.add(t)));
    }
    return s;
  }, [geoPins]);

  const splitContainerRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const [listFrac, setListFrac] = useState(0.4);
  const dragRef = useRef(false);

  const sidebarVirtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => sidebarScrollRef.current,
    estimateSize: () => SIDEBAR_ROW_EST,
    overscan: 10,
    measureElement: (el) => el.getBoundingClientRect().height,
  });
  const sidebarVirtualizerRef = useRef(sidebarVirtualizer);
  sidebarVirtualizerRef.current = sidebarVirtualizer;

  useLayoutEffect(() => {
    if (!selectedId) return;
    const idx = products.findIndex((p) => p.id === selectedId);
    if (idx < 0) return;
    sidebarVirtualizerRef.current.scrollToIndex(idx, { align: "auto" });
  }, [selectedId, products]);

  useEffect(() => {
    const onUp = () => {
      dragRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current || !splitContainerRef.current) return;
      const r = splitContainerRef.current.getBoundingClientRect();
      const x = e.clientX - r.left;
      const frac = Math.min(0.55, Math.max(0.22, x / r.width));
      setListFrac(frac);
    };
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const showMapEmpty = products.length > 0 && geoPins.length === 0;

  return (
    <div
      ref={splitContainerRef}
      className="flex min-h-[min(520px,calc(100vh-220px))] overflow-hidden rounded-xl border border-border bg-inset"
    >
      <div
        className="flex min-w-0 shrink-0 flex-col overflow-hidden border-r border-border"
        style={{ width: `${listFrac * 100}%` }}
      >
        {withoutCoordsCount > 0 ? (
          <div className="shrink-0 border-b border-border bg-[rgba(201,169,110,0.04)] px-2 py-1.5">
            <p className="text-[9px] leading-snug text-muted-foreground">
              <span className="font-medium text-brand-cta">{withoutCoordsCount}</span>{" "}
              {withoutCoordsCount === 1 ? "product has" : "products have"} no coordinates — no pins. Open details from
              this list.
            </p>
          </div>
        ) : null}
        <div ref={sidebarScrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div
            className="relative w-full"
            style={{ height: `${sidebarVirtualizer.getTotalSize()}px` }}
          >
            {sidebarVirtualizer.getVirtualItems().map((virtualRow) => {
              const product = products[virtualRow.index]!;
              const primaryType = getPrimaryDirectoryType(product);
              const st = directoryCategoryColors(primaryType);
              const selected = selectedId === product.id;
              const missingPin = product.latitude == null || product.longitude == null;
              const openingLine = formatProductOpeningLine(product);
              return (
                <div
                  key={product.id}
                  data-index={virtualRow.index}
                  ref={sidebarVirtualizer.measureElement}
                  className="pb-px"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <button
                    type="button"
                    data-map-sidebar-product={product.id}
                    data-directory-product-id={product.id}
                    onClick={() => onSelectProduct(product.id)}
                    className={cn(
                      "w-full border-b border-l-2 border-b-[rgba(255,255,255,0.03)] border-l-transparent px-2 py-1.5 text-left transition-colors hover:bg-[rgba(255,255,255,0.02)]",
                      selected && "border-l-[#C9A96E] bg-[rgba(201,169,110,0.06)]",
                      missingPin && !selected && "opacity-[0.72]"
                    )}
                  >
                    <p className="truncate text-xs font-medium leading-tight text-foreground">{product.name}</p>
                    <p className="truncate text-[9px] text-muted-foreground">{directoryProductPlaceLabel(product)}</p>
                    {openingLine ? (
                      <p className="truncate text-[8px] font-medium text-[#C9A96E]/90">{openingLine}</p>
                    ) : null}
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      <span
                        className="inline-block rounded px-1 py-px text-[8px] leading-tight"
                        style={{
                          background: st.bg,
                          color: st.color,
                          border: `1px solid ${st.border}`,
                        }}
                      >
                        {directoryCategoryLabel(primaryType)}
                        {product.types.length > 1 ? ` +${product.types.length - 1}` : ""}
                      </span>
                      {missingPin ? (
                        <span className="text-[7px] text-muted-foreground" title="No latitude/longitude on file">
                          No pin
                        </span>
                      ) : null}
                    </div>
                    {externalSearchCollectionId &&
                    product.collectionIds.includes(externalSearchCollectionId) ? (
                      <span
                        className="mt-0.5 flex items-center gap-0.5 text-[8px] text-muted-foreground"
                        title={
                          externalSearchTooltip?.(product.id) ??
                          "Saved from chat or external search to your External Search collection."
                        }
                      >
                        <Search className="h-2 w-2 shrink-0" aria-hidden />
                        Saved from search
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize list and map"
        className="group relative w-1.5 shrink-0 cursor-col-resize bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(201,169,110,0.15)]"
        onMouseDown={(e) => {
          e.preventDefault();
          dragRef.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
      />

      <div className="relative min-h-[320px] min-w-0 flex-1 overflow-hidden rounded-r-xl bg-background">
        <ProductDirectoryMapLeaflet
          geoPins={geoPins}
          selectedId={selectedId}
          listFrac={listFrac}
          canViewCommissions={canViewCommissions}
          onSelectProduct={onSelectProduct}
          onClusterOpen={onClusterOpen}
          externalSearchCollectionId={externalSearchCollectionId}
          externalSearchTooltip={externalSearchTooltip}
        />

        {showMapEmpty && (
          <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center bg-background/65 p-4 backdrop-blur-[1px]">
            <div className="max-w-[220px] rounded-lg border border-border bg-popover/95 px-3 py-2.5 text-center shadow-lg">
              <MapPin className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground/65" aria-hidden />
              <p className="text-2xs font-medium text-foreground">No pins for this list</p>
              <p className="mt-1 text-[9px] leading-snug text-muted-foreground">
                Add latitude and longitude to products to plot them on the map.
              </p>
            </div>
          </div>
        )}

        {clusterProducts && clusterProducts.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-xl border border-border bg-popover p-2.5 shadow-xl">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground/65">
                {clusterProducts.length} in this area
              </p>
              <button
                type="button"
                className="text-[9px] text-muted-foreground hover:text-brand-cta"
                onClick={onClusterClose}
              >
                Close
              </button>
            </div>
            <div className="max-h-32 space-y-0.5 overflow-y-auto">
              {clusterProducts.map((p) => {
                const clusterOpening = formatProductOpeningLine(p);
                return (
                <button
                  key={p.id}
                  type="button"
                  className="w-full rounded-md px-1.5 py-1 text-left text-2xs text-muted-foreground hover:bg-[rgba(255,255,255,0.04)] hover:text-foreground"
                  onClick={() => {
                    onSelectProduct(p.id);
                    onClusterClose();
                  }}
                >
                  <span className="block truncate">{p.name}</span>
                  {clusterOpening ? (
                    <span className="mt-0.5 block truncate text-[8px] font-medium text-[#C9A96E]/90">
                      {clusterOpening}
                    </span>
                  ) : null}
                  {externalSearchCollectionId && p.collectionIds.includes(externalSearchCollectionId) ? (
                    <span
                      className="mt-0.5 flex items-center gap-0.5 text-[8px] text-muted-foreground"
                      title={
                        externalSearchTooltip?.(p.id) ??
                        "Saved from chat or external search to your External Search collection."
                      }
                    >
                      <Search className="h-2 w-2 shrink-0" aria-hidden />
                      Saved from search
                    </span>
                  ) : null}
                </button>
              );
              })}
            </div>
          </div>
        )}

        {typesOnMap.size > 0 ? (
          <div className="pointer-events-none absolute bottom-2 left-2 right-2 z-[400] flex flex-wrap justify-center gap-x-2 gap-y-0.5 rounded-md border border-border bg-inset/92 px-2 py-1 backdrop-blur-sm">
            {DIRECTORY_PRODUCT_TYPE_CONFIG.filter((t) => typesOnMap.has(t.id)).map((t) => (
              <span key={t.id} className="inline-flex items-center gap-0.5 text-[7px] text-muted-foreground">
                <span
                  className="h-1 w-1 shrink-0 rounded-full border border-input"
                  style={{ backgroundColor: getDirectoryCategoryPinColor(t.id) }}
                  aria-hidden
                />
                {t.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
