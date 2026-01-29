"use client";

import { Suspense } from "react";
import ClaromentisSearchPanel from "@/components/search/SearchPanel";
export default function LibraryPageClient() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ClaromentisSearchPanel />;
        </Suspense>
    );
}
