import { redirect } from "next/navigation";

/** Layout is customized from the Briefing Room (gear icon), not this route. */
export default function DashboardLayoutSettingsRedirectPage() {
    redirect("/dashboard");
}
