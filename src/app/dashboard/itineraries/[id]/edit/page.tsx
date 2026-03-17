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

  return <div className="p-6 text-[rgba(245,245,245,0.5)]">Redirecting…</div>;
}
