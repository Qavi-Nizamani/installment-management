import { Metadata } from "next";
import SubscriptionPricing from "@/components/screens/dashboard/settings/subscription/SubscriptionPricing";

export const metadata: Metadata = {
  title: "Subscription - Installment Management",
  description: "Upgrade your plan and manage subscription limits",
};

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-2">
          Review pricing tiers and upgrade when you reach your limits. Payment
          integration is coming soon.
        </p>
      </div>

      <SubscriptionPricing />
    </div>
  );
}
