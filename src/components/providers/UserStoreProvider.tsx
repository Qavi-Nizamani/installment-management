"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/store/user.store";

interface UserStoreProviderProps {
  children: React.ReactNode;
}

const SUBSCRIPTION_UPGRADE_PATH = "/dashboard/settings/subscription";

export function UserStoreProvider({ children }: UserStoreProviderProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const loadingHints = [
    "Checking your workspace setup",
    "Making sure everything is ready",
    "Almost there",
  ];
  const [loadingHintIndex, setLoadingHintIndex] = useState(0);
  const {
    setUser,
    fetchSubscription,
    fetchTenantContext,
    reset,
    subscription,
    needsOnboarding,
  } = useUserStore();

  useEffect(() => {
    if (loading) return;

    if (user) {
      setUser(user);
      void (async () => {
        await fetchTenantContext();
        await fetchSubscription();
      })();
    } else {
      reset();
    }
  }, [user, loading, setUser, fetchTenantContext, fetchSubscription, reset]);

  useEffect(() => {
    if (loading || !needsOnboarding) return;
    router.replace("/onboarding/setup-workspace");
  }, [loading, needsOnboarding, router]);

  const isTrialExpired =
    subscription?.status === "expired" && !subscription?.provider_subscription_id;
  const isOnUpgradePage = pathname?.startsWith(SUBSCRIPTION_UPGRADE_PATH);

  useEffect(() => {
    if (isTrialExpired && !isOnUpgradePage) {
      router.replace(`${SUBSCRIPTION_UPGRADE_PATH}?trial_expired=1`);
    }
  }, [isTrialExpired, isOnUpgradePage, router]);

  useEffect(() => {
    if (subscription) return;
    const interval = setInterval(() => {
      setLoadingHintIndex((prev) => (prev + 1) % loadingHints.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [subscription, loadingHints.length]);

  if (!subscription) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-6">
        <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-gray-900">
            {loadingHints[loadingHintIndex]}
          </span>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
