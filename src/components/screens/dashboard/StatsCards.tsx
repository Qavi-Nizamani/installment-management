"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { getDashboardCardsData } from "@/services/dashboard/dashboard.analytics";
import type { DashboardCardsData } from "@/services/dashboard/dashboard.types";
import { fmtCurrency } from "@/components/utils/format";
import { useUserStore } from "@/store/user.store";

/** Format change value: backend sends percentage (e.g. 100, -100), display as "+100%", "-100%", "0%" */
function fmtPercent(percent: number): string {
  const sign = percent > 0 ? "+" : "";
  return `${sign}${Math.round(percent)}%`;
}

function buildCards(stats: DashboardCardsData) {
  const fmt = (n: number) => n.toLocaleString();
  const changeType = (n: number): "positive" | "negative" =>
    n > 0 ? "positive" : "negative";

  return [
    {
      name: "Total Revenue",
      value: fmtCurrency(stats.totalRevenue),
      change: fmtPercent(stats.totalRevenueChange),
      changeType: changeType(stats.totalRevenueChange),
      icon: DollarSign,
      description: "from last month",
    },
    {
      name: "Active Customers",
      value: fmt(stats.activeCustomers),
      change: fmtPercent(stats.activeCustomersChange),
      changeType: changeType(stats.activeCustomersChange),
      icon: Users,
      description: "from last month",
    },
    {
      name: "Active Plans",
      value: String(stats.activePlans),
      change: fmtPercent(stats.activePlansChange),
      changeType: changeType(stats.activePlansChange),
      icon: CreditCard,
      description: "from last month",
    },
    {
      name: "Pending Payments",
      value: fmtCurrency(stats.pendingPayments),
      change: fmtPercent(stats.pendingPaymentsChange),
      changeType: changeType(stats.pendingPaymentsChange),
      icon: Calendar,
      description: "from last month",
    },
    {
      name: "Monthly Profit",
      value: fmtCurrency(stats.monthlyProfit),
      change: fmtPercent(stats.monthlyProfitChange),
      changeType: changeType(stats.monthlyProfitChange),
      icon: TrendingUp,
      description: "from last month",
    },
    {
      name: "Overdue Amount",
      value: fmtCurrency(stats.overdueAmount),
      change: fmtPercent(stats.overdueAmountChange),
      changeType: changeType(stats.overdueAmountChange),
      icon: TrendingDown,
      description: "from last month",
    },
  ];
}

export function StatsCards() {
  const [stats, setStats] = useState<DashboardCardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tenantId = useUserStore((state) => state.tenant?.id);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      if (!tenantId) {
        setError("Tenant context required.");
        setLoading(false);
        return;
      }
      const response = await getDashboardCardsData(tenantId);
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error ?? "Failed to load dashboard data.");
      }
      setLoading(false);
    }
    fetchData();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded mb-2" />
              <div className="flex items-center space-x-2 mt-2">
                <div className="h-5 w-16 bg-gray-200 animate-pulse rounded" />
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <p className="font-medium">Could not load dashboard stats</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = buildCards(stats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.name} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.name}
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon className="h-4 w-4 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge
                  variant={stat.changeType === "positive" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {stat.change}
                </Badge>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </CardContent>
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 ${
                stat.changeType === "positive" ? "bg-green-500" : "bg-red-500"
              }`}
            />
          </Card>
        );
      })}
    </div>
  );
}
