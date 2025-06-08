"use server";

import { cookies } from "next/headers";
import { createClient } from "@/supabase/database/server";
import { requireTenantAccess, withTenantFilter } from "@/guards/tenant.guard";
import type { 
  InstallmentRecord,
  InstallmentStats
} from '@/types/installments/installments.types';
import type {
  PaymentAnalytics,
  CollectionAnalytics,
  PeriodAnalytics
} from '@/helpers/installments.analytics.helper';

// ==================== SERVICE RESPONSE TYPES ====================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== ANALYTICS TYPES ====================
// Analytics types have been moved to @/helpers/installments.analytics.helper.ts for better organization

// Re-export analytics types for backward compatibility
export type {
  PaymentAnalytics,
  MonthlyPaymentTrend,
  CollectionAnalytics,
  RiskAnalysis,
  PeriodAnalytics
} from '@/helpers/installments.analytics.helper';

// ==================== ANALYTICS FUNCTIONS ====================

/**
 * Get comprehensive installment statistics for dashboard
 */
export async function getInstallmentStats(): Promise<ServiceResponse<InstallmentStats>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('installments')
      .select('*');

    const { data: installments, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error fetching installment stats:', error);
      return { success: false, error: error.message };
    }

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Calculate totals first
    const totalAmountDue = installments.reduce((sum: number, installment: InstallmentRecord) => sum + installment.amount_due, 0);
    const totalAmountPaid = installments.reduce((sum: number, installment: InstallmentRecord) => sum + installment.amount_paid, 0);

    const stats: InstallmentStats = {
      totalInstallments: installments.length,
      pendingInstallments: installments.filter((installment: InstallmentRecord) => installment.status === 'PENDING').length,
      paidInstallments: installments.filter((installment: InstallmentRecord) => installment.status === 'PAID').length,
      overdueInstallments: installments.filter((installment: InstallmentRecord) => installment.status === 'OVERDUE').length,
      upcomingInstallments: installments.filter((installment: InstallmentRecord) => 
        installment.status === 'PENDING' && 
        new Date(installment.due_date) >= now && 
        new Date(installment.due_date) <= weekFromNow
      ).length,
      totalAmountDue,
      totalAmountPaid,
      totalRemainingDue: installments.reduce((sum: number, installment: InstallmentRecord) => sum + Math.max(0, installment.amount_due - installment.amount_paid), 0),
      averagePaymentDelay: (await import('@/helpers/installments.analytics.helper')).calculateAveragePaymentDelay(installments),
      collectionRate: totalAmountDue > 0 ? 
        (totalAmountPaid / totalAmountDue) * 100 : 0
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getInstallmentStats:', error);
    return { success: false, error: 'Failed to fetch installment stats' };
  }
}

/**
 * Get payment analytics including trends and delays
 */
export async function getPaymentAnalytics(): Promise<ServiceResponse<PaymentAnalytics>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('installments')
      .select('*')
      .eq('status', 'PAID')
      .not('paid_on', 'is', null);

    const { data: paidInstallments, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error fetching payment analytics:', error);
      return { success: false, error: error.message };
    }

    const { calculatePaymentAnalytics } = await import('@/helpers/installments.analytics.helper');
    const analytics = calculatePaymentAnalytics(paidInstallments);
    
    return { success: true, data: analytics };
  } catch (error) {
    console.error('Error in getPaymentAnalytics:', error);
    return { success: false, error: 'Failed to fetch payment analytics' };
  }
}

/**
 * Get collection analytics and risk assessment
 */
export async function getCollectionAnalytics(): Promise<ServiceResponse<CollectionAnalytics>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const query = supabase
      .from('installments')
      .select('*');

    const { data: installments, error } = await withTenantFilter(query, context.tenantId);

    if (error) {
      console.error('Error fetching collection analytics:', error);
      return { success: false, error: error.message };
    }

    const { calculateCollectionAnalytics } = await import('@/helpers/installments.analytics.helper');
    const analytics = calculateCollectionAnalytics(installments);
    
    return { success: true, data: analytics };
  } catch (error) {
    console.error('Error in getCollectionAnalytics:', error);
    return { success: false, error: 'Failed to fetch collection analytics' };
  }
}

/**
 * Get analytics for a specific time period with trends
 */
export async function getPeriodAnalytics(
  period: 'week' | 'month' | 'quarter' | 'year',
  startDate?: string
): Promise<ServiceResponse<PeriodAnalytics>> {
  try {
    const context = await requireTenantAccess();
    
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    const { calculatePeriodDates, calculatePreviousPeriodDates, calculatePeriodAnalytics } = await import('@/helpers/installments.analytics.helper');
    const { start, end } = calculatePeriodDates(period, startDate);
    
    // Get current period data
    const currentQuery = supabase
      .from('installments')
      .select('*')
      .gte('due_date', start)
      .lte('due_date', end);

    const { data: currentData, error: currentError } = await withTenantFilter(currentQuery, context.tenantId);

    if (currentError) {
      return { success: false, error: currentError.message };
    }

    // Get previous period data for trend calculation
    const { start: prevStart, end: prevEnd } = calculatePreviousPeriodDates(period, start);
    
    const prevQuery = supabase
      .from('installments')
      .select('*')
      .gte('due_date', prevStart)
      .lte('due_date', prevEnd);

    const { data: prevData, error: prevError } = await withTenantFilter(prevQuery, context.tenantId);

    if (prevError) {
      return { success: false, error: prevError.message };
    }

    const analytics = calculatePeriodAnalytics(period, start, end, currentData, prevData);
    
    return { success: true, data: analytics };
  } catch (error) {
    console.error('Error in getPeriodAnalytics:', error);
    return { success: false, error: 'Failed to fetch period analytics' };
  }
}