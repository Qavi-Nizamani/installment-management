"use server";

import { createClient } from "@/supabase/database/server";
import { withTenantFilter } from "@/guards/tenant.guard";
import type {
  Installment,
  InstallmentRecord,
  InstallmentSearchParams,
  UpdateInstallmentPayload,
  MarkAsPaidPayload,
  InstallmentStatus,
} from "@/types/installments/installments.types";

// ==================== SERVICE RESPONSE TYPES ====================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== DATABASE TYPES ====================

interface InstallmentWithRelations extends InstallmentRecord {
  installment_plan?: {
    title: string;
    customer?: {
      id: string;
      name: string;
      phone?: string;
    };
  };
}

// ==================== FETCH FUNCTIONS ====================

/**
 * Get installments with search, filters, and pagination
 */
export async function getInstallments(
  params: InstallmentSearchParams = {},
  tenantId: string,
): Promise<ServiceResponse<Installment[]>> {
  try {
    const supabase = await createClient();

    let query = supabase.from("installments").select(`
        *,
        installment_plan:installment_plans(
          title,
          customer:customers(
            id,
            name,
            phone
          )
        )
      `);

    // Note: Search filter for nested relations (plan title, customer name) is applied after fetching
    // because PostgREST doesn't support filtering on nested relation fields in .or() queries

    // Apply status filter
    if (params.filters?.status?.length) {
      query = query.in("status", params.filters.status);
    }

    // Apply date range filter
    if (params.filters?.date_range) {
      query = query
        .gte("due_date", params.filters.date_range.start_date)
        .lte("due_date", params.filters.date_range.end_date);
    }

    // Apply customer filter
    if (params.filters?.customer_id) {
      query = query.eq(
        "installment_plan.customer_id",
        params.filters.customer_id,
      );
    }

    // Apply plan filter
    if (params.filters?.installment_plan_id) {
      query = query.eq(
        "installment_plan_id",
        params.filters.installment_plan_id,
      );
    }

    // Apply overdue filter
    if (params.filters?.overdue_only) {
      const today = new Date().toISOString().split("T")[0];
      query = query.lt("due_date", today).eq("status", "OVERDUE");
    }

    // Apply upcoming filter
    if (params.filters?.upcoming_only) {
      const today = new Date().toISOString().split("T")[0];
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      query = query
        .gte("due_date", today)
        .lte("due_date", weekFromNow)
        .eq("status", "PENDING");
    }

    // Apply sorting
    const sortBy = params.sort_by || "due_date";
    const sortOrder = params.sort_order || "asc";

    if (sortBy === "customer_name") {
      query = query.order("name", {
        ascending: sortOrder === "asc",
        referencedTable: "installment_plan.customer",
      });
    } else if (sortBy === "plan_title") {
      query = query.order("title", {
        ascending: sortOrder === "asc",
        referencedTable: "installment_plan",
      });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === "asc" });
    }

    // Apply pagination
    if (params.page && params.per_page) {
      const start = (params.page - 1) * params.per_page;
      const end = start + params.per_page - 1;
      query = query.range(start, end);
    }

    const { data, error } = await withTenantFilter(query, tenantId);

    if (error) {
      console.error("Error fetching installments:", error);
      return { success: false, error: error.message };
    }

    // Transform the data to match our Installment interface
    const { calculateRemainingDue, calculateDaysOverdue, isUpcoming } =
      await import("@/helpers/installments.helper");

    let installments: Installment[] = (data || []).map(
      (item: InstallmentWithRelations) => {
        return {
          ...item,
          customer: item.installment_plan?.customer,
          plan_title: item.installment_plan?.title,
          remaining_due: calculateRemainingDue(
            item.amount_due,
            item.amount_paid,
          ),
          days_overdue:
            item.status === "OVERDUE" ? calculateDaysOverdue(item.due_date) : 0,
          is_upcoming: isUpcoming(item.due_date, item.status),
          // Remove installment_plan from the final object
          installment_plan: undefined,
        } as Installment;
      },
    );

    // Apply search filter for nested relations (plan title, customer name)
    if (params.search_term) {
      const searchTermLower = params.search_term.toLowerCase();
      installments = installments.filter((installment) => {
        const planTitleMatch = installment.plan_title
          ?.toLowerCase()
          .includes(searchTermLower);
        const customerNameMatch = installment.customer?.name
          ?.toLowerCase()
          .includes(searchTermLower);
        return planTitleMatch || customerNameMatch;
      });
    }

    return { success: true, data: installments };
  } catch (error) {
    console.error("Error in getInstallments:", error);
    return { success: false, error: "Failed to fetch installments" };
  }
}

// ==================== ANALYTICS FUNCTIONS ====================
// Analytics functions have been moved to ./installments.analytics.ts for better organization
//
// Note: Analytics functions cannot be re-exported due to "use server" directive restrictions.
// Import analytics functions directly from '@/services/installments/installments.analytics' when needed.

// ==================== UPDATE FUNCTIONS ====================

/**
 * Update installment with new data
 */
