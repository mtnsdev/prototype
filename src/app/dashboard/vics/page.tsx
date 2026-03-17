"use client";

import { Suspense } from "react";
import VICPage from "@/components/vic/VICPage";

export default function VICsDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[rgba(245,245,245,0.5)]">Loading…</div>}>
      <VICPage />
    </Suspense>
  );
}
