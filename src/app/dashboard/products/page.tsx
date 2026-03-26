"use client";

import { Suspense } from "react";
import ProductDirectoryPage from "@/components/products/ProductDirectoryPage";

export default function ProductsDashboardPage() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <Suspense fallback={<div className="p-6 text-[rgba(245,245,245,0.5)]">Loading…</div>}>
        <ProductDirectoryPage />
      </Suspense>
    </div>
  );
}