export async function updateInstallment(
  installmentId: string,
  payload: UpdateInstallmentPayload,
  tenantId: string,
): Promise<ServiceResponse<InstallmentRecord>> {
  try {
    const supabase = await createClient();

    const query = supabase
      .from("installments")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", installmentId)
      .select()
      .single();

    const { data, error } = await withTenantFilter(query, tenantId);

    if (error) {
      console.error("Error updating installment:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in updateInstallment:", error);
    return { success: false, error: "Failed to update installment" };
  }
}

/** Round to 2 decimals for money (matches NUMERIC(12,2)). */
function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Mark installment as paid with advanced payment handling.
 * - payload.amount_paid is the incremental payment for this call (not cumulative total).
 * - Allocation: profit first, then principal. Multiple partial payments accumulate correctly.
 * - Full payment: marks installment as PAID. Partial: status OVERDUE, amount_due unchanged.
 * - Overpayment: amount applied to this installment is capped at amount_due; cash_ledger still records full amount received.
 */
export async function markAsPaid(
  installmentId: string,
  payload: MarkAsPaidPayload,
  tenantId: string,
): Promise<ServiceResponse<InstallmentRecord>> {
  try {
    // Validation: cash_ledger has CHECK (amount > 0); reject before any DB write
    const paymentAmount = roundMoney(Number(payload.amount_paid));
    if (paymentAmount <= 0) {
      return {
        success: false,
        error: "Payment amount must be greater than zero.",
      };
    }

    const supabase = await createClient();

    const { data: currentInstallment, error: fetchError } =
      await withTenantFilter(
        supabase
          .from("installments")
          .select("*")
          .eq("id", installmentId)
          .single(),
        tenantId,
      );

    if (fetchError || !currentInstallment) {
      console.error("Error fetching installment:", fetchError);
      return { success: false, error: "Failed to fetch installment details" };
    }

    const amountDue = Number(currentInstallment.amount_due);
    const currentAmountPaid = Number(currentInstallment.amount_paid ?? 0);
    if (currentAmountPaid >= amountDue) {
      return {
        success: false,
        error: "Installment is already fully paid.",
      };
    }

    const principalDue =
      currentInstallment.principal_due != null
        ? Number(currentInstallment.principal_due)
        : amountDue;
    const profitDue = Number(currentInstallment.profit_due ?? 0);
    const currentPrincipalPaid = Number(
      currentInstallment.principal_paid ?? 0,
    );
    const currentProfitPaid = Number(currentInstallment.profit_paid ?? 0);

    // Cap at amount_due: overpayment is recorded in cash_ledger but installment only gets up to amount_due
    const newAmountPaid = roundMoney(
      Math.min(currentAmountPaid + paymentAmount, amountDue),
    );
    const amountToAllocate = roundMoney(newAmountPaid - currentAmountPaid);
    if (amountToAllocate <= 0) {
      return {
        success: false,
        error: "No additional amount can be applied to this installment.",
      };
    }

    // Allocate increment: profit first, then principal (remainder to principal for rounding)
    const remainingProfit = Math.max(0, profitDue - currentProfitPaid);
    const remainingPrincipal = Math.max(0, principalDue - currentPrincipalPaid);
    let profitIncrement = roundMoney(
      Math.min(amountToAllocate, remainingProfit),
    );
    let principalIncrement = roundMoney(
      Math.min(amountToAllocate - profitIncrement, remainingPrincipal),
    );
    // Ensure principal_paid + profit_paid <= amount_paid; allocate any rounding remainder to principal
    const allocated = profitIncrement + principalIncrement;
    if (allocated < amountToAllocate) {
      principalIncrement = roundMoney(principalIncrement + (amountToAllocate - allocated));
    }

    const newPrincipalPaid = roundMoney(currentPrincipalPaid + principalIncrement);
    const newProfitPaid = roundMoney(currentProfitPaid + profitIncrement);

    const isFullPayment = newAmountPaid >= amountDue;
    const currentInstallmentUpdate: UpdateInstallmentPayload = {
      amount_paid: newAmountPaid,
      principal_paid: newPrincipalPaid,
      profit_paid: newProfitPaid,
      status: isFullPayment
        ? ("PAID" as InstallmentStatus)
        : (currentInstallment.status as InstallmentStatus),
      paid_on: payload.paid_on,
      notes: payload.notes,
    };

    // Partial payment: status OVERDUE, do not change amount_due
    if (!isFullPayment) {
      currentInstallmentUpdate.status = "OVERDUE" as InstallmentStatus;
    }

    const updateResult = await updateInstallment(
      installmentId,
      currentInstallmentUpdate,
      tenantId,
    );
    if (!updateResult.success) {
      return updateResult;
    }

    // Record actual cash received (incremental amount); cash_ledger amount must be > 0
    await supabase.from("cash_ledger").insert({
      tenant_id: tenantId,
      type: "INSTALLMENT_PAYMENT",
      amount: paymentAmount,
      direction: 1,
      reference_id: installmentId,
      reference_type: "installment",
      notes: payload.notes ?? null,
    });

    const { data } = await withTenantFilter(
      supabase
        .from("installments")
        .select("*")
        .eq("id", installmentId)
        .single(),
      tenantId,
    );
    return { success: true, data: data ?? currentInstallment };
  } catch (error) {
    console.error("Error in markAsPaid:", error);
    return { success: false, error: "Failed to process payment" };
  }
}

/**
 * Mark installment as pending.
 * Note: This only updates the installment (status, paid_on, notes). It does not reverse or
 * delete INSTALLMENT_PAYMENT rows in cash_ledger; the recorded cash inflow remains.
 */
export async function markAsPending(
  installmentId: string,
  tenantId: string,
  notes?: string,
): Promise<ServiceResponse<InstallmentRecord>> {
  try {
    const updatePayload: UpdateInstallmentPayload = {
      status: "PENDING" as InstallmentStatus,
      paid_on: undefined,
      notes,
    };

    return await updateInstallment(installmentId, updatePayload, tenantId);
  } catch (error) {
    console.error("Error in markAsPending:", error);
    return { success: false, error: "Failed to mark installment as pending" };
  }
}
