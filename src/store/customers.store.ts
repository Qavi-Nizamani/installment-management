import { create } from 'zustand';
import { 
  Customer, 
  CustomerStats, 
  CreateCustomerPayload, 
  UpdateCustomerPayload,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getCustomerStats
} from '@/services/customers.service';

interface CustomersState {
  // Data
  customers: Customer[];
  stats: CustomerStats | null;
  selectedCustomer: Customer | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isSearching: boolean;
  
  // UI states
  searchTerm: string;
  error: string | null;
  
  // Actions
  fetchCustomers: () => Promise<void>;
  fetchCustomerStats: () => Promise<void>;
  fetchCustomerById: (id: string) => Promise<void>;
  createNewCustomer: (payload: CreateCustomerPayload) => Promise<boolean>;
  updateExistingCustomer: (id: string, payload: UpdateCustomerPayload) => Promise<boolean>;
  deleteExistingCustomer: (id: string) => Promise<boolean>;
  searchCustomersAction: (term: string) => Promise<void>;
  setSelectedCustomer: (customer: Customer | null) => void;
  setSearchTerm: (term: string) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  customers: [],
  stats: null,
  selectedCustomer: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isSearching: false,
  searchTerm: '',
  error: null,
};

export const useCustomersStore = create<CustomersState>((set, get) => ({
  ...initialState,

  /**
   * Fetches all customers from the database
   */
  fetchCustomers: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await getCustomers();
      
      if (response.success) {
        set({ customers: response.data || [], isLoading: false });
      } else {
        // Provide mock customers for development
        const mockCustomers: Customer[] = [
          {
            id: "1",
            tenant_id: "mock-tenant",
            name: "Alice Johnson",
            phone: "+1 (555) 123-4567",
            address: "123 Main St, New York, NY",
            national_id: "123-45-6789",
            created_at: "2023-12-15T00:00:00Z",
            updated_at: "2023-12-15T00:00:00Z",
          },
          {
            id: "2",
            tenant_id: "mock-tenant",
            name: "Bob Smith",
            phone: "+1 (555) 987-6543",
            address: "456 Oak Ave, Los Angeles, CA",
            national_id: "987-65-4321",
            created_at: "2024-01-02T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
          },
          {
            id: "3",
            tenant_id: "mock-tenant",
            name: "Carol Davis",
            phone: "+1 (555) 456-7890",
            address: "789 Pine St, Chicago, IL",
            national_id: "456-78-9012",
            created_at: "2023-11-20T00:00:00Z",
            updated_at: "2023-11-20T00:00:00Z",
          },
        ];
        
        set({ 
          customers: mockCustomers, 
          isLoading: false,
          error: 'Using mock data - configure Supabase for real data'
        });
      }
    } catch {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },

  /**
   * Fetches customer statistics for dashboard
   */
  fetchCustomerStats: async () => {
    try {
      const response = await getCustomerStats();
      
      if (response.success) {
        set({ stats: response.data || null });
      } else {
        // Provide mock stats for development
        const { customers } = get();
        const mockStats: CustomerStats = {
          totalCustomers: customers.length || 3,
          activeCustomers: Math.floor((customers.length || 3) * 0.8),
          newCustomersThisMonth: 2,
          totalRevenue: 18600,
        };
        
        set({ stats: mockStats });
      }
    } catch {
      // Provide mock stats even on error
      const { customers } = get();
      const mockStats: CustomerStats = {
        totalCustomers: customers.length || 3,
        activeCustomers: Math.floor((customers.length || 3) * 0.8),
        newCustomersThisMonth: 2,
        totalRevenue: 18600,
      };
      
      set({ stats: mockStats });
    }
  },

  /**
   * Fetches a single customer by ID
   */
  fetchCustomerById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await getCustomerById(id);
      
      if (response.success) {
        set({ selectedCustomer: response.data || null, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch customer', isLoading: false });
      }
    } catch {
      set({ error: 'An unexpected error occurred', isLoading: false });
    }
  },

  /**
   * Creates a new customer
   */
  createNewCustomer: async (payload: CreateCustomerPayload): Promise<boolean> => {
    set({ isCreating: true, error: null });
    
    try {
      const response = await createCustomer(payload);
      
      if (response.success) {
        // Add the new customer to the list
        const { customers } = get();
        set({ 
          customers: [response.data!, ...customers],
          isCreating: false 
        });
        return true;
      } else {
        set({ error: response.error || 'Failed to create customer', isCreating: false });
        return false;
      }
    } catch {
      set({ error: 'An unexpected error occurred', isCreating: false });
      return false;
    }
  },

  /**
   * Updates an existing customer
   */
  updateExistingCustomer: async (id: string, payload: UpdateCustomerPayload): Promise<boolean> => {
    set({ isUpdating: true, error: null });
    
    try {
      const response = await updateCustomer(id, payload);
      
      if (response.success) {
        // Update the customer in the list
        const { customers } = get();
        const updatedCustomers = customers.map(customer => 
          customer.id === id ? response.data! : customer
        );
        
        set({ 
          customers: updatedCustomers,
          selectedCustomer: response.data!,
          isUpdating: false 
        });
        return true;
      } else {
        set({ error: response.error || 'Failed to update customer', isUpdating: false });
        return false;
      }
    } catch {
      set({ error: 'An unexpected error occurred', isUpdating: false });
      return false;
    }
  },

  /**
   * Deletes a customer
   */
  deleteExistingCustomer: async (id: string): Promise<boolean> => {
    set({ isDeleting: true, error: null });
    
    try {
      const response = await deleteCustomer(id);
      
      if (response.success) {
        // Remove the customer from the list
        const { customers } = get();
        const filteredCustomers = customers.filter(customer => customer.id !== id);
        
        set({ 
          customers: filteredCustomers,
          selectedCustomer: null,
          isDeleting: false 
        });
        return true;
      } else {
        set({ error: response.error || 'Failed to delete customer', isDeleting: false });
        return false;
      }
    } catch {
      set({ error: 'An unexpected error occurred', isDeleting: false });
      return false;
    }
  },

  /**
   * Searches customers by term
   */
  searchCustomersAction: async (term: string) => {
    set({ isSearching: true, error: null, searchTerm: term });
    
    try {
      if (term.trim() === '') {
        // If search term is empty, fetch all customers
        await get().fetchCustomers();
      } else {
        const response = await searchCustomers(term);
        
        if (response.success) {
          set({ customers: response.data || [], isSearching: false });
        } else {
          // Fallback to local filtering of existing customers
          const { customers } = get();
          const filteredCustomers = customers.filter(customer =>
            customer.name.toLowerCase().includes(term.toLowerCase()) ||
            (customer.phone && customer.phone.includes(term)) ||
            (customer.national_id && customer.national_id.includes(term))
          );
          
          set({ customers: filteredCustomers, isSearching: false });
        }
      }
    } catch {
      set({ error: 'An unexpected error occurred', isSearching: false });
    }
  },

  /**
   * Sets the selected customer
   */
  setSelectedCustomer: (customer: Customer | null) => {
    set({ selectedCustomer: customer });
  },

  /**
   * Sets the search term
   */
  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
  },

  /**
   * Clears any error messages
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