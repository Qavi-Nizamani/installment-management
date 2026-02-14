"use server";

import { createClient } from "@/supabase/database/server";
import { withTenantFilter } from "@/guards/tenant.guard";

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
  /** Owner equity = total owner investments only (cumulative; never decreases) */
  equity: number;
  /** Current Balance = Investment - Withdrawal + Adjustment */
  balance: number;
  /** Principal outstanding = capital deployed (from installments) */
  capitalDeployed: number;
  /** Cash Available = SUM(amount * direction) from cash_ledger (all types) */
  availableFunds: number;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all capital ledger entries for the authenticated user's tenant.
 * Reads from cash_ledger (owner-related types only) and maps to CapitalLedgerEntry.
 */
export async function getCapitalEntries(
  tenantId: string,
): Promise<ServiceResponse<CapitalLedgerEntry[]>> {
  try {
    const supabase = await createClient();

    const query = supabase
      .from("cash_ledger")
      .select("*")
      .in("type", ["OWNER_INVESTMENT", "OWNER_WITHDRAWAL", "ADJUSTMENT"])
      .order("created_at", { ascending: false });

    const { data, error } = await withTenantFilter(query, tenantId);

    if (error) {
      console.error("Error fetching capital entries:", error);
      return {
        success: false,
        error: "Failed to fetch capital entries. Please try again.",
      };
    }

    const rows = (data || []) as CashLedgerRow[];
    const entries: CapitalLedgerEntry[] = rows.map((row) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      type: mapCashTypeToCapitalType(row.type),
      amount: row.type === "ADJUSTMENT" ? Number(row.amount) * row.direction : Number(row.amount),
      notes: row.notes ?? null,
      created_at: row.created_at,
    }));

    return {
      success: true,
      data: entries,
    };
  } catch (error) {
    console.error("Error in getCapitalEntries:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

interface CashLedgerRow {
  id: string;
  tenant_id: string;
  type: string;
  amount: number;
  direction: number;
  notes: string | null;
  created_at: string;
}

function mapCashTypeToCapitalType(
  type: string,
): "INVESTMENT" | "WITHDRAWAL" | "ADJUSTMENT" {
  if (type === "OWNER_INVESTMENT") return "INVESTMENT";
  if (type === "OWNER_WITHDRAWAL") return "WITHDRAWAL";
  return "ADJUSTMENT";
}

/**
 * Create a new capital ledger entry
 */
export async function createCapitalEntry(
  payload: CreateCapitalEntryPayload,
  tenantId: string,
): Promise<ServiceResponse<CapitalLedgerEntry>> {
  try {
    const supabase = await createClient();

    // If not active/trialing subscription prevent creating customers
    const { data: hasActiveSubscription, error: hasActiveSubscriptionError } =
      await supabase.rpc("tenant_has_active_subscription", {
        p_tenant_id: tenantId,
      });

    if (!hasActiveSubscription || hasActiveSubscriptionError) {
      return {
        success: false,
        error: hasActiveSubscriptionError?.message || "NO_ACTIVE_SUBSCRIPTION",
      };
    }

    if (
      (payload.type === "ADJUSTMENT" && payload.amount === 0) ||
      (payload.type !== "ADJUSTMENT" && payload.amount <= 0)
    ) {
      return {
        success: false,
        error:
          payload.type === "ADJUSTMENT"
            ? "Adjustment amount cannot be zero."
            : "Amount must be greater than zero.",
      };
    }

    const cashType =
      payload.type === "INVESTMENT"
        ? "OWNER_INVESTMENT"
        : payload.type === "WITHDRAWAL"
          ? "OWNER_WITHDRAWAL"
          : "ADJUSTMENT";
    const direction =
      payload.type === "WITHDRAWAL" ? -1 : payload.type === "ADJUSTMENT" ? (payload.amount >= 0 ? 1 : -1) : 1;
    const amount = Math.abs(payload.amount);

    const { data, error } = await supabase
      .from("cash_ledger")
      .insert({
        tenant_id: tenantId,
        type: cashType,
        amount,
        direction,
        reference_id: null,
        reference_type: null,
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

    const row = data as CashLedgerRow;
    return {
      success: true,
      data: {
        id: row.id,
        tenant_id: row.tenant_id,
        type: mapCashTypeToCapitalType(row.type),
        amount: row.type === "ADJUSTMENT" ? Number(row.amount) * row.direction : Number(row.amount),
        notes: row.notes ?? null,
        created_at: row.created_at,
      },
    };
  } catch (error) {
    console.error("Error in createCapitalEntry:", error);
    return {
      success: false,
      error:
        (error as Error)?.message ||
        "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Get capital deployed = principal outstanding only (excludes profit).
 * Uses installments.principal_due and principal_paid when present; otherwise falls back to plan finance_amount/total_months.
 */
async function getCapitalDeployed(tenantId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("installments")
    .select(
      `
      amount_due,
      amount_paid,
      principal_due,
      principal_paid,
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
    const principalDue = row.principal_due != null ? Number(row.principal_due) : null;
    const principalPaid = row.principal_paid != null ? Number(row.principal_paid) : null;
    const planRef = row.installment_plan;
    const plan = Array.isArray(planRef) ? planRef[0] : planRef;

    // If installment is fully paid, principal is recovered
    if (paid >= due) continue;

    if (principalDue != null && principalPaid != null) {
      capitalDeployed += Math.max(0, principalDue - principalPaid);
      continue;
    }

    if (!plan || !plan.total_months || plan.total_months <= 0) continue;
    const principalPortion =
      Number(plan.finance_amount || 0) / plan.total_months;
    capitalDeployed += paid < principalPortion ? principalPortion - paid : 0;
  }

  return capitalDeployed;
}

/**
 * Get cash balance = SUM(amount * direction) from all cash_ledger rows for the tenant.
 */
async function getCashBalance(tenantId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await withTenantFilter(
    supabase.from("cash_ledger").select("amount, direction"),
    tenantId,
  );
  if (error) return 0;
  const rows = (data || []) as { amount: number; direction: number }[];
  return rows.reduce((sum, row) => sum + Number(row.amount) * Number(row.direction), 0);
}

/**
 * Get capital statistics (totals, equity, balance, principal outstanding, cash available)
 */
export async function getCapitalStats(
  tenantId: string,
): Promise<ServiceResponse<CapitalStats>> {
  try {
    const [response, capitalDeployed, cashBalance] = await Promise.all([
      getCapitalEntries(tenantId),
      getCapitalDeployed(tenantId),
      getCashBalance(tenantId),
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
      equity: 0,
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

    stats.equity = stats.totalInvestment;
    stats.balance =
      stats.totalInvestment - stats.totalWithdrawal + stats.totalAdjustment;
    stats.availableFunds = cashBalance;

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
