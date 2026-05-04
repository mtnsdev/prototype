"use client";

import BriefingRoomPage from "@/components/briefing/BriefingRoomPage";

/**
 * `/dashboard` — full-screen Claire chat surface.
 * Implementation lives in `BriefingRoomPage` (kept for backwards-compat with
 * the `/dashboard/briefing-room` route). The ClaireFab hides on this path
 * because Claire IS the page here.
 */
export default function DashboardIndexPage() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <BriefingRoomPage />
    </div>
  );
}
