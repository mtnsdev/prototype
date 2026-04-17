import { redirect } from "next/navigation";

export default function PartnerProgramsSettingsRedirectPage() {
  redirect("/dashboard/products?tab=partner");
}
