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
  /** Owner Capital = Investment + Adjustment. Withdrawals are deducted from Retained Earnings first, then Owner Capital. */
  ownerCapital: number;
  /** Retained Earnings = Total collected from installments - Withdrawals (capped at 0). Withdrawals deduct from this first. */
  retainedEarnings: number;
  /** Total earnings collected from installment payments (before withdrawals) */
  totalEarningsCollected: number;
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
  payload: CreateCapitalEntryPayload
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
 * Get total amount paid from installments (earnings collected)
 */
async function getTotalEarningsCollected(tenantId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("installments")
    .select("amount_paid")
    .eq("tenant_id", tenantId);

  if (error) return 0;
  return (data || []).reduce((sum, row) => sum + Number(row.amount_paid || 0), 0);
}

/**
 * Get capital statistics (totals, owner capital, retained earnings)
 */
export async function getCapitalStats(): Promise<ServiceResponse<CapitalStats>> {
  try {
    const context = await requireTenantAccess();
    const [entriesResponse, totalEarningsCollected] = await Promise.all([
      getCapitalEntries(),
      getTotalEarningsCollected(context.tenantId),
    ]);

    if (!entriesResponse.success || !entriesResponse.data) {
      return {
        success: false,
        error: entriesResponse.error || "Failed to fetch capital stats",
      };
    }

    const entries = entriesResponse.data;
    const stats: CapitalStats = {
      totalInvestment: 0,
      totalWithdrawal: 0,
      totalAdjustment: 0,
      ownerCapital: 0,
      retainedEarnings: 0,
      totalEarningsCollected,
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

    // Owner Capital = Investment + Adjustment. Withdrawals do NOT reduce it directly —
    // they are deducted from Retained Earnings first, then Owner Capital if insufficient.
    stats.ownerCapital = stats.totalInvestment + stats.totalAdjustment;

    // Retained Earnings = Earnings collected - Withdrawals (capped at 0).
    // Withdrawals deduct from earnings first; excess reduces Owner Capital.
    stats.retainedEarnings = Math.max(
      0,
      stats.totalEarningsCollected - stats.totalWithdrawal
    );

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
