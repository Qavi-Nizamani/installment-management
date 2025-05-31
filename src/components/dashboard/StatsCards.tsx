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

const stats = [
  {
    name: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1%",
    changeType: "positive" as const,
    icon: DollarSign,
    description: "from last month",
  },
  {
    name: "Active Customers",
    value: "2,234",
    change: "+180.1%",
    changeType: "positive" as const,
    icon: Users,
    description: "from last month",
  },
  {
    name: "Active Plans",
    value: "12,234",
    change: "+19%",
    changeType: "positive" as const,
    icon: CreditCard,
    description: "from last month",
  },
  {
    name: "Pending Payments",
    value: "$3,429.89",
    change: "-4.3%",
    changeType: "negative" as const,
    icon: Calendar,
    description: "from last month",
  },
  {
    name: "Monthly Profit",
    value: "$8,239.43",
    change: "+25.2%",
    changeType: "positive" as const,
    icon: TrendingUp,
    description: "from last month",
  },
  {
    name: "Overdue Amount",
    value: "$1,429.75",
    change: "-12.5%",
    changeType: "negative" as const,
    icon: TrendingDown,
    description: "from last month",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => {
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