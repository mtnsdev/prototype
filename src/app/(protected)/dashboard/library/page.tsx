"use client";

import { useSearchParams } from "next/navigation";
import LibraryView from "@/components/library/LibraryView";

export default function LibraryPageClient() {
    const sp = useSearchParams();
    const root = sp.get("root");

    const rootId =
        root && root.trim() !== "" && Number.isFinite(Number(root))
            ? Number(root)
            : undefined;

    return <LibraryView initialRootId={rootId} />;
}
