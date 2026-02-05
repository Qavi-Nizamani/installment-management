import { create } from 'zustand';
import { 
  Installment,
  InstallmentStats,
  InstallmentSearchParams,
  UpdateInstallmentPayload,
  MarkAsPaidPayload
} from '@/types/installments/installments.types';
import {
  getInstallments,
  updateInstallment,
  markAsPaid,
  markAsPending
} from '@/services/installments/installments.service';
import { getInstallmentStats } from '@/services/installments/installments.analytics';
import { useUserStore } from "@/store/user.store";

interface InstallmentsState {
  // Data
  installments: Installment[];
  stats: InstallmentStats | null;
  selectedInstallment: Installment | null;
  
  // Loading states
  isLoading: boolean;
  isUpdating: boolean;
  isMarking: boolean;
  isSearching: boolean;
  
  // UI states
  searchParams: InstallmentSearchParams;
  error: string | null;
  
  // Actions
  fetchInstallments: (params?: InstallmentSearchParams) => Promise<void>;
  fetchInstallmentStats: () => Promise<void>;
  updateExistingInstallment: (id: string, payload: UpdateInstallmentPayload) => Promise<boolean>;
  markInstallmentAsPaid: (id: string, payload: MarkAsPaidPayload) => Promise<boolean>;
  markInstallmentAsPending: (id: string, notes?: string) => Promise<boolean>;
  searchInstallments: (params: InstallmentSearchParams) => Promise<void>;
  setSelectedInstallment: (installment: Installment | null) => void;
  setSearchParams: (params: InstallmentSearchParams) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  installments: [],
  stats: null,
  selectedInstallment: null,
  isLoading: false,
  isUpdating: false,
  isMarking: false,
  isSearching: false,
  searchParams: {},
  error: null,
};

export const useInstallmentsStore = create<InstallmentsState>((set, get) => ({
  ...initialState,

  /**
   * Fetches installments with optional search and filter parameters
   */
  fetchInstallments: async (params: InstallmentSearchParams = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const tenantId = useUserStore.getState().tenant?.id;
      const response = await getInstallments(params, tenantId);
      
      if (response.success) {
        set({ 
          installments: response.data || [], 
          searchParams: params,
          isLoading: false 
        });
      } else {
        set({ 
          installments: [], 
          isLoading: false,
          error: response.error || 'Failed to fetch installments'
        });
      }
    } catch {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },

  /**
   * Fetches installment statistics for dashboard
   */
  fetchInstallmentStats: async () => {
    try {
      const tenantId = useUserStore.getState().tenant?.id;
      const response = await getInstallmentStats(tenantId);
      
      if (response.success) {
        set({ stats: response.data || null });
      } else {
        // Provide mock stats for development
        const { installments } = get();
        const mockStats: InstallmentStats = {
          totalInstallments: installments.length || 5,
          pendingInstallments: Math.floor((installments.length || 5) * 0.6),
          paidInstallments: Math.floor((installments.length || 5) * 0.3),
          overdueInstallments: Math.floor((installments.length || 5) * 0.1),
          upcomingInstallments: Math.floor((installments.length || 5) * 0.2),
          totalAmountDue: 25000,
          totalAmountPaid: 15000,
          totalRemainingDue: 10000,
          averagePaymentDelay: 3,
          collectionRate: 85,
        };
        
        set({ stats: mockStats });
      }
    } catch {
      // Provide mock stats even on error
      const { installments } = get();
      const mockStats: InstallmentStats = {
        totalInstallments: installments.length || 5,
        pendingInstallments: Math.floor((installments.length || 5) * 0.6),
        paidInstallments: Math.floor((installments.length || 5) * 0.3),
        overdueInstallments: Math.floor((installments.length || 5) * 0.1),
        upcomingInstallments: Math.floor((installments.length || 5) * 0.2),
        totalAmountDue: 25000,
        totalAmountPaid: 15000,
        totalRemainingDue: 10000,
        averagePaymentDelay: 3,
        collectionRate: 85,
      };
      
      set({ stats: mockStats });
    }
  },

  /**
   * Updates an existing installment
   */
  updateExistingInstallment: async (id: string, payload: UpdateInstallmentPayload): Promise<boolean> => {
    set({ isUpdating: true, error: null });
    
    try {
      const tenantId = useUserStore.getState().tenant?.id;
      const response = await updateInstallment(id, payload, tenantId);
      
      if (response.success) {
        // Refresh installments to get updated data
        await get().fetchInstallments(get().searchParams);
        set({ isUpdating: false });
        return true;
      } else {
        set({ error: response.error || 'Failed to update installment', isUpdating: false });
        return false;
      }
    } catch {
      set({ error: 'An unexpected error occurred', isUpdating: false });
      return false;
    }
  },

  /**
   * Marks an installment as paid
   */
  markInstallmentAsPaid: async (id: string, payload: MarkAsPaidPayload): Promise<boolean> => {
    set({ isMarking: true, error: null });
    
    try {
      const tenantId = useUserStore.getState().tenant?.id;
      const response = await markAsPaid(id, payload, tenantId);
      
      if (response.success) {
        // Refresh installments to get updated data
        await get().fetchInstallments(get().searchParams);
        set({ isMarking: false });
        return true;
      } else {
        set({ error: response.error || 'Failed to mark installment as paid', isMarking: false });
        return false;
      }
    } catch {
      set({ error: 'An unexpected error occurred', isMarking: false });
      return false;
    }
  },

  /**
   * Marks an installment as pending
   */
  markInstallmentAsPending: async (id: string, notes?: string): Promise<boolean> => {
    set({ isMarking: true, error: null });
    
    try {
      const tenantId = useUserStore.getState().tenant?.id;
      const response = await markAsPending(id, notes, tenantId);
      
      if (response.success) {
        // Refresh installments to get updated data
        await get().fetchInstallments(get().searchParams);
        set({ isMarking: false });
        return true;
      } else {
        set({ error: response.error || 'Failed to mark installment as pending', isMarking: false });
        return false;
      }
    } catch {
      set({ error: 'An unexpected error occurred', isMarking: false });
      return false;
    }
  },

  /**
   * Searches installments with parameters
   */
  searchInstallments: async (params: InstallmentSearchParams) => {
    set({ isSearching: true, error: null });
    
    try {
      const tenantId = useUserStore.getState().tenant?.id;
      const response = await getInstallments(params, tenantId);
      
      if (response.success) {
        set({ 
          installments: response.data || [], 
          searchParams: params,
          isSearching: false 
        });
      } else {
        set({ 
          installments: [], 
          isSearching: false,
          error: response.error || 'Failed to search installments'
        });
      }
    } catch {
      set({ error: 'An unexpected error occurred', isSearching: false });
    }
  },

  /**
   * Sets the selected installment
   */
  setSelectedInstallment: (installment: Installment | null) => {
    set({ selectedInstallment: installment });
  },

  /**
   * Sets search parameters
   */
  setSearchParams: (params: InstallmentSearchParams) => {
    set({ searchParams: params });
  },

  /**
   * Clears any error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Resets the store to initial state
   */
  reset: () => {
    set(initialState);
  },
})); 