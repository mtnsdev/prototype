"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import VICDetailPage from "@/components/vic/VICDetail/VICDetailPage";

function VICDetailInner() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  return <VICDetailPage vicId={id} />;
}

export default function VICDetailRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-[rgba(245,245,245,0.5)]">Loading…</div>}>
      <VICDetailInner />
    </Suspense>
  );
}
