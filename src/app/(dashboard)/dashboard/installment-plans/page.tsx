import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  CreditCard,
  DollarSign,
  User,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Installment Plans - Installment Management",
  description: "Manage installment plans and track their progress",
};

const mockPlans = [
  {
    id: "1",
    title: "iPhone 15 Pro Max",
    customerName: "Alice Johnson",
    customerInitials: "AJ",
    totalPrice: 1299.00,
    upfrontPaid: 299.00,
    financeAmount: 1000.00,
    monthlyAmount: 83.33,
    totalMonths: 12,
    monthsPaid: 5,
    startDate: "2024-01-15",
    status: "Active",
    monthlyPercentage: 2.5,
  },
  {
    id: "2",
    title: "MacBook Air M3",
    customerName: "Bob Smith",
    customerInitials: "BS",
    totalPrice: 1399.00,
    upfrontPaid: 399.00,
    financeAmount: 1000.00,
    monthlyAmount: 125.00,
    totalMonths: 8,
    monthsPaid: 3,
    startDate: "2024-02-01",
    status: "Active",
    monthlyPercentage: 3.0,
  },
  {
    id: "3",
    title: "Samsung 65\" QLED TV",
    customerName: "Carol Davis",
    customerInitials: "CD",
    totalPrice: 1899.00,
    upfrontPaid: 599.00,
    financeAmount: 1300.00,
    monthlyAmount: 108.33,
    totalMonths: 12,
    monthsPaid: 8,
    startDate: "2023-10-15",
    status: "Active",
    monthlyPercentage: 2.0,
  },
  {
    id: "4",
    title: "Gaming Setup Complete",
    customerName: "David Wilson",
    customerInitials: "DW",
    totalPrice: 2499.00,
    upfrontPaid: 499.00,
    financeAmount: 2000.00,
    monthlyAmount: 111.11,
    totalMonths: 18,
    monthsPaid: 18,
    startDate: "2023-01-10",
    status: "Completed",
    monthlyPercentage: 1.5,
  },
  {
    id: "5",
    title: "Home Office Setup",
    customerName: "Eva Brown",
    customerInitials: "EB",
    totalPrice: 899.00,
    upfrontPaid: 199.00,
    financeAmount: 700.00,
    monthlyAmount: 116.67,
    totalMonths: 6,
    monthsPaid: 2,
    startDate: "2024-01-20",
    status: "Active",
    monthlyPercentage: 4.0,
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "Active":
      return {
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
        iconColor: "text-blue-600",
      };
    case "Completed":
      return {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle2,
        iconColor: "text-green-600",
      };
    case "Overdue":
      return {
        color: "bg-red-100 text-red-800",
        icon: AlertCircle,
        iconColor: "text-red-600",
      };
    default:
      return {
        color: "bg-gray-100 text-gray-800",
        icon: Clock,
        iconColor: "text-gray-600",
      };
  }
};

export default function InstallmentPlansPage() {
  const activePlans = mockPlans.filter(p => p.status === "Active").length;
  const completedPlans = mockPlans.filter(p => p.status === "Completed").length;
  const totalFinanceAmount = mockPlans.reduce((sum, p) => sum + p.financeAmount, 0);
  const totalRevenue = mockPlans.reduce((sum, p) => sum + (p.monthsPaid * p.monthlyAmount), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Installment Plans</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all customer installment plans and payment schedules
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPlans.length}</div>
            <p className="text-xs text-muted-foreground">+2 new this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlans}</div>
            <p className="text-xs text-muted-foreground">{completedPlans} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Financed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFinanceAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From payments received</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search plans or customers..." className="pl-10" />
        </div>
        <Button variant="outline">
          Filter
        </Button>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Installment Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPlans.map((plan) => {
              const statusConfig = getStatusConfig(plan.status);
              const StatusIcon = statusConfig.icon;
              const progress = (plan.monthsPaid / plan.totalMonths) * 100;
              const remainingAmount = (plan.totalMonths - plan.monthsPaid) * plan.monthlyAmount;

              return (
                <div
                  key={plan.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`/avatars/${plan.customerInitials.toLowerCase()}.png`} />
                    <AvatarFallback>
                      {plan.customerInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {plan.customerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ${plan.totalPrice.toLocaleString()}
                        </p>
                        <Badge variant="secondary" className={statusConfig.color}>
                          <StatusIcon className={`w-3 h-3 mr-1 ${statusConfig.iconColor}`} />
                          {plan.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Monthly Payment:</span>
                        <p className="font-semibold">${plan.monthlyAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Progress:</span>
                        <p className="font-semibold">{plan.monthsPaid}/{plan.totalMonths} months</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Start Date:</span>
                        <p className="font-semibold">{new Date(plan.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Remaining:</span>
                        <p className="font-semibold text-orange-600">${remainingAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Payment Progress</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            plan.status === "Completed" ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <div>
                          <span className="text-gray-600">Upfront: </span>
                          <span className="font-semibold text-green-600">
                            ${plan.upfrontPaid.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Interest: </span>
                          <span className="font-semibold text-blue-600">
                            {plan.monthlyPercentage}%/month
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 