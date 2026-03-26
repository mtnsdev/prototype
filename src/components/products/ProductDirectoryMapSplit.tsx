"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { DirectoryProduct } from "@/types/product-directory";
import { clusterMapPins } from "./productDirectoryMapUtils";
import { directoryCategoryColors, directoryCategoryLabel, directoryProductPlaceLabel, getDirectoryCategoryPinColor } from "./productDirectoryVisual";
import {
  getTopBookableProgramByCommission,
  programDisplayCommissionRate,
  programDisplayName,
} from "./productDirectoryCommission";

function MapPinPopupCard({
  product,
  left,
  top,
  canViewCommissions,
}: {
  product: DirectoryProduct;
  left: string | number;
  top: string | number;
  canViewCommissions: boolean;
}) {
  const best = getTopBookableProgramByCommission(product);
  const bestRate = best != null ? programDisplayCommissionRate(best) : null;
  const st = directoryCategoryColors(product.type);
  const place =
    product.city && product.country ? `${product.city}, ${product.country}` : directoryProductPlaceLabel(product);
  return (
    <div
      className="pointer-events-auto absolute z-20 w-52 -translate-x-1/2 overflow-hidden rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] shadow-xl"
      style={{
        left,
        top,
        transform: "translate(-50%, calc(-100% - 10px))",
      }}
    >
      <img src={product.imageUrl} alt="" className="h-[80px] w-full object-cover" />
      <div className="p-2.5">
        <p className="truncate text-[11px] font-medium text-[#F5F0EB]">{product.name}</p>
        <p className="text-[10px] text-[#9B9590]">{place}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-[9px]"
            style={{
              background: st.bg,
              color: st.color,
              border: `1px solid ${st.border}`,
            }}
          >
            {directoryCategoryLabel(product.type)}
          </span>
          {canViewCommissions && best != null && bestRate != null && (
            <span className="text-[9px] text-[#B8976E]">
              {bestRate}% · {programDisplayName(best)}
            </span>
          )}
        </div>
      </div>
      <div
        className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-[#0c0c12]"
        aria-hidden
      />
    </div>
  );
}

type Props = {
  products: DirectoryProduct[];
  selectedId: string | null;
  clusterProducts: DirectoryProduct[] | null;
  canViewCommissions: boolean;
  onSelectProduct: (id: string) => void;
  onClusterOpen: (products: DirectoryProduct[]) => void;
  onClusterClose: () => void;
};

export default function ProductDirectoryMapSplit({
  products,
  selectedId,
  clusterProducts,
  canViewCommissions,
  onSelectProduct,
  onClusterOpen,
  onClusterClose,
}: Props) {
  const pins = useMemo(() => clusterMapPins(products, 5), [products]);

  const pinPopup = useMemo(() => {
    if (!selectedId || (clusterProducts && clusterProducts.length > 0)) return null;
    for (const pin of pins) {
      if (pin.kind === "single" && pin.product.id === selectedId) {
        return { left: pin.left, top: pin.top, product: pin.product };
      }
    }
    return null;
  }, [pins, selectedId, clusterProducts]);

  return (
    <div className="flex min-h-[min(520px,calc(100vh-220px))] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.03)] bg-[#08080c]">
      <div className="w-[40%] shrink-0 overflow-y-auto border-r border-[rgba(255,255,255,0.03)]">
        {products.map((product) => {
          const st = directoryCategoryColors(product.type);
          const selected = selectedId === product.id;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelectProduct(product.id)}
              className={cn(
                "w-full border-b border-l-2 border-b-[rgba(255,255,255,0.03)] border-l-transparent px-3 py-2.5 text-left transition-colors hover:bg-[rgba(255,255,255,0.02)]",
                selected && "border-l-[#C9A96E] bg-[rgba(201,169,110,0.06)]"
              )}
            >
              <p className="truncate text-[12px] font-medium text-[#F5F0EB]">{product.name}</p>
              <p className="text-[10px] text-[#9B9590]">{directoryProductPlaceLabel(product)}</p>
              <span
                className="mt-1 inline-block rounded px-1 py-0.5 text-[9px]"
                style={{
                  background: st.bg,
                  color: st.color,
                  border: `1px solid ${st.border}`,
                }}
              >
                {directoryCategoryLabel(product.type)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative w-[60%] min-h-[320px] flex-1 overflow-hidden rounded-r-xl bg-[#06060a]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 45%, rgba(80,90,120,0.35) 0%, transparent 55%),
              linear-gradient(180deg, #0c0c14 0%, #06060a 100%)
            `,
          }}
        />
        <svg className="pointer-events-none absolute inset-2 opacity-[0.12]" viewBox="0 0 360 180" preserveAspectRatio="xMidYMid slice">
          <path
            fill="none"
            stroke="rgba(200,195,185,0.4)"
            strokeWidth="0.4"
            d="M40 90 Q90 60 140 85 T240 80 T320 95 M50 120 Q120 100 200 115 T300 125 M30 50 Q100 40 180 55 T340 45"
          />
        </svg>

        {pinPopup && (
          <MapPinPopupCard
            product={pinPopup.product}
            left={pinPopup.left}
            top={pinPopup.top}
            canViewCommissions={canViewCommissions}
          />
        )}

        {pins.map((pin, i) => {
          if (pin.kind === "single") {
            const isSelected = selectedId === pin.product.id;
            return (
              <button
                key={pin.product.id}
                type="button"
                title={pin.product.name}
                className={cn(
                  "absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 transition-all",
                  isSelected ? "h-4 w-4 ring-2 ring-[#C9A96E] ring-offset-1 ring-offset-[#06060a]" : "hover:h-4 hover:w-4"
                )}
                style={{
                  left: pin.left,
                  top: pin.top,
                  backgroundColor: getDirectoryCategoryPinColor(pin.product.type),
                }}
                onClick={() => onSelectProduct(pin.product.id)}
              />
            );
          }
          return (
            <button
              key={`c-${i}`}
              type="button"
              className="absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#C9A96E] bg-[rgba(201,169,110,0.3)] transition-colors hover:bg-[rgba(201,169,110,0.5)]"
              style={{ left: pin.left, top: pin.top }}
              title={`${pin.products.length} products`}
              onClick={() => onClusterOpen(pin.products)}
            >
              <span className="text-[9px] font-bold text-[#C9A96E]">{pin.products.length}</span>
            </button>
          );
        })}

        {clusterProducts && clusterProducts.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 z-30 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0c0c12] p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#4A4540]">
                {clusterProducts.length} in this area
              </p>
              <button
                type="button"
                className="text-[10px] text-[#6B6560] hover:text-[#C9A96E]"
                onClick={onClusterClose}
              >
                Close
              </button>
            </div>
            <div className="max-h-36 space-y-1 overflow-y-auto">
              {clusterProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full truncate rounded-lg px-2 py-1.5 text-left text-[11px] text-[#9B9590] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#F5F0EB]"
                  onClick={() => {
                    onSelectProduct(p.id);
                    onClusterClose();
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
