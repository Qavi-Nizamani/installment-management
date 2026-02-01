"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Loader2 } from "lucide-react";
import { getCapitalStats } from "@/services/capital/capital.service";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface AvailableFundsCardProps {
  /** Show link to Capital page. Default: false */
  showLink?: boolean;
  /** Custom class for the card container */
  className?: string;
  /** Refetch when this value changes (e.g. plans count after create/delete) */
  refreshTrigger?: number | string;
}

export function AvailableFundsCard({ showLink = false, className, refreshTrigger }: AvailableFundsCardProps) {
  const [availableFunds, setAvailableFunds] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getCapitalStats().then((response) => {
      if (mounted && response.success && response.data) {
        setAvailableFunds(response.data.availableFunds);
      }
      if (mounted) setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  const card = (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Available Funds</CardTitle>
        <Coins className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            formatCurrency(availableFunds ?? 0)
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Capital Balance + Retained Earnings − Capital Deployed
          {showLink && (
            <>
              {" · "}
              <Link
                href="/finance/capital"
                className="text-primary hover:underline"
              >
                View capital
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );

  return card;
}
