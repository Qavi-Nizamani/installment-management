"use server";

import { cookies } from "next/headers";
import { createClient } from "@/supabase/database/server";
import { requireTenantAccess, withTenantFilter } from "@/guards/tenant.guard";
import type { 
  Installment, 
  InstallmentRecord,
  InstallmentSearchParams, 
  UpdateInstallmentPayload,
  MarkAsPaidPayload,
  InstallmentStatus
} from '@/types/installments/installments.types';

// ==================== SERVICE RESPONSE TYPES ====================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== DATABASE TYPES ====================

interface InstallmentWithRelations extends InstallmentRecord {
  installment_plan?: {
    title: string;
    customer?: {
      id: string;
      name: string;
      phone?: string;
    };
  };
}

// ==================== FETCH FUNCTIONS ====================

/**
 * Get installments with search, filters, and pagination
 */
export async function getInstallments(params: InstallmentSearchParams = {}): Promise<ServiceResponse<Installment[]>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    let query = supabase
      .from('installments')
      .select(`
        *,
        installment_plan:installment_plans(
          title,
          customer:customers(
            id,
            name,
            phone
          )
        )
      `);

    // Apply search filter
    if (params.search_term) {
      query = query.or(`
        installment_plan.title.ilike.%${params.search_term}%,
        installment_plan.customer.name.ilike.%${params.search_term}%
      `);
    }

    // Apply status filter
    if (params.filters?.status?.length) {
      query = query.in('status', params.filters.status);
    }

    // Apply date range filter
    if (params.filters?.date_range) {
      query = query
        .gte('due_date', params.filters.date_range.start_date)
        .lte('due_date', params.filters.date_range.end_date);
    }

    // Apply customer filter
    if (params.filters?.customer_id) {
      query = query.eq('installment_plan.customer_id', params.filters.customer_id);
    }

    // Apply plan filter
    if (params.filters?.installment_plan_id) {
      query = query.eq('installment_plan_id', params.filters.installment_plan_id);
    }

    // Apply overdue filter
    if (params.filters?.overdue_only) {
      const today = new Date().toISOString().split('T')[0];
      query = query.lt('due_date', today).eq('status', 'OVERDUE');
    }

    // Apply upcoming filter
    if (params.filters?.upcoming_only) {
      const today = new Date().toISOString().split('T')[0];
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query
        .gte('due_date', today)
        .lte('due_date', weekFromNow)
        .eq('status', 'PENDING');
    }

    // Apply sorting
    const sortBy = params.sort_by || 'due_date';
    const sortOrder = params.sort_order || 'asc';
    
    if (sortBy === 'customer_name') {
      query = query.order('name', { ascending: sortOrder === 'asc', referencedTable: 'installment_plan.customer' });
    } else if (sortBy === 'plan_title') {
      query = query.order('title', { ascending: sortOrder === 'asc', referencedTable: 'installment_plan' });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    if (params.page && params.per_page) {
      const start = (params.page - 1) * params.per_page;
      const end = start + params.per_page - 1;
      query = query.range(start, end);
    }

    const { data, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error fetching installments:', error);
      return { success: false, error: error.message };
    }

    // Transform the data to match our Installment interface
    const { calculateRemainingDue, calculateDaysOverdue, isUpcoming } = await import('@/helpers/installments.helper');
    
    const installments: Installment[] = (data || []).map((item: InstallmentWithRelations) => {
      return {
        ...item,
        customer: item.installment_plan?.customer,
        plan_title: item.installment_plan?.title,
        remaining_due: calculateRemainingDue(item.amount_due, item.amount_paid),
        days_overdue: item.status === 'OVERDUE' ? calculateDaysOverdue(item.due_date) : 0,
        is_upcoming: isUpcoming(item.due_date, item.status),
        // Remove installment_plan from the final object
        installment_plan: undefined
      } as Installment;
    });

    return { success: true, data: installments };
  } catch (error) {
    console.error('Error in getInstallments:', error);
    return { success: false, error: 'Failed to fetch installments' };
  }
}

// ==================== ANALYTICS FUNCTIONS ====================
// Analytics functions have been moved to ./installments.analytics.ts for better organization
// 
// Note: Analytics functions cannot be re-exported due to "use server" directive restrictions.
// Import analytics functions directly from '@/services/installments/installments.analytics' when needed.

// ==================== UPDATE FUNCTIONS ====================

/**
 * Update installment with new data
 */
export async function updateInstallment(installmentId: string, payload: UpdateInstallmentPayload): Promise<ServiceResponse<InstallmentRecord>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('installments')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', installmentId)
      .select()
      .single();

    const { data, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error updating installment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateInstallment:', error);
    return { success: false, error: 'Failed to update installment' };
  }
}

/**
 * Mark installment as paid with payment details
 */
export async function markAsPaid(installmentId: string, payload: MarkAsPaidPayload): Promise<ServiceResponse<InstallmentRecord>> {
  try {
    const updatePayload: UpdateInstallmentPayload = {
      amount_paid: payload.amount_paid,
      status: 'PAID' as InstallmentStatus,
      paid_on: payload.paid_on,
      notes: payload.notes
    };

    return await updateInstallment(installmentId, updatePayload);
  } catch (error) {
    console.error('Error in markAsPaid:', error);
    return { success: false, error: 'Failed to mark installment as paid' };
  }
}

/**
 * Mark installment as pending
 */
export async function markAsPending(installmentId: string, notes?: string): Promise<ServiceResponse<InstallmentRecord>> {
  try {
    const updatePayload: UpdateInstallmentPayload = {
      status: 'PENDING' as InstallmentStatus,
      paid_on: undefined,
      notes
    };

    return await updateInstallment(installmentId, updatePayload);
  } catch (error) {
    console.error('Error in markAsPending:', error);
    return { success: false, error: 'Failed to mark installment as pending' };
  }
}