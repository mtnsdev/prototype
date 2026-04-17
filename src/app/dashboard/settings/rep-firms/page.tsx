import { redirect } from "next/navigation";

export default function RepFirmsSettingsRedirectPage() {
  redirect("/dashboard/products?tab=rep-firms");
}
