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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <Suspense fallback={<div className="p-6 text-muted-foreground/75">Loading…</div>}>
        <VICDetailInner />
      </Suspense>
    </div>
  );
}
