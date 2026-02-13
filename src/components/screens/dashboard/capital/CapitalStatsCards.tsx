import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
  Coins,
} from "lucide-react";
import { CapitalStats } from "@/services/capital/capital.service";
import { fmtCurrency } from "@/components/utils/format";

interface CapitalStatsCardsProps {
  stats: CapitalStats | null;
  isLoading: boolean;
}

export default function CapitalStatsCards({
  stats,
  isLoading,
}: CapitalStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash Available</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              fmtCurrency(stats?.availableFunds ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Capital Balance − Capital Deployed (principal only)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              fmtCurrency(stats?.balance ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Investment - Withdrawal + Adjustment
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
              fmtCurrency(stats?.totalInvestment ?? 0)
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
              fmtCurrency(stats?.totalWithdrawal ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">Capital removed</p>
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
              fmtCurrency(stats?.totalAdjustment ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">Corrections applied</p>
        </CardContent>
      </Card>
    </div>
  );
}
