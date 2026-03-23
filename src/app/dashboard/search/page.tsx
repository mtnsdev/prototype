"use client";

import { Suspense } from "react";
import IntranetSearchPanel from "@/components/search/SearchPanel";
export default function LibraryPageClient() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <IntranetSearchPanel />
        </Suspense>
    );
}
