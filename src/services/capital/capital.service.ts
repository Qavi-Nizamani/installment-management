"use server";

import { createClient } from "@/supabase/database/server";
import { requireTenantAccess, withTenantFilter } from "@/guards/tenant.guard";

export type CapitalLedgerType = "INVESTMENT" | "WITHDRAWAL" | "ADJUSTMENT";

export interface CapitalLedgerEntry {
  id: string;
  tenant_id: string;
  type: CapitalLedgerType;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface CreateCapitalEntryPayload {
  type: CapitalLedgerType;
  amount: number;
  notes?: string;
}

export interface CapitalStats {
  totalInvestment: number;
  totalWithdrawal: number;
  totalAdjustment: number;
  /** Current Balance = Investment - Withdrawal + Adjustment */
  balance: number;
  /** Capital Deployed = principal outstanding only (finance amount, excludes profit) */
  capitalDeployed: number;
  /** Available Funds = Capital Balance - Capital Deployed (rolling financed amount, profit excluded) */
  availableFunds: number;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all capital ledger entries for the authenticated user's tenant
 */
export async function getCapitalEntries(): Promise<
  ServiceResponse<CapitalLedgerEntry[]>
> {
  try {
    const context = await requireTenantAccess();
    const supabase = await createClient();

    const query = supabase
      .from("capital_ledger")
      .select("*")
      .order("created_at", { ascending: false });

    const { data, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error("Error fetching capital entries:", error);
      return {
        success: false,
        error: "Failed to fetch capital entries. Please try again.",
      };
    }

    return {
      success: true,
      data: (data || []) as CapitalLedgerEntry[],
    };
  } catch (error) {
    console.error("Error in getCapitalEntries:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Create a new capital ledger entry
 */
export async function createCapitalEntry(
  payload: CreateCapitalEntryPayload,
): Promise<ServiceResponse<CapitalLedgerEntry>> {
  try {
    const context = await requireTenantAccess();
    const supabase = await createClient();

    if (payload.amount <= 0) {
      return {
        success: false,
        error: "Amount must be greater than zero.",
      };
    }

    const { data, error } = await supabase
      .from("capital_ledger")
      .insert({
        tenant_id: context.tenantId,
        type: payload.type,
        amount: payload.amount,
        notes: payload.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating capital entry:", error);
      return {
        success: false,
        error: "Failed to create capital entry. Please try again.",
      };
    }

    return {
      success: true,
      data: data as CapitalLedgerEntry,
    };
  } catch (error) {
    console.error("Error in createCapitalEntry:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get capital deployed = principal outstanding only (excludes profit).
 * Each installment's principal portion = finance_amount / total_months.
 * For unpaid installments, that principal is still deployed.
 */
async function getCapitalDeployed(tenantId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("installments")
    .select(
      `
      amount_due,
      amount_paid,
      installment_plan:installment_plans!inner (
        finance_amount,
        total_months
      )
    `,
    )
    .eq("tenant_id", tenantId);

  if (error) return 0;

  let capitalDeployed = 0;
  for (const row of data || []) {
    const paid = Number(row.amount_paid || 0);
    const due = Number(row.amount_due || 0);
    const planRef = row.installment_plan;
    const plan = Array.isArray(planRef) ? planRef[0] : planRef;
    if (!plan || !plan.total_months || plan.total_months <= 0) continue;

    // If installment is fully paid, principal is recovered
    if (paid >= due) continue;

    // Principal portion per installment = finance_amount / total_months
    const principalPortion =
      Number(plan.finance_amount || 0) / plan.total_months;
    capitalDeployed += paid < principalPortion ? paid : principalPortion; // If installment is fully paid, principal is recovered
  }

  return capitalDeployed;
}

/**
 * Get capital statistics (totals, balance, available funds)
 */
export async function getCapitalStats(): Promise<
  ServiceResponse<CapitalStats>
> {
  try {
    const context = await requireTenantAccess();
    const [response, capitalDeployed] = await Promise.all([
      getCapitalEntries(),
      getCapitalDeployed(context.tenantId),
    ]);

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || "Failed to fetch capital stats",
      };
    }

    const entries = response.data;
    const stats: CapitalStats = {
      totalInvestment: 0,
      totalWithdrawal: 0,
      totalAdjustment: 0,
      balance: 0,
      capitalDeployed,
      availableFunds: 0,
    };

    for (const entry of entries) {
      switch (entry.type) {
        case "INVESTMENT":
          stats.totalInvestment += Number(entry.amount);
          break;
        case "WITHDRAWAL":
          stats.totalWithdrawal += Number(entry.amount);
          break;
        case "ADJUSTMENT":
          stats.totalAdjustment += Number(entry.amount);
          break;
      }
    }

    stats.balance =
      stats.totalInvestment - stats.totalWithdrawal + stats.totalAdjustment;
    // Available Funds = Capital Balance - Capital Deployed (principal only, profit excluded)
    stats.availableFunds = stats.balance - stats.capitalDeployed;

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Error in getCapitalStats:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
