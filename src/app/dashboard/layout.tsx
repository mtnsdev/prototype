import DashboardFrame from "@/components/dashboard/DashboardFrame";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <DashboardFrame>{children}</DashboardFrame>;
}
