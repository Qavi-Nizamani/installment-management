"use server";

import { cookies } from "next/headers";
import { createClient } from "@/supabase/database/server";
import { requireTenantAccess, withTenantFilter } from "@/guards/tenant.guard";
import type {
  ServiceResponse,
  InstallmentPlan,
  InstallmentPlanRecord,
  CreateInstallmentPlanPayload,
  UpdateInstallmentPlanPayload
} from "./installmentPlans.types";

/**
 * Get all installment plans with customer data and calculated fields
 */
export async function getInstallmentPlans(): Promise<ServiceResponse<InstallmentPlan[]>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Get installment plans with customer data
    const query = supabase
      .from('installment_plans')
      .select(`
        *,
        customer:customers(id, name, phone)
      `)
      .order('created_at', { ascending: false });

    const { data: plans, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error fetching installment plans:', error);
      return {
        success: false,
        error: 'Failed to fetch installment plans.',
      };
    }

    // Calculate derived fields for each plan
    const plansWithCalculations = await Promise.all(
      (plans || []).map(async (plan: InstallmentPlanRecord & { customer?: { id: string; name: string; phone?: string } }) => {
        const calculations = await calculatePlanMetrics(plan.id, plan);
        return {
          ...plan,
          ...calculations,
        };
      })
    );

    return {
      success: true,
      data: plansWithCalculations,
    };
  } catch (error) {
    console.error('Error in getInstallmentPlans:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Get installment plan by ID with full details
 */
export async function getInstallmentPlanById(id: string): Promise<ServiceResponse<InstallmentPlan>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('installment_plans')
      .select(`
        *,
        customer:customers(id, name, phone, address, national_id)
      `)
      .eq('id', id)
      .single();

    const { data: plan, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error fetching installment plan:', error);
      return {
        success: false,
        error: 'Failed to fetch installment plan.',
      };
    }

    // Calculate derived fields
    const calculations = await calculatePlanMetrics(plan.id, plan);

    return {
      success: true,
      data: {
        ...plan,
        ...calculations,
      },
    };
  } catch (error) {
    console.error('Error in getInstallmentPlanById:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Create a new installment plan
 */
export async function createInstallmentPlan(
  payload: CreateInstallmentPlanPayload
): Promise<ServiceResponse<InstallmentPlan>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Validate that customer belongs to the same tenant
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', payload.customer_id)
      .eq('tenant_id', context.tenantId)
      .single();

    if (customerError || !customer) {
      return {
        success: false,
        error: 'Customer not found or access denied.',
      };
    }

    // Create the installment plan
    const { data: plan, error } = await supabase
      .from('installment_plans')
      .insert({
        tenant_id: context.tenantId,
        customer_id: payload.customer_id,
        title: payload.title,
        total_price: payload.total_price,
        upfront_paid: payload.upfront_paid,
        finance_amount: payload.finance_amount,
        monthly_percentage: payload.monthly_percentage,
        total_months: payload.total_months,
        start_date: payload.start_date,
        business_model: payload.business_model,
        notes: payload.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating installment plan:', error);
      return {
        success: false,
        error: 'Failed to create installment plan.',
      };
    }

    // Generate installment records for this plan
    await generateInstallmentRecords(plan.id, plan);

    return {
      success: true,
      data: plan,
    };
  } catch (error) {
    console.error('Error in createInstallmentPlan:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Update installment plan
 */
export async function updateInstallmentPlan(
  id: string,
  payload: UpdateInstallmentPlanPayload
): Promise<ServiceResponse<InstallmentPlan>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // If customer_id is being updated, validate it belongs to same tenant
    if (payload.customer_id) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', payload.customer_id)
        .eq('tenant_id', context.tenantId)
        .single();

      if (customerError || !customer) {
        return {
          success: false,
          error: 'Customer not found or access denied.',
        };
      }
    }

    const query = supabase
      .from('installment_plans')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    const { data: plan, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error updating installment plan:', error);
      return {
        success: false,
        error: 'Failed to update installment plan.',
      };
    }

    return {
      success: true,
      data: plan,
    };
  } catch (error) {
    console.error('Error in updateInstallmentPlan:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Delete installment plan
 */
export async function deleteInstallmentPlan(id: string): Promise<ServiceResponse<void>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('installment_plans')
      .delete()
      .eq('id', id);

    const { error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error deleting installment plan:', error);
      return {
        success: false,
        error: 'Failed to delete installment plan.',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteInstallmentPlan:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Search installment plans
 */
export async function searchInstallmentPlans(
  searchTerm: string
): Promise<ServiceResponse<InstallmentPlan[]>> {
  if (!searchTerm.trim()) {
    return getInstallmentPlans();
  }

  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('installment_plans')
      .select(`
        *,
        customer:customers(id, name, phone)
      `)
      .or(`title.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    const { data: plans, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error searching installment plans:', error);
      return {
        success: false,
        error: 'Failed to search installment plans.',
      };
    }

    // Calculate derived fields for each plan
    const plansWithCalculations = await Promise.all(
      (plans || []).map(async (plan: InstallmentPlanRecord & { customer?: { id: string; name: string; phone?: string } }) => {
        const calculations = await calculatePlanMetrics(plan.id, plan);
        return {
          ...plan,
          ...calculations,
        };
      })
    );

    return {
      success: true,
      data: plansWithCalculations,
    };
  } catch (error) {
    console.error('Error in searchInstallmentPlans:', error);
    return {
      success: false,
      error: 'An unexpected error occurred.',
    };
  }
}

/**
 * Calculate Future Value using compound interest formula
 */
function calculateFutureValue(financeAmount: number, monthlyPercentage: number, totalMonths: number): number {
  if (monthlyPercentage === 0) {
    return financeAmount; // No interest
  }
  const rate = monthlyPercentage / 100;
  return financeAmount * Math.pow(1 + rate, totalMonths);
}

/**
 * Calculate monthly installment amount using compound interest
 */
function calculateMonthlyInstallment(financeAmount: number, monthlyPercentage: number, totalMonths: number): number {
  const futureValue = calculateFutureValue(financeAmount, monthlyPercentage, totalMonths);
  return futureValue / totalMonths;
}

/**
 * Calculate metrics for a plan (monthly amount, status, payments, etc.)
 */
async function calculatePlanMetrics(planId: string, plan: Pick<InstallmentPlan, 'finance_amount' | 'total_months' | 'upfront_paid' | 'total_price' | 'monthly_percentage' | 'business_model'>) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Get installment records for this plan
    const { data: installments } = await supabase
      .from('installments')
      .select('*')
      .eq('installment_plan_id', planId)
      .order('due_date', { ascending: true });

    // Calculate monthly amount using compound interest formula
    const monthlyAmount = calculateMonthlyInstallment(plan.finance_amount, plan.monthly_percentage, plan.total_months);
    
    const paidInstallments = installments?.filter(i => i.status === 'PAID') || [];
    const monthsPaid = paidInstallments.length;
    const totalPaid = plan.upfront_paid + paidInstallments.reduce((sum, i) => sum + i.amount_paid, 0);
    
    // Calculate remaining amount using the compound interest formula
    const totalAmountDue = plan.upfront_paid + calculateFutureValue(plan.finance_amount, plan.monthly_percentage, plan.total_months);
    const remainingAmount = totalAmountDue - totalPaid;

    // Calculate revenue based on business model
    const totalInterest = calculateFutureValue(plan.finance_amount, plan.monthly_percentage, plan.total_months) - plan.finance_amount;
    let myRevenue = 0;
    
    if (plan.business_model === 'PRODUCT_OWNER') {
      // Product owner gets: upfront payment + all installment payments (product price + interest)
      myRevenue = totalPaid;
    } else {
      // Financer only gets: interest portion of paid installments
      const interestPerInstallment = totalInterest / plan.total_months;
      myRevenue = monthsPaid * interestPerInstallment;
    }

    // Determine status
    let status: 'ACTIVE' | 'COMPLETED' | 'OVERDUE' = 'ACTIVE';
    
    if (monthsPaid >= plan.total_months) {
      status = 'COMPLETED';
    } else {
      const overdueInstallments = installments?.filter(i => 
        i.status === 'OVERDUE' || 
        (i.status === 'PENDING' && new Date(i.due_date) < new Date())
      ) || [];
      
      if (overdueInstallments.length > 0) {
        status = 'OVERDUE';
      }
    }

    // Find next due date
    const nextInstallment = installments?.find(i => i.status === 'PENDING');
    const nextDueDate = nextInstallment?.due_date;

    return {
      monthly_amount: monthlyAmount,
      status,
      months_paid: monthsPaid,
      next_due_date: nextDueDate,
      total_paid: totalPaid,
      remaining_amount: remainingAmount,
      my_revenue: myRevenue,
      total_interest: totalInterest,
    };
  } catch (error) {
    console.error('Error calculating plan metrics:', error);
    return {
      monthly_amount: 0,
      status: 'ACTIVE' as const,
      months_paid: 0,
      next_due_date: undefined,
      total_paid: plan.upfront_paid,
      remaining_amount: plan.total_price - plan.upfront_paid,
      my_revenue: plan.business_model === 'PRODUCT_OWNER' ? plan.upfront_paid : 0,
      total_interest: 0,
    };
  }
}

/**
 * Generate installment records for a new plan
 */
async function generateInstallmentRecords(planId: string, plan: Pick<InstallmentPlanRecord, 'finance_amount' | 'total_months' | 'start_date' | 'tenant_id' | 'monthly_percentage'>) {
  try {
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // Calculate monthly amount using compound interest formula
    const monthlyAmount = calculateMonthlyInstallment(plan.finance_amount, plan.monthly_percentage, plan.total_months);
    const startDate = new Date(plan.start_date);
    
    const installments = [];
    
    for (let i = 1; i <= plan.total_months; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      installments.push({
        installment_plan_id: planId,
        tenant_id: plan.tenant_id,
        due_date: dueDate.toISOString().split('T')[0],
        amount_due: monthlyAmount,
        status: 'PENDING',
      });
    }

    await supabase
      .from('installments')
      .insert(installments);
  } catch (error) {
    console.error('Error generating installment records:', error);
  }
} 