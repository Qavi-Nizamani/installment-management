"use server";

import { createClient } from "@/supabase/database/server";
import { requireTenantAccess } from "@/guards/tenant.guard";
import type { SubscriptionWithPlan } from "@/types/subscription";

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function getCurrentSubscription(): Promise<
  ServiceResponse<SubscriptionWithPlan>
> {
  try {
    const context = await requireTenantAccess();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("tenant_id", context.tenantId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: "No active subscription found for this tenant.",
      };
    }

    return { success: true, data: data as SubscriptionWithPlan };
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return { success: false, error: "Failed to fetch subscription." };
  }
}
