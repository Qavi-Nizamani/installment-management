import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreHorizontal, 
  User,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { type InstallmentPlan } from "@/services/installment-plans/installmentPlans.service";

interface InstallmentPlansListProps {
  plans: InstallmentPlan[];
  loading: boolean;
  onPlanUpdated: () => void;
  onPlanDeleted: () => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return {
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
        iconColor: "text-blue-600",
      };
    case "COMPLETED":
      return {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle2,
        iconColor: "text-green-600",
      };
    case "OVERDUE":
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

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function InstallmentPlansList({ 
  plans, 
  loading, 
}: InstallmentPlansListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Installment Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Installment Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Clock className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No installment plans found</h3>
            <p className="text-gray-600">
              Get started by creating your first installment plan.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Installment Plans</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {plans.map((plan) => {
            const statusConfig = getStatusConfig(plan.status || 'ACTIVE');
            const StatusIcon = statusConfig.icon;
            const progress = plan.total_months > 0 
              ? ((plan.months_paid || 0) / plan.total_months) * 100 
              : 0;
            const remainingAmount = plan.remaining_amount || 0;
            const customerName = plan.customer?.name || 'Unknown Customer';
            const customerInitials = getInitials(customerName);

            return (
              <div
                key={plan.id}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`/avatars/${customerInitials.toLowerCase()}.png`} />
                  <AvatarFallback>
                    {customerInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${plan.total_price.toLocaleString()}
                      </p>
                      <Badge variant="secondary" className={statusConfig.color}>
                        <StatusIcon className={`w-3 h-3 mr-1 ${statusConfig.iconColor}`} />
                        {plan.status || 'Active'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Monthly Payment:</span>
                      <p className="font-semibold">
                        ${(plan.monthly_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Progress:</span>
                      <p className="font-semibold">
                        {plan.months_paid || 0}/{plan.total_months} months
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Start Date:</span>
                      <p className="font-semibold">
                        {new Date(plan.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Remaining:</span>
                      <p className="font-semibold text-orange-600">
                        ${remainingAmount.toFixed(2)}
                      </p>
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
                          plan.status === "COMPLETED" ? "bg-green-500" : "bg-blue-500"
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
                          ${plan.upfront_paid.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Interest: </span>
                        <span className="font-semibold text-blue-600">
                          {plan.monthly_percentage}%/month
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
  );
} 