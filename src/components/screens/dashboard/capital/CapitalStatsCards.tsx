import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Loader2,
  Coins,
  Building2,
  CircleDollarSign,
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash In Hand</CardTitle>
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
            Net cash from ledger (all movements)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Money with Customers</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              fmtCurrency(stats?.capitalDeployed ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Unrecovered principal (installments)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit Earned</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              fmtCurrency(stats?.profitPaid ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Sum of profit paid (installments)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Your Invested Money</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              fmtCurrency(stats?.equity ?? 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Investments − Withdrawals
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
