import { redirect } from "next/navigation";

export default function AdminPanelIndexPage() {
  redirect("/dashboard/settings/admin/users");
}
