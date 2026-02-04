import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PiggyBank, TrendingUp, TrendingDown, SlidersHorizontal } from "lucide-react";
import { CapitalLedgerEntry, CapitalLedgerType } from "@/services/capital/capital.service";
import { fmtCurrency, fmtDate } from "@/components/utils/format";

interface CapitalListProps {
  entries: CapitalLedgerEntry[];
  isLoading: boolean;
}


function TypeBadge({ type }: { type: CapitalLedgerType }) {
  const config = {
    INVESTMENT: { icon: TrendingUp, variant: "default" as const, label: "Investment" },
    WITHDRAWAL: { icon: TrendingDown, variant: "destructive" as const, label: "Withdrawal" },
    ADJUSTMENT: { icon: SlidersHorizontal, variant: "secondary" as const, label: "Adjustment" },
  };
  const { icon: Icon, variant, label } = config[type];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export default function CapitalList({ entries, isLoading }: CapitalListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ledger History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ledger History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <PiggyBank className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No capital entries yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first investment to start tracking your business capital.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ledger History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const amount = Number(entry.amount);
              const isNegative = amount < 0;
              const isOutflow = entry.type === "WITHDRAWAL" || isNegative;
              const sign = isOutflow ? "-" : "+";
              const displayAmount = Math.abs(amount);

              return (
                <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground">
                  {fmtDate(entry.created_at)}
                </TableCell>
                <TableCell>
                  <TypeBadge type={entry.type} />
                </TableCell>
                <TableCell
                  className={
                    isOutflow
                      ? "font-medium text-red-600"
                      : "font-medium"
                  }
                >
                  {sign}
                  {fmtCurrency(displayAmount)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {entry.notes || "—"}
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
