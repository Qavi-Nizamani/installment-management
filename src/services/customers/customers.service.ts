"use server";

import { cookies } from "next/headers";
import { createClient } from "@/supabase/database/server";
import { requireTenantAccess, withTenantFilter } from "@/guards/tenant.guard";

// Export the same types that are expected by the store
export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  address?: string;
  national_id?: string;
  created_at: string;
  updated_at: string;
}

// Extended customer with calculated fields
export interface CustomerWithStats extends Customer {
  active_plans: number;
  status: 'Active' | 'Inactive';
}

export interface CreateCustomerPayload {
  name: string;
  phone?: string;
  address?: string;
  national_id?: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  phone?: string;
  address?: string;
  national_id?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  totalRevenue: number;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get all customers for the authenticated user's tenant
 */
export async function getCustomers(): Promise<ServiceResponse<Customer[]>> {
  try {
    // Use tenant guard to get secure context
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply tenant filter for security
    const { data, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        error: 'Failed to fetch customers. Please try again.',
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Error in getCustomers:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get all customers with calculated stats (active plans, total spent)
 */
export async function getCustomersWithStats(): Promise<ServiceResponse<CustomerWithStats[]>> {
  try {
    // Use tenant guard to get secure context
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Get customers with their installment plans data
    const query = supabase
      .from('customers')
      .select(`
        *,
        installment_plans (
          id,
          total_price,
          upfront_paid,
          finance_amount,
          monthly_percentage,
          total_months,
          start_date,
          business_model,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    // Apply tenant filter for security
    const { data, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error fetching customers with stats:', error);
      return {
        success: false,
        error: 'Failed to fetch customers. Please try again.',
      };
    }

    // Calculate stats for each customer
    const customersWithStats: CustomerWithStats[] = (data || []).map((customer: any) => {
      const plans = customer.installment_plans || [];
      
      // Calculate active plans (plans that haven't been completed)
      // A plan is considered active if it's within the payment period
      const now = new Date();
      const activePlans = plans.filter((plan: any) => {
        const startDate = new Date(plan.start_date);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + plan.total_months);
        return now <= endDate;
      }).length;
      
      // Determine status (active if has active plans, inactive otherwise)
      const status: 'Active' | 'Inactive' = activePlans > 0 ? 'Active' : 'Inactive';

      // Remove the nested installment_plans to avoid confusion
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { installment_plans, ...customerData } = customer;

      return {
        ...customerData,
        active_plans: activePlans,
        status
      };
    });

    return {
      success: true,
      data: customersWithStats,
    };
  } catch (error) {
    console.error('Error in getCustomersWithStats:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get customer by ID (with tenant security)
 */
export async function getCustomerById(id: string): Promise<ServiceResponse<Customer>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error fetching customer:', error);
      return {
        success: false,
        error: 'Failed to fetch customer. Please try again.',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error in getCustomerById:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Create a new customer in the user's tenant
 */
export async function createCustomer(payload: CreateCustomerPayload): Promise<ServiceResponse<Customer>> {
  try {
    // Ensure user has tenant access
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { data, error } = await supabase
      .from('customers')
      .insert({
        tenant_id: context.tenantId, // Ensure customer belongs to user's tenant
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
        national_id: payload.national_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: 'Failed to create customer. Please try again.',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error in createCustomer:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Update customer (with tenant security)
 */
export async function updateCustomer(
  id: string, 
  payload: UpdateCustomerPayload
): Promise<ServiceResponse<Customer>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('customers')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    const { data, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        error: 'Failed to update customer. Please try again.',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Delete customer (with tenant security)
 */
export async function deleteCustomer(id: string): Promise<ServiceResponse<void>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('customers')
      .delete()
      .eq('id', id);

    const { error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        error: 'Failed to delete customer. Please try again.',
      };
    }

    return { 
      success: true 
    };
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Search customers (with tenant security)
 */
export async function searchCustomers(searchTerm: string): Promise<ServiceResponse<Customer[]>> {
  if (!searchTerm.trim()) {
    return getCustomers();
  }

  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,national_id.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    const { data, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error searching customers:', error);
      return {
        success: false,
        error: 'Failed to search customers. Please try again.',
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error('Error in searchCustomers:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get customer statistics (with tenant security)
 */
export async function getCustomerStats(): Promise<ServiceResponse<CustomerStats>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('customers')
      .select('*');

    const { data: customers, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error fetching customer stats:', error);
      return {
        success: false,
        error: 'Failed to fetch customer statistics.',
      };
    }

    const stats: CustomerStats = {
      totalCustomers: customers?.length || 0,
      activeCustomers: customers?.length || 0, // For now, all customers are considered active
      newCustomersThisMonth: 0, // TODO: Calculate when we have proper date filtering
      totalRevenue: 0, // TODO: Calculate when installments are implemented
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Error in getCustomerStats:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
} 