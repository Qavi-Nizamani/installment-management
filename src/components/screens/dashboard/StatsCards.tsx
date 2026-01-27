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
// import { useEffect, useState } from "react";
import { getDashboardCardsData } from "@/services/dashboard/dashboard.analytics";
import { DashboardCardsData } from "@/services/dashboard/dashboard.types";



export async function StatsCards() {
  // const [stats, setStats] = useState<DashboardCardsData | null>(null);
  // useEffect(() => {
  //     const fetchDashboardCardsData = async () => {
  //       const response = await getDashboardCardsData();
  //       if (response.success) {
  //         setStats(response.data);
  //       } else {
  //         console.error(response.error);
  //       }
  //     };
  //   fetchDashboardCardsData();
  // }, []);

  let stats: DashboardCardsData | null = null;
  const response = await getDashboardCardsData();
  if (response.success) {
    stats = response.data || null;
    console.log("stats", stats)
  } else {
    console.error(response.error);
  }

  const cards = [
    {
      name: "Total Revenue",
      value: "₨." + stats?.totalRevenue.toLocaleString() || 0,
      change: "₨." + stats?.totalRevenueChange.toLocaleString() || 0,
      changeType: stats?.totalRevenueChange && stats?.totalRevenueChange > 0 ? "positive" as const : "negative" as const,
      icon: DollarSign,
      description: "from last month",
    },
    {
      name: "Active Customers",
      value: stats?.activeCustomers.toLocaleString() || 0,
      change: stats?.activeCustomersChange || 0,
      changeType: stats?.activeCustomersChange && stats?.activeCustomersChange > 0 ? "positive" as const : "negative" as const,
      icon: Users,
      description: "from last month",
    },
    {
      name: "Active Plans",
      value: stats?.activePlans || 0,
      change: stats?.activePlansChange || 0,
      changeType: stats?.activePlansChange && stats?.activePlansChange > 0 ? "positive" as const : "negative" as const,
      icon: CreditCard,
      description: "from last month",
    },
    {
      name: "Pending Payments",
      value: "₨." + stats?.pendingPayments || 0,
      change: "₨." + stats?.pendingPaymentsChange || 0,
      changeType: stats?.pendingPaymentsChange && stats?.pendingPaymentsChange > 0 ? "positive" as const : "negative" as const,
      icon: Calendar,
      description: "from last month",
    },
    {
      name: "Monthly Profit",
      value: "₨." + stats?.monthlyProfit || 0,
      change: "₨." + stats?.monthlyProfitChange || 0,
      changeType: stats?.monthlyProfitChange && stats?.monthlyProfitChange > 0 ? "positive" as const : "negative" as const,
      icon: TrendingUp,
      description: "from last month",
    },
    {
      name: "Overdue Amount",
      value: "₨." + stats?.overdueAmount || 0,
      change: "₨." + stats?.overdueAmountChange || 0,
      changeType: stats?.overdueAmountChange && stats?.overdueAmountChange > 0 ? "positive" as const : "negative" as const,
      icon: TrendingDown,
      description: "from last month",
    },
  ];
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
              className={`absolute bottom-0 left-0 right-0 h-1 ${stat.changeType === "positive" ? "bg-green-500" : "bg-red-500"
                }`}
            />
          </Card>
        );
      })}
    </div>
  );
} 