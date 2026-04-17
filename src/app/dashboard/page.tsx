import { redirect } from "next/navigation";
import { BRIEFING_ROOM_PATH } from "@/lib/briefingRoutes";

export default function DashboardIndexPage() {
  redirect(BRIEFING_ROOM_PATH);
}
