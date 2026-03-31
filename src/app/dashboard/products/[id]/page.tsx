/**
 * Canonical product detail view — full page display
 * This is the primary route for viewing complete product information.
 *
 * Related views:
 * - ProductDirectoryDetailPanel: A simpler sidebar summary view shown in the product directory.
 *   The sidebar links to this page for full details.
 * - /dashboard/products/[id]/edit: Opens the edit modal from the detail page.
 */

"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import ProductDetailPage from "@/components/products/ProductDetail/ProductDetailPage";

function ProductDetailInner() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  return <ProductDetailPage productId={id} />;
}

export default function ProductDetailRoute() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <Suspense fallback={<div className="p-6 text-muted-foreground/75">Loading…</div>}>
        <ProductDetailInner />
      </Suspense>
    </div>
  );
}
