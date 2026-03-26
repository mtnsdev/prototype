"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Settings } from "lucide-react";
import { useGlobalSearchOptional } from "@/contexts/GlobalSearchContext";
import DashboardNotifications from "@/components/dashboard/DashboardNotifications";
import { cn } from "@/lib/utils";

export default function DashboardTopBar() {
  const pathname = usePathname();
  const search = useGlobalSearchOptional();
  const isBriefing = pathname === "/dashboard";

  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-end gap-3 px-6 py-3",
        "border-b border-[rgba(255,255,255,0.03)] bg-[#08080c]/80 backdrop-blur-sm"
      )}
    >
      <button
        type="button"
        onClick={() => search?.openSearch()}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-[11px] text-[#4A4540] hover:text-[#6B6560] hover:border-[rgba(255,255,255,0.06)] transition-colors"
      >
        <Search className="w-3 h-3" />
        <span>Search</span>
        <kbd className="text-[8px] ml-1 border border-[rgba(255,255,255,0.06)] rounded px-1 py-0.5">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={() => search?.openSearch()}
        className="sm:hidden p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] text-[#6B6560]"
        aria-label="Open search"
      >
        <Search className="w-4 h-4" />
      </button>
      <DashboardNotifications />
      {isBriefing && (
        <Link
          href="/dashboard/settings"
          className="p-1.5 rounded-lg text-[#4A4540] hover:text-[#6B6560] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
