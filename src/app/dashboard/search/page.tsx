"use client";

import { Suspense } from "react";
import IntranetSearchPanel from "@/components/search/SearchPanel";
export default function LibraryPageClient() {
    return (
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            <Suspense fallback={<div>Loading...</div>}>
                <IntranetSearchPanel />
            </Suspense>
        </div>
    );
}
