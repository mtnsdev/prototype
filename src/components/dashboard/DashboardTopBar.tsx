"use client";

import Link from "next/link";
import { Search, Settings } from "lucide-react";
import { useGlobalSearchOptional } from "@/contexts/GlobalSearchContext";
import { cn } from "@/lib/utils";

export default function DashboardTopBar() {
  const search = useGlobalSearchOptional();
  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-end gap-3 px-6 py-3",
        "border-b border-border bg-background/80 backdrop-blur-sm"
      )}
    >
      <button
        type="button"
        onClick={() => search?.openSearch()}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.02)] border border-border text-xs text-muted-foreground/65 hover:text-muted-foreground hover:border-border transition-colors"
      >
        <Search className="w-3 h-3" />
        <span>Search</span>
        <kbd className="text-[8px] ml-1 border border-border rounded px-1 py-0.5">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={() => search?.openSearch()}
        className="sm:hidden p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] text-muted-foreground"
        aria-label="Open search"
      >
        <Search className="w-4 h-4" />
      </button>
      <Link
        href="/dashboard/settings"
        className="rounded-lg p-1.5 text-muted-foreground/65 transition-colors hover:bg-[rgba(255,255,255,0.03)] hover:text-muted-foreground"
        aria-label="Settings"
      >
        <Settings className="h-4 w-4" />
      </Link>
    </div>
  );
}
