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
 * Mark installment as paid with advanced payment handling
 * - Any payment marks current installment as PAID
 * - Underpayment: remaining balance moved to next installment
 * - Overpayment: excess amount reduces last installment
 * - Edge cases: handle when no next/last installments exist
 */
export async function markAsPaid(installmentId: string, payload: MarkAsPaidPayload): Promise<ServiceResponse<InstallmentRecord>> {
  try {
    const context = await requireTenantAccess();
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Get the current installment
    const { data: currentInstallment, error: fetchError } = await withTenantFilter(
      supabase
        .from('installments')
        .select('*')
        .eq('id', installmentId)
        .single(),
      context.tenantId
    );

    if (fetchError || !currentInstallment) {
      console.error('Error fetching installment:', fetchError);
      return { success: false, error: 'Failed to fetch installment details' };
    }

    const paymentAmount = payload.amount_paid;
    const amountDue = currentInstallment.amount_due;
    const planId = currentInstallment.installment_plan_id;

    // Always mark current installment as PAID
    const currentInstallmentUpdate: UpdateInstallmentPayload = {
      amount_paid: paymentAmount,
      status: 'PAID' as InstallmentStatus,
      paid_on: payload.paid_on,
      notes: payload.notes
    };

    // Handle underpayment: move remaining balance to next installment
    if (paymentAmount < amountDue) {
      const remainingBalance = amountDue - paymentAmount;
      
      // Find next installment in the same plan
      const { data: nextInstallments, error: nextError } = await withTenantFilter(
        supabase
          .from('installments')
          .select('*')
          .eq('installment_plan_id', planId)
          .eq('status', 'PENDING')
          .gt('due_date', currentInstallment.due_date)
          .order('due_date', { ascending: true })
          .limit(1),
        context.tenantId
      );

      if (nextError) {
        console.error('Error fetching next installment:', nextError);
        // Don't fail the whole transaction, just log the issue
      } else if (nextInstallments && nextInstallments.length > 0) {
        // Move remaining balance to next installment
        const nextInstallment = nextInstallments[0];
        const nextInstallmentUpdate: UpdateInstallmentPayload = {
          amount_due: nextInstallment.amount_due + remainingBalance,
          notes: `${nextInstallment.notes || ''} [Balance of $${remainingBalance.toLocaleString()} carried forward from previous installment]`.trim()
        };

        await updateInstallment(nextInstallment.id, nextInstallmentUpdate);
        
        // Update current installment amount_due to match amount_paid (so remaining_due = 0)
        currentInstallmentUpdate.amount_due = paymentAmount;
      }
      // If no next installment exists, keep original amount_due to show the shortfall
    }

    // Handle overpayment: reduce last installment
    else if (paymentAmount > amountDue) {
      const excessAmount = paymentAmount - amountDue;
      
      // Find last unpaid installment in the same plan
      const { data: lastInstallments, error: lastError } = await withTenantFilter(
        supabase
          .from('installments')
          .select('*')
          .eq('installment_plan_id', planId)
          .in('status', ['PENDING', 'OVERDUE'])
          .order('due_date', { ascending: false })
          .limit(1),
        context.tenantId
      );

      if (lastError) {
        console.error('Error fetching last installment:', lastError);
        // Don't fail the whole transaction, just log the issue
      } else if (lastInstallments && lastInstallments.length > 0) {
        const lastInstallment = lastInstallments[0];
        
        // Reduce the last installment by excess amount (but not below 0)
        const newAmountDue = Math.max(0, lastInstallment.amount_due - excessAmount);
        const lastInstallmentUpdate: UpdateInstallmentPayload = {
          amount_due: newAmountDue,
          notes: `${lastInstallment.notes || ''} [Reduced by $${Math.min(excessAmount, lastInstallment.amount_due).toLocaleString()} overpayment from earlier installment]`.trim()
        };

        // If the last installment is now fully paid by the excess
        if (newAmountDue === 0) {
          lastInstallmentUpdate.status = 'PAID' as InstallmentStatus;
          lastInstallmentUpdate.amount_paid = lastInstallment.amount_due;
          lastInstallmentUpdate.paid_on = payload.paid_on;
        }

        await updateInstallment(lastInstallment.id, lastInstallmentUpdate);
        
        // Keep current installment's original amount_due (shows the overpayment clearly)
      }
      // If no last installment exists, keep original amount_due to show the overpayment
    }

    // Update current installment
    const currentUpdateResult = await updateInstallment(installmentId, currentInstallmentUpdate);
    if (!currentUpdateResult.success) {
      return currentUpdateResult;
    }

    return currentUpdateResult;
  } catch (error) {
    console.error('Error in markAsPaid:', error);
    return { success: false, error: 'Failed to process payment' };
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