import DashboardFrame from "@/components/dashboard/DashboardFrame";

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return <DashboardFrame>{children}</DashboardFrame>;
}
