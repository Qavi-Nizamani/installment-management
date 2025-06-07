// Server-side types for installment plans module
// These types are specific to server operations and database interactions

import type { 
  InstallmentPlan, 
  InstallmentPlanRecord, 
  CreateInstallmentPlanPayload, 
  UpdateInstallmentPlanPayload,
  InstallmentPlanStats,
  RevenueAnalytics,
  PaymentAnalytics,
  CustomerAnalytics,
  BusinessModel,
  PlanStatus
} from "@/types/installment-plans/installmentPlans.types";

// ==================== SERVICE RESPONSE TYPES ====================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== DATABASE INTERACTION TYPES ====================

// Database query result with relations
export interface InstallmentPlanWithRelations extends InstallmentPlanRecord {
  customer?: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    national_id?: string;
  };
  installments?: InstallmentRecord[];
}

export interface InstallmentRecord {
  id: string;
  installment_plan_id: string;
  tenant_id: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  paid_on?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  penalty: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ==================== CALCULATION TYPES ====================

export interface PlanMetricsCalculation {
  monthly_amount: number;
  status: PlanStatus;
  months_paid: number;
  next_due_date?: string;
  total_paid: number;
  remaining_amount: number;
  my_revenue: number;
  total_interest: number;
}

export interface FinancialCalculationInput {
  finance_amount: number;
  monthly_percentage: number;
  total_months: number;
  business_model: BusinessModel;
  upfront_paid: number;
  total_price: number;
}

// ==================== VALIDATION TYPES ====================

export interface CreatePlanValidationInput {
  customer_id: string;
  title: string;
  total_price: number;
  upfront_paid: number;
  finance_amount: number;
  monthly_percentage: number;
  total_months: number;
  start_date: string;
  business_model: BusinessModel;
  tenant_id: string;
}

export interface UpdatePlanValidationInput extends Partial<CreatePlanValidationInput> {
  id: string;
}

// ==================== TENANT AND SECURITY TYPES ====================

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

export interface CustomerValidationResult {
  exists: boolean;
  belongs_to_tenant: boolean;
  customer_id: string;
}

// ==================== ANALYTICS AGGREGATION TYPES ====================

export interface PlanAggregationData {
  plan: InstallmentPlanRecord;
  installments: InstallmentRecord[];
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
}

export interface MonthlyRevenueData {
  month: string;
  year: number;
  revenue: number;
  plans_count: number;
  payments_count: number;
}

export interface PaymentTrendData {
  month: string;
  year: number;
  on_time_payments: number;
  late_payments: number;
  total_payments: number;
  average_delay_days: number;
}

// ==================== BULK OPERATIONS ====================

export interface BulkCreateInstallmentPlansPayload {
  plans: CreateInstallmentPlanPayload[];
  generate_installments: boolean;
}

export interface BulkUpdateInstallmentPlansPayload {
  updates: { id: string; data: UpdateInstallmentPlanPayload; }[];
}

export interface BulkOperationResult<T> {
  success: boolean;
  successful_operations: T[];
  failed_operations: { 
    index: number; 
    data: CreateInstallmentPlanPayload | UpdateInstallmentPlanPayload; 
    error: string; 
  }[];
  total_processed: number;
  total_successful: number;
  total_failed: number;
}

// ==================== INSTALLMENT GENERATION ====================

export interface InstallmentGenerationParams {
  plan_id: string;
  tenant_id: string;
  finance_amount: number;
  monthly_percentage: number;
  total_months: number;
  start_date: string;
}

export interface GeneratedInstallmentRecord {
  installment_plan_id: string;
  tenant_id: string;
  due_date: string;
  amount_due: number;
  status: 'PENDING';
}

// ==================== SEARCH AND FILTER BACKEND TYPES ====================

export interface DatabaseFilterParams {
  tenant_id: string;
  customer_ids?: string[];
  business_models?: BusinessModel[];
  statuses?: PlanStatus[];
  date_range?: {
    start_date: string;
    end_date: string;
    field: 'created_at' | 'start_date';
  };
  search_fields?: {
    title?: string;
    notes?: string;
    customer_name?: string;
  };
}

export interface DatabaseSortParams {
  field: 'created_at' | 'start_date' | 'total_price' | 'monthly_percentage';
  direction: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  per_page: number;
  offset: number;
}

// ==================== ERROR TYPES ====================

export type InstallmentPlanServiceError = 
  | 'PLAN_NOT_FOUND'
  | 'CUSTOMER_NOT_FOUND'
  | 'CUSTOMER_ACCESS_DENIED'
  | 'INVALID_FINANCIAL_DATA'
  | 'INSTALLMENT_GENERATION_FAILED'
  | 'TENANT_ACCESS_DENIED'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'UNAUTHORIZED';

export interface ServiceError {
  code: InstallmentPlanServiceError;
  message: string;
  details?: Record<string, unknown>;
}

// ==================== AUDIT AND LOGGING ====================

export interface InstallmentPlanAuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  plan_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  old_values?: Partial<InstallmentPlanRecord>;
  new_values?: Partial<InstallmentPlanRecord>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

// ==================== EXPORT CONVENIENCE TYPES ====================

// Re-export commonly used shared types for convenience
export type {
  InstallmentPlan,
  InstallmentPlanRecord,
  CreateInstallmentPlanPayload,
  UpdateInstallmentPlanPayload,
  InstallmentPlanStats,
  RevenueAnalytics,
  PaymentAnalytics,
  CustomerAnalytics,
  BusinessModel,
  PlanStatus
}; 