"use server";

import { createClient } from "@/supabase/database/server";
import { createAdminClient } from "@/supabase/database/admin";
import { withTenantFilter } from "@/guards/tenant.guard";
import type { SubscriptionWithPlan } from "@/types/subscription";

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const requireTenantId = (tenantId?: string): string => {
  if (!tenantId) {
    throw new Error("Tenant context required");
  }
  return tenantId;
};

export async function getCurrentSubscription(
  tenantId?: string
): Promise<ServiceResponse<SubscriptionWithPlan>> {
  try {
    const resolvedTenantId = requireTenantId(tenantId);
    const supabase = await createClient();

    const { data, error } = await withTenantFilter(
      supabase
        .from("subscriptions")
        .select("*, plan:plans(*)")
        .single(),
      resolvedTenantId
    );

    if (error || !data) {
      return {
        success: false,
        error: "No active subscription found for this tenant.",
      };
    }

    const subscription = data as SubscriptionWithPlan;

    // Lazy-expire app-managed trial when now > trial_end
    if (
      subscription.status === "trialing" &&
      subscription.trial_end &&
      new Date() > new Date(subscription.trial_end)
    ) {
      const admin = createAdminClient();
      await admin
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("id", subscription.id);

      subscription.status = "expired";
    }

    subscription.isTrialExpired =
      subscription.status === "expired" && !subscription.provider_subscription_id;

    return { success: true, data: subscription };
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return { success: false, error: "Failed to fetch subscription." };
  }
}
