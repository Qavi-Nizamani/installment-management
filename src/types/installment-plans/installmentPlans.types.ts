// Shared types for installment plans module
// These types can be used by both frontend and backend

// ==================== ENUMS AND CONSTANTS ====================

export type BusinessModel = 'PRODUCT_OWNER' | 'FINANCER_ONLY';
export type PlanStatus = 'ACTIVE' | 'COMPLETED' | 'OVERDUE';
export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

// ==================== BASE TYPES ====================

export interface BaseCustomerInfo {
  id: string;
  name: string;
  phone?: string;
}

export interface ExtendedCustomerInfo extends BaseCustomerInfo {
  address?: string;
  national_id?: string;
}

// ==================== INSTALLMENT PLAN TYPES ====================

// Database record type (exactly matches DB schema)
export interface InstallmentPlanRecord {
  id: string;
  tenant_id: string;
  customer_id: string;
  title: string;
  total_price: number;
  upfront_paid: number;
  finance_amount: number;
  monthly_percentage: number;
  total_months: number;
  start_date: string;
  business_model: BusinessModel;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Full installment plan with computed fields
export interface InstallmentPlan extends InstallmentPlanRecord {
  // Joined customer data
  customer?: BaseCustomerInfo;
  
  // Computed fields
  monthly_amount?: number;
  status?: PlanStatus;
  months_paid?: number;
  next_due_date?: string;
  total_paid?: number;
  remaining_amount?: number;
  
  // Revenue fields based on business model
  my_revenue?: number; // Revenue for the current user based on business model
  total_interest?: number; // Total interest that will be earned
}

// ==================== PAYLOAD TYPES ====================

export interface CreateInstallmentPlanPayload {
  customer_id: string;
  title: string;
  total_price: number;
  upfront_paid: number;
  finance_amount: number;
  monthly_percentage: number;
  total_months: number;
  start_date: string;
  business_model: BusinessModel;
  notes?: string;
}

export interface UpdateInstallmentPlanPayload {
  customer_id?: string;
  title?: string;
  total_price?: number;
  upfront_paid?: number;
  finance_amount?: number;
  monthly_percentage?: number;
  total_months?: number;
  start_date?: string;
  business_model?: BusinessModel;
  notes?: string;
}

// ==================== SEARCH AND FILTER TYPES ====================

export interface InstallmentPlanFilters {
  status?: PlanStatus[];
  business_model?: BusinessModel[];
  customer_id?: string;
  date_range?: {
    start_date: string;
    end_date: string;
  };
}

export interface InstallmentPlanSearchParams {
  search_term?: string;
  filters?: InstallmentPlanFilters;
  sort_by?: 'created_at' | 'start_date' | 'total_price' | 'monthly_amount';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// ==================== ANALYTICS TYPES ====================

export interface InstallmentPlanStats {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  overduePlans: number;
  totalFinanceAmount: number;
  totalRevenue: number;
  totalOutstanding: number;
  averageMonthlyPayment: number;
  newPlansThisMonth: number;
  completionRate: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: { month: string; revenue: number; }[];
  upfrontRevenue: number;
  installmentRevenue: number;
  projectedRevenue: number;
}

export interface PaymentAnalytics {
  onTimePayments: number;
  latePayments: number;
  totalPayments: number;
  averagePaymentDelay: number;
  paymentTrends: { month: string; onTime: number; late: number; }[];
}

export interface CustomerAnalytics {
  customersWithPlans: number;
  averagePlansPerCustomer: number;
  topCustomersByRevenue: {
    customerId: string;
    customerName: string;
    totalRevenue: number;
    activePlans: number;
  }[];
}

// ==================== BUSINESS MODEL SPECIFIC TYPES ====================

export interface BusinessModelConfig {
  type: BusinessModel;
  label: string;
  description: string;
  revenueCalculation: 'FULL_PAYMENTS' | 'INTEREST_ONLY';
}

export const BUSINESS_MODEL_CONFIGS: Record<BusinessModel, BusinessModelConfig> = {
  PRODUCT_OWNER: {
    type: 'PRODUCT_OWNER',
    label: 'Product Owner',
    description: 'I sell the product and provide financing',
    revenueCalculation: 'FULL_PAYMENTS'
  },
  FINANCER_ONLY: {
    type: 'FINANCER_ONLY',
    label: 'Financer Only', 
    description: 'I only provide financing for someone else\'s product',
    revenueCalculation: 'INTEREST_ONLY'
  }
};

// ==================== CALCULATION HELPERS ====================

export interface FinancialCalculations {
  monthlyAmount: number;
  totalInterest: number;
  futureValue: number;
  totalCustomerPayment: number;
  userRevenue: number; // Based on business model
}

// ==================== VALIDATION TYPES ====================

export interface InstallmentPlanValidationErrors {
  customer_id?: string;
  title?: string;
  total_price?: string;
  upfront_paid?: string;
  finance_amount?: string;
  monthly_percentage?: string;
  total_months?: string;
  start_date?: string;
  business_model?: string;
  notes?: string;
} 