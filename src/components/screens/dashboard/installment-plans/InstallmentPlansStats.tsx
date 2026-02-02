import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign, TrendingUp, FileText } from "lucide-react";
import type { InstallmentPlan } from "@/types/installment-plans";
import { AvailableFundsCard } from "../capital/AvailableFundsCard";
import { fmtCurrency } from "@/components/utils/format";

interface InstallmentPlansStatsProps {
  plans: InstallmentPlan[];
  /** Refetch available funds when this changes */
  fundsRefreshTrigger?: number;
}

export function InstallmentPlansStats({ plans, fundsRefreshTrigger }: InstallmentPlansStatsProps) {
  // Calculate stats from plans data
  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.status === 'ACTIVE').length;
  const completedPlans = plans.filter(p => p.status === 'COMPLETED').length;
  
  // Separate stats by business model
  const productOwnerPlans = plans.filter(p => p.business_model === 'PRODUCT_OWNER');
  const financerOnlyPlans = plans.filter(p => p.business_model === 'FINANCER_ONLY');
  
  // Calculate revenue based on business model
  const totalMyRevenue = plans.reduce((sum, p) => sum + (p.my_revenue || 0), 0);
  const totalFinanceAmount = plans.reduce((sum, p) => sum + p.finance_amount, 0);

  // Calculate new plans this month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const newPlansThisMonth = plans.filter(plan => {
    const createdDate = new Date(plan.created_at);
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <AvailableFundsCard showLink refreshTrigger={fundsRefreshTrigger} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
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
          <div className="text-2xl font-bold">{fmtCurrency(totalFinanceAmount)}</div>
          <p className="text-xs text-muted-foreground">
            Across all plans
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">My Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fmtCurrency(totalMyRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            {productOwnerPlans.length > 0 && financerOnlyPlans.length > 0 
              ? `${productOwnerPlans.length} owned, ${financerOnlyPlans.length} financed`
              : productOwnerPlans.length > 0 
                ? 'Product sales + profit'
                : 'Profit only'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 