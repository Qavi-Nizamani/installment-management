import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Clock, DollarSign, TrendingUp } from "lucide-react";
import { type InstallmentPlan } from "@/services/installment-plans/installmentPlans.service";

interface InstallmentPlansStatsProps {
  plans: InstallmentPlan[];
}

export function InstallmentPlansStats({ plans }: InstallmentPlansStatsProps) {
  // Calculate stats from plans data
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.status === 'ACTIVE').length;
  const completedPlans = plans.filter(p => p.status === 'COMPLETED').length;
  
  const totalFinanceAmount = plans.reduce((sum, p) => sum + p.finance_amount, 0);
  const totalRevenue = plans.reduce((sum, p) => sum + (p.total_paid || 0), 0);

  // Calculate new plans this month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const newPlansThisMonth = plans.filter(plan => {
    const createdDate = new Date(plan.created_at);
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPlans}</div>
          <p className="text-xs text-muted-foreground">
            +{newPlansThisMonth} new this month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activePlans}</div>
          <p className="text-xs text-muted-foreground">
            {completedPlans} completed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Financed</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalFinanceAmount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Across all plans</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalRevenue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">From payments received</p>
        </CardContent>
      </Card>
    </div>
  );
} 