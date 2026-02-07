"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/supabase/database/client";
import { useUserStore } from "@/store/user.store";
import type { PlanCode } from "@/types/subscription";

const paidPlans: PlanCode[] = ["STARTER", "PRO"];

const planLabels: Record<PlanCode, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
};

export default function SubscriptionPricing() {
  const searchParams = useSearchParams();
  const tenant = useUserStore((state) => state.tenant);
  const subscription = useUserStore((state) => state.subscription);
  const fetchSubscription = useUserStore((state) => state.fetchSubscription);
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const checkoutSuccess = searchParams.get("checkout") === "success";

  useEffect(() => {
    if (!checkoutSuccess || !tenant?.id) {
      return;
    }

    let isHandled = false;
    const supabase = createClient();

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsConfirming(true);

    const channel = supabase
      .channel(`subscription:${tenant.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subscriptions",
          filter: `tenant_id=eq.${tenant.id}`,
        },
        async () => {
          if (isHandled) {
            return;
          }
          isHandled = true;
          await fetchSubscription();
          setSuccessMessage("Subscription confirmed. Your plan is now active.");
          setErrorMessage(null);
          setIsConfirming(false);
          supabase.removeChannel(channel);
        }
      )
      .subscribe();

    const timeoutId = setTimeout(() => {
      if (isHandled) {
        return;
      }
      isHandled = true;
      setErrorMessage(
        "We could not confirm the upgrade yet. Please refresh or contact support."
      );
      setIsConfirming(false);
      supabase.removeChannel(channel);
    }, 30000);

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [checkoutSuccess, tenant?.id, fetchSubscription]);

  useEffect(() => {
    if (!checkoutSuccess || !subscription?.plan?.code) {
      return;
    }

    if (paidPlans.includes(subscription.plan.code)) {
      setSuccessMessage("Subscription confirmed. Your plan is now active.");
      setIsConfirming(false);
      setErrorMessage(null);
    }
  }, [checkoutSuccess, subscription?.plan?.code]);

  const handleUpgrade = async (planCode: PlanCode) => {
    if (!paidPlans.includes(planCode)) {
      return;
    }

    setErrorMessage(null);
    setLoadingPlan(planCode);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planCode }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to start checkout.");
      }

      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }

      throw new Error("Checkout URL missing from response.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Checkout failed.";
      setErrorMessage(message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="mt-8 mb-16 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          Pricing Tiers
        </h2>
        {isConfirming && (
          <p className="mt-3 text-sm text-blue-600">
            Confirming your upgrade...
          </p>
        )}
        {successMessage && (
          <p className="mt-3 text-sm text-green-600">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-center mb-4">
            <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
              Free (Trial / Small Shop)
            </span>
          </div>
          <p className="text-gray-600 mb-4 text-center">
            Start fast and validate your workflow.
          </p>
          <ul className="space-y-2 text-gray-700 mb-6 text-left">
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Up to 10 active plans
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              1 owner account
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              No credit card required
            </li>
          </ul>
          <div className="mt-auto text-center pt-6">
            <div className="text-2xl font-bold text-gray-900 mb-3">
              PKR 0
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center bg-gray-900 text-white font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Stay on Free
            </button>
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-2xl shadow-md border border-blue-200 p-6 ring-1 ring-blue-100">
          <div className="flex justify-center mb-4">
            <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
              Starter
            </span>
          </div>
          <p className="text-gray-600 mb-4 text-center font-medium">
            Built for busy shops that need structure.
          </p>
          <ul className="space-y-2 text-gray-700 mb-6 text-left">
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Up to 100 active plans
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Up to 3 staff accounts
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Reports and exports
            </li>
          </ul>
          <div className="mt-auto text-center pt-6">
            <div className="text-2xl font-bold text-gray-900 mb-3">
              PKR 2,500/mo
            </div>
            <button
              type="button"
              onClick={() => handleUpgrade("STARTER")}
              disabled={loadingPlan !== null}
              className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingPlan === "STARTER"
                ? "Redirecting..."
                : `Upgrade to ${planLabels.STARTER}`}
            </button>
          </div>
        </div>

        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-center mb-4">
            <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
              Pro
            </span>
          </div>
          <p className="text-gray-600 mb-4 text-center">
            Scale confidently with advanced control.
          </p>
          <ul className="space-y-2 text-gray-700 mb-6 text-left">
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-purple-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Unlimited active plans
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-purple-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Unlimited users
            </li>
            <li className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-purple-600 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Priority support
            </li>
          </ul>
          <div className="mt-auto text-center pt-6">
            <div className="text-2xl font-bold text-gray-900 mb-3">
              PKR 6,000/mo
            </div>
            <button
              type="button"
              onClick={() => handleUpgrade("PRO")}
              disabled={loadingPlan !== null}
              className="inline-flex items-center justify-center bg-gray-900 text-white font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingPlan === "PRO"
                ? "Redirecting..."
                : `Upgrade to ${planLabels.PRO}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
