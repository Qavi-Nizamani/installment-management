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
