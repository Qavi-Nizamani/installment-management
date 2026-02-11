"use server";

import { createClient } from "@/supabase/database/server";
import { withTenantFilter } from "@/guards/tenant.guard";

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

/**
 * Get count of active and overdue installment plans
 */
export async function getActiveAndOverduePlanCount(
  tenantId?: string
): Promise<ServiceResponse<number>> {
  try {
    const resolvedTenantId = requireTenantId(tenantId);
    const supabase = await createClient();

    const query = supabase.from("installment_plans").select(`
        id,
        total_months,
        installments(status)
      `);

    const { data: plans, error } = await withTenantFilter(
      query,
      resolvedTenantId
    );

    if (error) {
      console.error("Error fetching installment plans:", error);
      return {
        success: false,
        error: "Failed to fetch installment plan count.",
      };
    }

    let activeOrOverdueCount = 0;

    (plans || []).forEach((plan) => {
      const installments = plan.installments || [];
      const paidInstallments = installments.filter(
        (i) => i.status === "PAID"
      );
      const monthsPaid = paidInstallments.length;

      // Plan is active or overdue if not all installments are paid
      if (monthsPaid < plan.total_months) {
        activeOrOverdueCount++;
      }
    });

    return {
      success: true,
      data: activeOrOverdueCount,
    };
  } catch (error) {
    console.error("Error in getActiveAndOverduePlanCount:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
