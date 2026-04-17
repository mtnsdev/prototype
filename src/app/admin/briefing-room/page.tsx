"use client";

import BriefingRoomV1AdminPage from "@/components/briefing/v1/BriefingRoomV1AdminPage";

export default function AdminBriefingRoomPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 md:px-10">
        <BriefingRoomV1AdminPage />
      </div>
    </div>
  );
}
