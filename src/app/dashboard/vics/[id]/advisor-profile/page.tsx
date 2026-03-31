"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { VICProfilePage } from "@/components/vicProfile/VICProfilePage";

function Inner() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  return <VICProfilePage routeVicId={id} />;
}

export default function VICAdvisorProfileRoute() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <Suspense fallback={<div className="p-6 text-muted-foreground">Loading…</div>}>
        <Inner />
      </Suspense>
    </div>
  );
}
