"use client";

import { Suspense } from "react";
import ProductsPage from "@/components/products/ProductsPage";

export default function ProductsDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[rgba(245,245,245,0.5)]">Loading…</div>}>
      <ProductsPage />
    </Suspense>
  );
}
