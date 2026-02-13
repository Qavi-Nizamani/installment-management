// Server-side types for dashboard analytics module

import type { InstallmentRecord } from "../installment-plans/installmentPlans.types";

// ==================== SERVICE RESPONSE TYPES ====================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== DASHBOARD CARDS DATA TYPES ====================

export interface DashboardCardsData {
  totalRevenue: number;
  activeCustomers: number;
  activePlans: number;
  pendingPayments: number;
  monthlyProfit: number;
  overdueAmount: number;
  // Change percentages compared to last month
  totalRevenueChange: number;
  activeCustomersChange: number;
  activePlansChange: number;
  pendingPaymentsChange: number;
  monthlyProfitChange: number;
  overdueAmountChange: number;
}

// ==================== INTERNAL TYPES ====================

export interface PlanWithInstallments {
  id: string;
  customer_id: string;
  finance_amount: number;
  total_price: number;
  upfront_paid: number;
  monthly_percentage: number;
  total_months: number;
  business_model: 'PRODUCT_OWNER' | 'FINANCER_ONLY';
  created_at: string;
  installments?: InstallmentRecord[];
}

export interface CustomerWithPlans {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
  installment_plans?: PlanWithInstallments[];
}

// ==================== ACTIVITY LOG TYPES ====================

/** Change pair for audit metadata (only present when value changed) */
export interface ActivityLogChange<T = unknown> {
  old?: T;
  new?: T;
}

/** Metadata: table-specific identifiers + optional "changes" (only fields that changed, { old, new }). Single values for INSERT/DELETE. Actor derived from user_id at display time. */
export interface ActivityLogMetadata {
  /** New format: only keys that changed; value is { old, new } */
  changes?: Record<string, ActivityLogChange>;
  /** Installments: context */
  installment_number?: number;
  customer_id?: string;
  customer_name?: string;
  /** Single values (INSERT/DELETE or legacy) */
  amount_due?: number;
  due_date?: string;
  status?: string;
  amount_paid?: number;
  /** Legacy flat old/new (pre-021); formatter supports both */
  old_amount?: number;
  new_amount?: number;
  old_due_date?: string;
  new_due_date?: string;
  old_status?: string;
  new_status?: string;
  old_amount_paid?: number;
  new_amount_paid?: number;
  /** Other table fields */
  name?: string;
  [key: string]: unknown;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  reference_type: string;
  reference_id: string | null;
  user_id: string | null;
  metadata: ActivityLogMetadata;
  created_at: string;
}
