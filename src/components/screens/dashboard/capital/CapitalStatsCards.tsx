import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
  Banknote,
} from "lucide-react";
import { CapitalStats } from "@/services/capital/capital.service";

interface CapitalStatsCardsProps {
  stats: CapitalStats | null;
  isLoading: boolean;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function CapitalStatsCards({
  stats,
  isLoading,
}: CapitalStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Owner Capital</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              formatCurrency(stats?.ownerCapital ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Investment + Adjustment (withdrawals deducted from Retained Earnings first)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Retained Earnings</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              formatCurrency(stats?.retainedEarnings ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Earnings after withdrawals (from installment collections)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              formatCurrency(stats?.totalInvestment ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">Capital added</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Withdrawal</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              formatCurrency(stats?.totalWithdrawal ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">Deducted from Retained Earnings first, then Owner Capital</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Adjustments</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              formatCurrency(stats?.totalAdjustment ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">Corrections applied</p>
        </CardContent>
      </Card>
    </div>
  );
}
