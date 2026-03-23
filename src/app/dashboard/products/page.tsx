"use client";

import { Suspense } from "react";
import ProductsPage from "@/components/products/ProductsPage";
import ProductDirectoryPage from "@/components/products/ProductDirectoryPage";
import { IS_PREVIEW_MODE } from "@/config/preview";

export default function ProductsDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[rgba(245,245,245,0.5)]">Loading…</div>}>
      {IS_PREVIEW_MODE ? <ProductDirectoryPage /> : <ProductsPage />}
    </Suspense>
  );
}
