"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LibraryView from "@/components/library/LibraryView";

function LibraryPageContent() {
    const sp = useSearchParams();
    const root = sp.get("root");

    const rootId =
        root && root.trim() !== "" && Number.isFinite(Number(root))
            ? Number(root)
            : undefined;

    return <LibraryView initialRootId={rootId} />;
}

export default function LibraryPageClient() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LibraryPageContent />
        </Suspense>
    );
}
