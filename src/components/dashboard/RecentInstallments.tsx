import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Clock, CheckCircle, AlertCircle } from "lucide-react";

type InstallmentStatus = "PAID" | "PENDING" | "OVERDUE";

const recentInstallments = [
  {
    id: "1",
    customerName: "Alice Johnson",
    customerInitials: "AJ",
    amount: 450.00,
    dueDate: "2024-01-15",
    status: "PAID" as InstallmentStatus,
    planTitle: "iPhone 15 Pro",
  },
  {
    id: "2",
    customerName: "Bob Smith",
    customerInitials: "BS",
    amount: 320.00,
    dueDate: "2024-01-16",
    status: "PENDING" as InstallmentStatus,
    planTitle: "MacBook Air",
  },
  {
    id: "3",
    customerName: "Carol Davis",
    customerInitials: "CD",
    amount: 280.00,
    dueDate: "2024-01-12",
    status: "OVERDUE" as InstallmentStatus,
    planTitle: "Samsung TV",
  },
  {
    id: "4",
    customerName: "David Wilson",
    customerInitials: "DW",
    amount: 150.00,
    dueDate: "2024-01-18",
    status: "PENDING" as InstallmentStatus,
    planTitle: "Gaming Chair",
  },
  {
    id: "5",
    customerName: "Eva Brown",
    customerInitials: "EB",
    amount: 680.00,
    dueDate: "2024-01-14",
    status: "PAID" as InstallmentStatus,
    planTitle: "Laptop Dell",
  },
];

const statusConfig: Record<InstallmentStatus, {
  color: string;
  icon: typeof CheckCircle;
  iconColor: string;
}> = {
  PAID: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    iconColor: "text-green-600",
  },
  PENDING: {
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    iconColor: "text-yellow-600",
  },
  OVERDUE: {
    color: "bg-red-100 text-red-800",
    icon: AlertCircle,
    iconColor: "text-red-600",
  },
};

export function RecentInstallments() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Recent Installments
          <Button variant="ghost" size="sm">
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardTitle>
        <CardDescription>
          Latest installment payments and upcoming due dates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentInstallments.map((installment) => {
            const StatusIcon = statusConfig[installment.status].icon;
            return (
              <div
                key={installment.id}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`/avatars/${installment.customerInitials.toLowerCase()}.png`} />
                  <AvatarFallback className="text-sm">
                    {installment.customerInitials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {installment.customerName}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      ${installment.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {installment.planTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      Due: {new Date(installment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <StatusIcon className={`h-4 w-4 ${statusConfig[installment.status].iconColor}`} />
                  <Badge
                    variant="secondary"
                    className={statusConfig[installment.status].color}
                  >
                    {installment.status.toLowerCase()}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 