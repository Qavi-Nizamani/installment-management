import { createClient } from '@/supabase/database/client';
import type { 
  Installment, 
  InstallmentSearchParams, 
  InstallmentStats,
  UpdateInstallmentPayload,
  MarkAsPaidPayload,
  InstallmentStatus
} from '@/types/installments/installments.types';

const supabase = createClient();

// ==================== FETCH FUNCTIONS ====================

export async function getInstallments(params: InstallmentSearchParams = {}) {
  try {
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

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching installments:', error);
      return { success: false, error: error.message, data: [] };
    }

    // Transform the data to match our Installment interface
    const installments: Installment[] = (data || []).map((item: any) => {
      const installment: any = {
        ...item,
        customer: item.installment_plan?.customer,
        plan_title: item.installment_plan?.title,
        remaining_due: Math.max(0, item.amount_due - item.amount_paid),
        days_overdue: item.status === 'OVERDUE' ? 
          Math.floor((new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        is_upcoming: item.status === 'PENDING' && 
          new Date(item.due_date).getTime() <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime()
      };
      
      // Remove the nested installment_plan object to avoid confusion
      delete installment.installment_plan;
      
      return installment as Installment;
    });

    return { success: true, data: installments };
  } catch (error) {
    console.error('Error in getInstallments:', error);
    return { success: false, error: 'Failed to fetch installments', data: [] };
  }
}

export async function getInstallmentStats(): Promise<{ success: boolean; data?: InstallmentStats; error?: string }> {
  try {
    const { data: installments, error } = await supabase
      .from('installments')
      .select('*');

    if (error) {
      return { success: false, error: error.message };
    }

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats: InstallmentStats = {
      totalInstallments: installments.length,
      pendingInstallments: installments.filter((i: any) => i.status === 'PENDING').length,
      paidInstallments: installments.filter((i: any) => i.status === 'PAID').length,
      overdueInstallments: installments.filter((i: any) => i.status === 'OVERDUE').length,
      upcomingInstallments: installments.filter((i: any) => 
        i.status === 'PENDING' && 
        new Date(i.due_date) >= now && 
        new Date(i.due_date) <= weekFromNow
      ).length,
      totalAmountDue: installments.reduce((sum: number, i: any) => sum + i.amount_due, 0),
      totalAmountPaid: installments.reduce((sum: number, i: any) => sum + i.amount_paid, 0),
      totalRemainingDue: installments.reduce((sum: number, i: any) => sum + Math.max(0, i.amount_due - i.amount_paid), 0),
      averagePaymentDelay: 0, // TODO: Calculate based on paid_date vs due_date
      collectionRate: installments.length > 0 ? 
        (installments.filter((i: any) => i.status === 'PAID').length / installments.length) * 100 : 0
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getInstallmentStats:', error);
    return { success: false, error: 'Failed to fetch installment stats' };
  }
}

// ==================== UPDATE FUNCTIONS ====================

export async function updateInstallment(installmentId: string, payload: UpdateInstallmentPayload) {
  try {
    const { data, error } = await supabase
      .from('installments')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', installmentId)
      .select()
      .single();

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

export async function markAsPaid(installmentId: string, payload: MarkAsPaidPayload) {
  try {
    const updatePayload: UpdateInstallmentPayload = {
      amount_paid: payload.amount_paid,
      status: 'PAID' as InstallmentStatus,
      paid_date: payload.paid_date,
      notes: payload.notes
    };

    return await updateInstallment(installmentId, updatePayload);
  } catch (error) {
    console.error('Error in markAsPaid:', error);
    return { success: false, error: 'Failed to mark installment as paid' };
  }
}

export async function markAsPending(installmentId: string, notes?: string) {
  try {
    const updatePayload: UpdateInstallmentPayload = {
      status: 'PENDING' as InstallmentStatus,
      paid_date: undefined,
      notes
    };

    return await updateInstallment(installmentId, updatePayload);
  } catch (error) {
    console.error('Error in markAsPending:', error);
    return { success: false, error: 'Failed to mark installment as pending' };
  }
}

// ==================== UTILITY FUNCTIONS ====================

export function calculateRemainingDue(amountDue: number, amountPaid: number): number {
  return Math.max(0, amountDue - amountPaid);
}

export function calculateDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  
  if (now <= due) return 0;
  
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

export function isUpcoming(dueDate: string, status: InstallmentStatus, daysAhead: number = 7): boolean {
  if (status !== 'PENDING') return false;
  
  const due = new Date(dueDate);
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  return due >= now && due <= futureDate;
} 