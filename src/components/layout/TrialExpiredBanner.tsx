"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useUserStore } from "@/store/user.store";
import Link from "next/link";

export function TrialExpiredBanner() {
  const subscription = useUserStore((s) => s.subscription);

  if (!subscription?.isTrialExpired) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 rounded-none border-x-0 border-t-0">

      <AlertDescription className="text-amber-700">
        <div className="flex items-center justify-between mt-1 gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <div>
            Your trial has expired. Upgrade to continue using all features.
          </div>
          <Link href="/dashboard/settings/subscription">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}
