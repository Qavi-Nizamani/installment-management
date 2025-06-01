import { Metadata } from "next";
import { StatsCards } from "@/components/screens/dashboard/StatsCards";
import { RevenueChart } from "@/components/screens/dashboard/RevenueChart";
import { RecentInstallments } from "@/components/screens/dashboard/RecentInstallments";
import { OverdueAlert } from "@/components/screens/dashboard/OverdueAlert";

export const metadata: Metadata = {
  title: "Dashboard - Installment Management",
  description: "Overview of your installment tracking business",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* Overdue Alert */}
      <OverdueAlert />

      {/* Stats Cards */}
      <StatsCards />

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <RecentInstallments />
      </div>
    </div>
  );
} 