"use client";

import { Suspense } from "react";
import LibraryView from "@/components/library/LibraryView";

export default function DashboardLibraryPage() {
    return (
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
            <Suspense fallback={<div>Loading…</div>}>
                <LibraryView initialRootId={0} />
            </Suspense>
        </div>
    );
}
