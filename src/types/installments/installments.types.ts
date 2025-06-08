// Types for individual installment payments module

// ==================== ENUMS AND CONSTANTS ====================

export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

// ==================== BASE TYPES ====================

export interface BaseCustomerInfo {
  id: string;
  name: string;
  phone?: string;
}

// ==================== INSTALLMENT TYPES ====================

// Database record type (matches DB schema)
export interface InstallmentRecord {
  id: string;
  tenant_id: string;
  installment_plan_id: string;
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: InstallmentStatus;
  paid_on?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Full installment with joined data
export interface Installment extends InstallmentRecord {
  // Joined customer data
  customer?: BaseCustomerInfo;
  
  // Joined plan data
  plan_title?: string;
  
  // Computed fields
  remaining_due?: number; // amount_due - amount_paid
  days_overdue?: number; // if overdue, how many days
  is_upcoming?: boolean; // due within next 7 days
}

// ==================== PAYLOAD TYPES ====================

export interface UpdateInstallmentPayload {
  amount_due?: number;
  amount_paid?: number;
  status?: InstallmentStatus;
  paid_on?: string;
  notes?: string;
}

export interface MarkAsPaidPayload {
  amount_paid: number;
  paid_on: string;
  notes?: string;
}

// ==================== SEARCH AND FILTER TYPES ====================

export interface InstallmentFilters {
  status?: InstallmentStatus[];
  date_range?: {
    start_date: string;
    end_date: string;
  };
  customer_id?: string;
  installment_plan_id?: string;
  overdue_only?: boolean;
  upcoming_only?: boolean; // due within 7 days
}

export interface InstallmentSearchParams {
  search_term?: string; // customer name or plan title
  filters?: InstallmentFilters;
  sort_by?: 'due_date' | 'amount_due' | 'customer_name' | 'plan_title' | 'status';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// ==================== ANALYTICS TYPES ====================

export interface InstallmentStats {
  totalInstallments: number;
  pendingInstallments: number;
  paidInstallments: number;
  overdueInstallments: number;
  upcomingInstallments: number; // due within 7 days
  totalAmountDue: number;
  totalAmountPaid: number;
  totalRemainingDue: number;
  averagePaymentDelay: number;
  collectionRate: number; // percentage of amount collected vs amount due
}

// ==================== STATUS CONFIGURATION ====================

export interface InstallmentStatusConfig {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
  bgColor: string;
  label: string;
}

export const INSTALLMENT_STATUS_CONFIGS: Record<InstallmentStatus, InstallmentStatusConfig> = {
  PAID: {
    variant: 'default',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    label: 'Paid'
  },
  PENDING: {
    variant: 'secondary',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    label: 'Pending'
  },
  OVERDUE: {
    variant: 'destructive',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    label: 'Overdue'
  }
};

// ==================== VALIDATION TYPES ====================

export interface InstallmentValidationErrors {
  amount_paid?: string;
  paid_on?: string;
  notes?: string;
} 