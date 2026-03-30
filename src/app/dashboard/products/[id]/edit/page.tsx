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
        // Redirect to detail with edit mode or open modal in context; for now we redirect to list and rely on list "Edit" opening modal.
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
