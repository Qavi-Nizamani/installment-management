import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

const mockData = [
  { month: "Jan", revenue: 4500, profit: 1800 },
  { month: "Feb", revenue: 5200, profit: 2100 },
  { month: "Mar", revenue: 4800, profit: 1900 },
  { month: "Apr", revenue: 6100, profit: 2400 },
  { month: "May", revenue: 5800, profit: 2300 },
  { month: "Jun", revenue: 6800, profit: 2700 },
];

export function RevenueChart() {
  const maxRevenue = Math.max(...mockData.map(d => d.revenue));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Revenue Overview
          <Badge variant="secondary" className="ml-2">
            <TrendingUp className="w-3 h-3 mr-1" />
            +12.5%
          </Badge>
        </CardTitle>
        <CardDescription>
          Monthly revenue and profit trends for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockData.map((item) => (
            <div key={item.month} className="flex items-center space-x-4">
              <div className="w-8 text-xs font-medium text-gray-600">
                {item.month}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-medium">${item.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(item.revenue / maxRevenue) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Profit</span>
                  <span className="font-medium text-green-600">${item.profit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-green-500 h-1 rounded-full"
                    style={{
                      width: `${(item.profit / maxRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 