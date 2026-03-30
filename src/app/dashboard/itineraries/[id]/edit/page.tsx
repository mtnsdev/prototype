"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ItineraryEditRoute() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  useEffect(() => {
    if (id) router.replace(`/dashboard/itineraries/${id}`);
  }, [id, router]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="p-6 text-muted-foreground/75">Redirecting…</div>
    </div>
  );
}
