// Installment Plans Types - Main Export File
// This file provides a central location to import all installment plan types

// ==================== SHARED TYPES ====================
// Core types that can be used by both frontend and backend
export type {
  // Enums and constants
  BusinessModel,
  PlanStatus,
  InstallmentStatus,
  
  // Base types
  BaseCustomerInfo,
  ExtendedCustomerInfo,
  
  // Main installment plan types
  InstallmentPlanRecord,
  InstallmentPlan,
  
  // Payload types
  CreateInstallmentPlanPayload,
  UpdateInstallmentPlanPayload,
  
  // Search and filter
  InstallmentPlanFilters,
  InstallmentPlanSearchParams,
  
  // Analytics
  InstallmentPlanStats,
  RevenueAnalytics,
  PaymentAnalytics,
  CustomerAnalytics,
  
  // Business model
  BusinessModelConfig,
  
  // Calculations
  FinancialCalculations,
  
  // Validation
  InstallmentPlanValidationErrors,
} from "./installmentPlans.types";

// Export constants
export { BUSINESS_MODEL_CONFIGS } from "./installmentPlans.types";

// ==================== FRONTEND TYPES ====================
// Types specific to React components and UI
export type {
  // Component props
  InstallmentPlansScreenProps,
  InstallmentPlansListProps,
  InstallmentPlansStatsProps,
  CreatePlanModalProps,
  EditPlanModalProps,
  
  // Form types
  CreatePlanFormData,
  EditPlanFormData,
  FormValidationState,
  
  // UI state
  InstallmentPlansState,
  LoadingStates,
  
  // Filters and search UI
  FilterOption,
  StatusFilterConfig,
  BusinessModelFilterConfig,
  SearchAndFilterState,
  
  // Table and list
  TableColumn,
  TableSortState,
  ListItemAction,
  
  // Preview and calculations
  PaymentPreviewData,
  BusinessModelPreviewConfig,
  
  // Customer selection
  CustomerOption,
  CustomerSearchState,
  
  // Notifications
  UINotification,
  FormFeedback,
  
  // Responsive and theme
  ResponsiveBreakpoints,
  ThemeColors,
  
  // Charts and analytics UI
  ChartDataPoint,
  RevenueChartData,
  StatsCardData,
  
  // Hook return types
  UseInstallmentPlansReturn,
  UseInstallmentPlanFormReturn,
  
  // Event handlers
  PlanEventHandlers,
  SearchEventHandlers,
  FormEventHandlers,
  
  // Navigation
  InstallmentPlanRoutes,
  NavigationState,
} from "./frontend.types";

// ==================== SERVER TYPES ====================
// Types specific to server-side operations (for backend use)
export type {
  // Service responses
  ServiceResponse,
  
  // Database interactions
  InstallmentPlanWithRelations,
  InstallmentRecord,
  
  // Calculations
  PlanMetricsCalculation,
  FinancialCalculationInput,
  
  // Validation
  CreatePlanValidationInput,
  UpdatePlanValidationInput,
  
  // Security and tenant
  TenantContext,
  CustomerValidationResult,
  
  // Analytics aggregation
  PlanAggregationData,
  MonthlyRevenueData,
  PaymentTrendData,
  
  // Bulk operations
  BulkCreateInstallmentPlansPayload,
  BulkUpdateInstallmentPlansPayload,
  BulkOperationResult,
  
  // Installment generation
  InstallmentGenerationParams,
  GeneratedInstallmentRecord,
  
  // Search and filter backend
  DatabaseFilterParams,
  DatabaseSortParams,
  PaginationParams,
  
  // Errors
  InstallmentPlanServiceError,
  ServiceError,
  
  // Audit and logging
  InstallmentPlanAuditLog,
} from "../../services/installment-plans/installmentPlans.types";

// ==================== TYPE GUARDS ====================
// Utility functions to check types at runtime

import type { 
  BusinessModel as BM, 
  PlanStatus as PS, 
  InstallmentStatus as IS, 
  InstallmentPlan as IP,
  CreateInstallmentPlanPayload as CIPP,
  UpdateInstallmentPlanPayload as UIPP,
  BaseCustomerInfo as BCI
} from "./installmentPlans.types";

export function isBusinessModel(value: string): value is BM {
  return value === 'PRODUCT_OWNER' || value === 'FINANCER_ONLY';
}

export function isPlanStatus(value: string): value is PS {
  return value === 'ACTIVE' || value === 'COMPLETED' || value === 'OVERDUE';
}

export function isInstallmentStatus(value: string): value is IS {
  return value === 'PENDING' || value === 'PAID' || value === 'OVERDUE';
}

export function isValidInstallmentPlan(obj: unknown): obj is IP {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'tenant_id' in obj &&
    'customer_id' in obj &&
    'title' in obj &&
    'total_price' in obj &&
    'finance_amount' in obj &&
    'monthly_percentage' in obj &&
    'total_months' in obj &&
    'business_model' in obj
  );
}

// ==================== UTILITY TYPES ====================
// Helper types for common patterns

export type InstallmentPlanId = string;
export type CustomerId = string;
export type TenantId = string;

export type InstallmentPlanKeys = keyof IP;
export type CreatePlanKeys = keyof CIPP;
export type UpdatePlanKeys = keyof UIPP;

// Partial plan for updates
export type PartialInstallmentPlan = Partial<IP> & { id: string };

// Plan with required customer info
export type InstallmentPlanWithCustomer = IP & {
  customer: BCI;
};

// Plan for display (with all computed fields)
export type DisplayInstallmentPlan = IP & {
  monthly_amount: number;
  status: PS;
  total_paid: number;
  remaining_amount: number;
  my_revenue: number;
};

// ==================== BRANDED TYPES ====================
// For additional type safety

export type Amount = number & { readonly __brand: unique symbol };
export type Percentage = number & { readonly __brand: unique symbol };
export type Months = number & { readonly __brand: unique symbol };

export function createAmount(value: number): Amount {
  return value as Amount;
}

export function createPercentage(value: number): Percentage {
  if (value < 0 || value > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  return value as Percentage;
}

export function createMonths(value: number): Months {
  if (value <= 0 || !Number.isInteger(value)) {
    throw new Error('Months must be a positive integer');
  }
  return value as Months;
} 