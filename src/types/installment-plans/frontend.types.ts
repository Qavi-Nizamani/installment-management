// Frontend-specific types for installment plans module
// These types are specific to React components and UI state management

import type { 
  InstallmentPlan, 
  CreateInstallmentPlanPayload, 
  UpdateInstallmentPlanPayload,
  InstallmentPlanStats,
  BusinessModel,
  PlanStatus,
  InstallmentPlanValidationErrors,
  FinancialCalculations,
  InstallmentPlanFilters,
  BUSINESS_MODEL_CONFIGS
} from "@/types/installment-plans/installmentPlans.types";

// ==================== COMPONENT PROPS ====================

export interface InstallmentPlansScreenProps {
  initialPlans?: InstallmentPlan[];
  initialStats?: InstallmentPlanStats;
}

export interface InstallmentPlansListProps {
  plans: InstallmentPlan[];
  loading: boolean;
  onPlanUpdated: () => void;
  onPlanDeleted: () => void;
}

export interface InstallmentPlansStatsProps {
  plans: InstallmentPlan[];
  loading?: boolean;
}

export interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: () => void;
}

export interface EditPlanModalProps {
  isOpen: boolean;
  plan: InstallmentPlan | null;
  onClose: () => void;
  onPlanUpdated: () => void;
}

// ==================== FORM TYPES ====================

export interface CreatePlanFormData {
  customer_id: string;
  title: string;
  total_price: string;
  upfront_paid: string;
  finance_amount: string;
  monthly_percentage: string;
  total_months: string;
  start_date: string;
  business_model: BusinessModel;
  notes: string;
}

export interface EditPlanFormData extends Partial<CreatePlanFormData> {
  id: string;
}

export interface FormValidationState {
  errors: InstallmentPlanValidationErrors;
  isValid: boolean;
  touched: Record<keyof CreatePlanFormData, boolean>;
}

// ==================== UI STATE TYPES ====================

export interface InstallmentPlansState {
  plans: InstallmentPlan[];
  stats: InstallmentPlanStats | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  filters: InstallmentPlanFilters;
  selectedPlan: InstallmentPlan | null;
  
  // Modal states
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteDialogOpen: boolean;
}

export interface LoadingStates {
  fetching: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  searching: boolean;
}

// ==================== FILTER AND SEARCH UI ====================

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface StatusFilterConfig {
  status: PlanStatus;
  label: string;
  color: string;
  icon: React.ComponentType;
}

export interface BusinessModelFilterConfig {
  model: BusinessModel;
  label: string;
  description: string;
  icon: React.ComponentType;
}

export interface SearchAndFilterState {
  searchTerm: string;
  selectedStatuses: PlanStatus[];
  selectedBusinessModels: BusinessModel[];
  selectedCustomer: string | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  sortBy: 'created_at' | 'start_date' | 'total_price' | 'monthly_amount';
  sortOrder: 'asc' | 'desc';
}

// ==================== TABLE AND LIST TYPES ====================

export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableSortState {
  column: string | null;
  direction: 'asc' | 'desc';
}

export interface ListItemAction {
  label: string;
  icon: React.ComponentType;
  onClick: (plan: InstallmentPlan) => void;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
}

// ==================== PREVIEW AND CALCULATION TYPES ====================

export interface PaymentPreviewData extends FinancialCalculations {
  isValid: boolean;
  breakdown: {
    monthlyInstallment: number;
    totalInterest: number;
    customerTotal: number;
    userRevenue: number;
  };
}

export interface BusinessModelPreviewConfig {
  model: BusinessModel;
  config: typeof BUSINESS_MODEL_CONFIGS[BusinessModel];
  revenueDescription: string;
  calculationFormula: string;
}

// ==================== CUSTOMER SELECTION ====================

export interface CustomerOption {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  active_plans_count: number;
}

export interface CustomerSearchState {
  loading: boolean;
  customers: CustomerOption[];
  searchTerm: string;
  selectedCustomer: CustomerOption | null;
}

// ==================== NOTIFICATION AND FEEDBACK ====================

export interface UINotification {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface FormFeedback {
  type: 'error' | 'warning' | 'success';
  message: string;
  field?: keyof CreatePlanFormData;
}

// ==================== RESPONSIVE AND THEME ====================

export interface ResponsiveBreakpoints {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
  wide: boolean;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// ==================== CHART AND ANALYTICS UI ====================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface RevenueChartData {
  monthly: ChartDataPoint[];
  businessModel: ChartDataPoint[];
  status: ChartDataPoint[];
}

export interface StatsCardData {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    period: string;
  };
  icon: React.ComponentType;
  color: string;
}

// ==================== HOOK RETURN TYPES ====================

export interface UseInstallmentPlansReturn {
  plans: InstallmentPlan[];
  stats: InstallmentPlanStats | null;
  loading: LoadingStates;
  error: string | null;
  
  // Actions
  fetchPlans: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createPlan: (data: CreateInstallmentPlanPayload) => Promise<boolean>;
  updatePlan: (id: string, data: UpdateInstallmentPlanPayload) => Promise<boolean>;
  deletePlan: (id: string) => Promise<boolean>;
  searchPlans: (term: string) => Promise<void>;
  
  // State management
  clearError: () => void;
  refetch: () => Promise<void>;
}

export interface UseInstallmentPlanFormReturn {
  formData: CreatePlanFormData;
  validation: FormValidationState;
  loading: boolean;
  
  // Form actions
  updateField: (field: keyof CreatePlanFormData, value: string) => void;
  validateField: (field: keyof CreatePlanFormData) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  submitForm: () => Promise<boolean>;
  
  // Calculated values
  preview: PaymentPreviewData;
  businessModelConfig: BusinessModelPreviewConfig;
}

// ==================== EVENT HANDLER TYPES ====================

export interface PlanEventHandlers {
  onPlanSelect: (plan: InstallmentPlan) => void;
  onPlanEdit: (plan: InstallmentPlan) => void;
  onPlanDelete: (plan: InstallmentPlan) => void;
  onPlanDuplicate: (plan: InstallmentPlan) => void;
  onPlanView: (plan: InstallmentPlan) => void;
}

export interface SearchEventHandlers {
  onSearchChange: (term: string) => void;
  onFilterChange: (filters: InstallmentPlanFilters) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onClearFilters: () => void;
}

export interface FormEventHandlers {
  onFieldChange: (field: keyof CreatePlanFormData, value: string) => void;
  onFieldBlur: (field: keyof CreatePlanFormData) => void;
  onFieldFocus: (field: keyof CreatePlanFormData) => void;
  onSubmit: (data: CreateInstallmentPlanPayload) => Promise<void>;
  onCancel: () => void;
  onReset: () => void;
}

// ==================== ROUTE AND NAVIGATION ====================

export interface InstallmentPlanRoutes {
  list: string;
  create: string;
  edit: (id: string) => string;
  view: (id: string) => string;
  analytics: string;
}

export interface NavigationState {
  currentPage: string;
  breadcrumbs: { label: string; href?: string; }[];
  canGoBack: boolean;
  nextPage?: string;
  previousPage?: string;
} 