"use client";

import { Suspense } from "react";
import GlobalSearchPanel from "@/components/search/GlobalSearchPanel";

export default function DashboardSearchPage() {
    return (
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            <Suspense fallback={<div className="flex items-center justify-center">Loading…</div>}>
                <GlobalSearchPanel />
            </Suspense>
        </div>
    );
}
