/**
 * Product Edit Route
 *
 * This route is a transitional redirect. Currently:
 * - Loads the product by ID
 * - Redirects back to /dashboard/products/[id] (the canonical detail page)
 *
 * The detail page contains the Edit button, which opens AddProductModal.
 * To edit: Go to /dashboard/products/[id], click "Edit" button
 *
 * Future: Could open edit modal directly in this route, but currently
 * relies on the detail page's Edit action.
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchProduct } from "@/lib/products-api";
import AddProductModal from "@/components/products/Modals/AddProductModal";

export default function ProductEditRoute() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  useEffect(() => {
    if (!id) return;
    fetchProduct(id)
      .then((product) => {
        // Redirect to detail page; edit is triggered from there via button
        router.replace(`/dashboard/products/${id}`);
      })
      .catch(() => router.replace("/dashboard/products"));
  }, [id, router]);

  return (
    <div className="p-6 text-muted-foreground">
      Loading…
    </div>
  );
}
