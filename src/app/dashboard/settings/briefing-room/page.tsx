import { redirect } from "next/navigation";

/** Briefing CMS lives on `/admin/briefing-room`; advisors use `/dashboard/briefing-room`. */
export default function BriefingRoomSettingsRedirectPage() {
  redirect("/admin/briefing-room");
}
