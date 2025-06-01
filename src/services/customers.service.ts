"use server";

import { cookies } from "next/headers";
import { createClient } from "@/supabase/database/server";

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

export interface CreateCustomerPayload {
  tenant_id: string;
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

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Retrieves all customers for the authenticated user's tenant
 * @returns Promise<ServiceResponse<Customer[]>>
 */
export async function getCustomers(): Promise<ServiceResponse<Customer[]>> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching customers:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching customers.",
    };
  }
}

/**
 * Retrieves a single customer by ID
 * @param customerId - The UUID of the customer to retrieve
 * @returns Promise<ServiceResponse<Customer>>
 */
export async function getCustomerById(customerId: string): Promise<ServiceResponse<Customer>> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred while fetching the customer.",
    };
  }
}

/**
 * Creates a new customer in the database
 * @param payload - Customer data to create
 * @returns Promise<ServiceResponse<Customer>>
 */
export async function createCustomer(payload: CreateCustomerPayload): Promise<ServiceResponse<Customer>> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        tenant_id: payload.tenant_id,
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
        national_id: payload.national_id,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred while creating the customer.",
    };
  }
}

/**
 * Updates an existing customer's information
 * @param customerId - The UUID of the customer to update
 * @param payload - Updated customer data
 * @returns Promise<ServiceResponse<Customer>>
 */
export async function updateCustomer(
  customerId: string, 
  payload: UpdateCustomerPayload
): Promise<ServiceResponse<Customer>> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: payload.name,
        phone: payload.phone,
        address: payload.address,
        national_id: payload.national_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred while updating the customer.",
    };
  }
}

/**
 * Deletes a customer from the database (requires OWNER role)
 * @param customerId - The UUID of the customer to delete
 * @returns Promise<ServiceResponse<void>>
 */
export async function deleteCustomer(customerId: string): Promise<ServiceResponse<void>> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred while deleting the customer.",
    };
  }
}

/**
 * Searches customers by name, phone, or national ID
 * @param searchTerm - The search term to filter customers
 * @returns Promise<ServiceResponse<Customer[]>>
 */
export async function searchCustomers(searchTerm: string): Promise<ServiceResponse<Customer[]>> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,national_id.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: data || [],
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred while searching customers.",
    };
  }
}

/**
 * Gets customer statistics for dashboard display
 * @returns Promise<ServiceResponse<CustomerStats>>
 */
export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  totalRevenue: number;
}

export async function getCustomerStats(): Promise<ServiceResponse<CustomerStats>> {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  try {
    // Get total customers count
    const { count: totalCustomers, error: totalError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      return {
        success: false,
        error: totalError.message,
      };
    }

    // Get customers created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newCustomersThisMonth, error: monthError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    if (monthError) {
      return {
        success: false,
        error: monthError.message,
      };
    }

    // For now, return mock data for activeCustomers and totalRevenue
    // These would require joining with installment_plans table
    const stats: CustomerStats = {
      totalCustomers: totalCustomers || 0,
      activeCustomers: Math.floor((totalCustomers || 0) * 0.8), // 80% estimated as active
      newCustomersThisMonth: newCustomersThisMonth || 0,
      totalRevenue: 0, // Would need to calculate from installment_plans
    };

    return {
      success: true,
      data: stats,
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred while fetching customer statistics.",
    };
  }
} 