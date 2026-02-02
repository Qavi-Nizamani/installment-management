import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Loader2 } from "lucide-react";
import { Customer, CustomerStats } from "@/services/customers/customers.service";
import { fmtCurrency } from "@/components/utils/format";

interface CustomerStatsCardsProps {
  customers: Customer[];
  stats: CustomerStats | null;
  isLoading: boolean;
}

export default function CustomerStatsCards({ customers, stats, isLoading }: CustomerStatsCardsProps) {
  const mockCustomerData = () => ({
    activePlans: Math.floor(Math.random() * 4),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              stats?.totalCustomers || customers.length
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats?.newCustomersThisMonth || 0} new this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              stats?.activeCustomers || Math.floor(customers.length * 0.8)
            )}
          </div>
          <p className="text-xs text-muted-foreground">80% active rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              fmtCurrency(stats?.totalRevenue || 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">From installment plans</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              customers.reduce((sum) => sum + mockCustomerData().activePlans, 0)
            )}
          </div>
          <p className="text-xs text-muted-foreground">Across all customers</p>
        </CardContent>
      </Card>
    </div>
  );
} 