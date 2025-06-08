import type { 
  InstallmentRecord,
  InstallmentStats
} from '@/types/installments/installments.types';

// Import analytics types from the analytics service
export interface PaymentAnalytics {
  onTimePayments: number;
  latePayments: number;
  averageDelayDays: number;
  paymentTrends: MonthlyPaymentTrend[];
}

export interface MonthlyPaymentTrend {
  month: string;
  year: number;
  totalPayments: number;
  totalAmount: number;
  onTimeCount: number;
  lateCount: number;
  averageDelay: number;
}

export interface CollectionAnalytics {
  collectionRate: number;
  totalCollectable: number;
  totalCollected: number;
  projectedCollection: number;
  riskAnalysis: RiskAnalysis;
}

export interface RiskAnalysis {
  highRiskInstallments: number;
  mediumRiskInstallments: number;
  lowRiskInstallments: number;
  totalAtRisk: number;
}

export interface PeriodAnalytics {
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  stats: InstallmentStats;
  trends: {
    paidTrend: number;
    overdueTrend: number;
    collectionTrend: number;
  };
}

// ==================== ANALYTICS CALCULATION HELPERS ====================

/**
 * Calculate detailed payment analytics from paid installments
 * @param paidInstallments - Array of paid installment records
 * @returns Payment analytics with trends
 */
export function calculatePaymentAnalytics(paidInstallments: InstallmentRecord[]): PaymentAnalytics {
  let onTimePayments = 0;
  let latePayments = 0;
  let totalDelay = 0;

  const monthlyTrends: { [key: string]: MonthlyPaymentTrend } = {};

  paidInstallments.forEach(installment => {
    const dueDate = new Date(installment.due_date);
    const paidDate = new Date(installment.paid_date!);
    const delayDays = Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (delayDays <= 0) {
      onTimePayments++;
    } else {
      latePayments++;
      totalDelay += delayDays;
    }

    // Group by month for trends
    const monthKey = `${paidDate.getFullYear()}-${paidDate.getMonth() + 1}`;
    if (!monthlyTrends[monthKey]) {
      monthlyTrends[monthKey] = {
        month: paidDate.toLocaleDateString('en-US', { month: 'short' }),
        year: paidDate.getFullYear(),
        totalPayments: 0,
        totalAmount: 0,
        onTimeCount: 0,
        lateCount: 0,
        averageDelay: 0
      };
    }

    const trend = monthlyTrends[monthKey];
    trend.totalPayments++;
    trend.totalAmount += installment.amount_paid;
    
    if (delayDays <= 0) {
      trend.onTimeCount++;
    } else {
      trend.lateCount++;
    }
  });

  // Calculate average delay for each month
  Object.values(monthlyTrends).forEach(trend => {
    if (trend.lateCount > 0) {
      const monthLateInstallments = paidInstallments.filter(inst => {
        const paidDate = new Date(inst.paid_date!);
        return paidDate.getFullYear() === trend.year && 
               paidDate.getMonth() + 1 === new Date(`${trend.year}-${trend.month}-01`).getMonth() + 1;
      });
      
      const monthTotalDelay = monthLateInstallments.reduce((sum, inst) => {
        const delayDays = Math.max(0, Math.floor((new Date(inst.paid_date!).getTime() - new Date(inst.due_date).getTime()) / (1000 * 60 * 60 * 24)));
        return sum + delayDays;
      }, 0);
      
      trend.averageDelay = Math.round(monthTotalDelay / trend.lateCount);
    }
  });

  return {
    onTimePayments,
    latePayments,
    averageDelayDays: latePayments > 0 ? Math.round(totalDelay / latePayments) : 0,
    paymentTrends: Object.values(monthlyTrends).sort((a, b) => 
      new Date(`${a.year}-${a.month}-01`).getTime() - new Date(`${b.year}-${b.month}-01`).getTime()
    )
  };
}

/**
 * Calculate collection analytics and risk assessment
 * @param installments - Array of installment records
 * @returns Collection analytics with risk analysis
 */
export function calculateCollectionAnalytics(installments: InstallmentRecord[]): CollectionAnalytics {
  const totalCollectable = installments.reduce((sum, inst) => sum + inst.amount_due, 0);
  const totalCollected = installments.reduce((sum, inst) => sum + inst.amount_paid, 0);
  const collectionRate = totalCollectable > 0 ? (totalCollected / totalCollectable) * 100 : 0;

  // Risk analysis based on days overdue and status
  const now = new Date();
  let highRisk = 0, mediumRisk = 0, lowRisk = 0;

  installments.forEach(inst => {
    if (inst.status === 'PAID') return; // No risk for paid installments
    
    const dueDate = new Date(inst.due_date);
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysOverdue > 30) {
      highRisk++;
    } else if (daysOverdue > 7) {
      mediumRisk++;
    } else {
      lowRisk++;
    }
  });

  // Project collection based on historical rate
  const remainingDue = totalCollectable - totalCollected;
  const projectedCollection = remainingDue * (collectionRate / 100);

  return {
    collectionRate: Math.round(collectionRate * 100) / 100,
    totalCollectable,
    totalCollected,
    projectedCollection: Math.round(projectedCollection),
    riskAnalysis: {
      highRiskInstallments: highRisk,
      mediumRiskInstallments: mediumRisk,
      lowRiskInstallments: lowRisk,
      totalAtRisk: highRisk + mediumRisk
    }
  };
}

/**
 * Calculate period analytics with trends
 * @param period - Time period type
 * @param start - Start date string
 * @param end - End date string
 * @param currentData - Current period installment data
 * @param prevData - Previous period installment data
 * @returns Period analytics with trend comparisons
 */
export function calculatePeriodAnalytics(
  period: 'week' | 'month' | 'quarter' | 'year',
  start: string,
  end: string,
  currentData: InstallmentRecord[],
  prevData: InstallmentRecord[]
): PeriodAnalytics {
  // Calculate current period stats
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const currentStats: InstallmentStats = {
    totalInstallments: currentData.length,
    pendingInstallments: currentData.filter(i => i.status === 'PENDING').length,
    paidInstallments: currentData.filter(i => i.status === 'PAID').length,
    overdueInstallments: currentData.filter(i => i.status === 'OVERDUE').length,
    upcomingInstallments: currentData.filter(i => 
      i.status === 'PENDING' && 
      new Date(i.due_date) >= now && 
      new Date(i.due_date) <= weekFromNow
    ).length,
    totalAmountDue: currentData.reduce((sum, i) => sum + i.amount_due, 0),
    totalAmountPaid: currentData.reduce((sum, i) => sum + i.amount_paid, 0),
    totalRemainingDue: currentData.reduce((sum, i) => sum + Math.max(0, i.amount_due - i.amount_paid), 0),
    averagePaymentDelay: 0, // Simplified for this calculation
    collectionRate: currentData.length > 0 ? 
      (currentData.filter(i => i.status === 'PAID').length / currentData.length) * 100 : 0
  };

  // Calculate previous period stats for trends
  const prevStats = {
    paidInstallments: prevData.filter(i => i.status === 'PAID').length,
    overdueInstallments: prevData.filter(i => i.status === 'OVERDUE').length,
    collectionRate: prevData.length > 0 ? 
      (prevData.filter(i => i.status === 'PAID').length / prevData.length) * 100 : 0
  };

  // Calculate trends (percentage change)
  const paidTrend = prevStats.paidInstallments > 0 ? 
    ((currentStats.paidInstallments - prevStats.paidInstallments) / prevStats.paidInstallments) * 100 : 0;
  
  const overdueTrend = prevStats.overdueInstallments > 0 ? 
    ((currentStats.overdueInstallments - prevStats.overdueInstallments) / prevStats.overdueInstallments) * 100 : 0;
  
  const collectionTrend = prevStats.collectionRate > 0 ? 
    ((currentStats.collectionRate - prevStats.collectionRate) / prevStats.collectionRate) * 100 : 0;

  return {
    period,
    startDate: start,
    endDate: end,
    stats: currentStats,
    trends: {
      paidTrend: Math.round(paidTrend * 100) / 100,
      overdueTrend: Math.round(overdueTrend * 100) / 100,
      collectionTrend: Math.round(collectionTrend * 100) / 100
    }
  };
}

// ==================== DATE CALCULATION HELPERS ====================

/**
 * Calculate date range for a given period
 * @param period - Time period type
 * @param startDate - Optional start date (defaults to current date)
 * @returns Start and end date strings
 */
export function calculatePeriodDates(
  period: 'week' | 'month' | 'quarter' | 'year', 
  startDate?: string
): { start: string; end: string } {
  const base = startDate ? new Date(startDate) : new Date();
  
  switch (period) {
    case 'week':
      const weekStart = new Date(base);
      weekStart.setDate(base.getDate() - base.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return {
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0]
      };
      
    case 'month':
      const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
      const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0);
      return {
        start: monthStart.toISOString().split('T')[0],
        end: monthEnd.toISOString().split('T')[0]
      };
      
    case 'quarter':
      const quarterMonth = Math.floor(base.getMonth() / 3) * 3;
      const quarterStart = new Date(base.getFullYear(), quarterMonth, 1);
      const quarterEnd = new Date(base.getFullYear(), quarterMonth + 3, 0);
      return {
        start: quarterStart.toISOString().split('T')[0],
        end: quarterEnd.toISOString().split('T')[0]
      };
      
    case 'year':
      const yearStart = new Date(base.getFullYear(), 0, 1);
      const yearEnd = new Date(base.getFullYear(), 11, 31);
      return {
        start: yearStart.toISOString().split('T')[0],
        end: yearEnd.toISOString().split('T')[0]
      };
      
    default:
      throw new Error(`Unsupported period: ${period}`);
  }
}

/**
 * Calculate previous period dates for trend comparison
 * @param period - Time period type
 * @param currentStart - Current period start date
 * @returns Previous period start and end date strings
 */
export function calculatePreviousPeriodDates(
  period: 'week' | 'month' | 'quarter' | 'year', 
  currentStart: string
): { start: string; end: string } {
  const current = new Date(currentStart);
  
  switch (period) {
    case 'week':
      const prevWeekStart = new Date(current);
      prevWeekStart.setDate(current.getDate() - 7);
      const prevWeekEnd = new Date(prevWeekStart);
      prevWeekEnd.setDate(prevWeekStart.getDate() + 6);
      return {
        start: prevWeekStart.toISOString().split('T')[0],
        end: prevWeekEnd.toISOString().split('T')[0]
      };
      
    case 'month':
      const prevMonthStart = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      const prevMonthEnd = new Date(current.getFullYear(), current.getMonth(), 0);
      return {
        start: prevMonthStart.toISOString().split('T')[0],
        end: prevMonthEnd.toISOString().split('T')[0]
      };
      
    case 'quarter':
      const prevQuarterStart = new Date(current.getFullYear(), current.getMonth() - 3, 1);
      const prevQuarterEnd = new Date(current.getFullYear(), current.getMonth(), 0);
      return {
        start: prevQuarterStart.toISOString().split('T')[0],
        end: prevQuarterEnd.toISOString().split('T')[0]
      };
      
    case 'year':
      const prevYearStart = new Date(current.getFullYear() - 1, 0, 1);
      const prevYearEnd = new Date(current.getFullYear() - 1, 11, 31);
      return {
        start: prevYearStart.toISOString().split('T')[0],
        end: prevYearEnd.toISOString().split('T')[0]
      };
      
    default:
      throw new Error(`Unsupported period: ${period}`);
  }
}

// ==================== PAYMENT DELAY HELPERS ====================

/**
 * Calculate average payment delay from paid installments
 * @param installments - Array of installment records
 * @returns Average payment delay in days
 */
export function calculateAveragePaymentDelay(installments: InstallmentRecord[]): number {
  const paidInstallments = installments.filter(i => 
    i.status === 'PAID' && i.paid_date
  );

  if (paidInstallments.length === 0) return 0;

  const totalDelay = paidInstallments.reduce((sum, installment) => {
    const dueDate = new Date(installment.due_date);
    const paidDate = new Date(installment.paid_date!);
    const delayDays = Math.max(0, Math.floor((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    return sum + delayDays;
  }, 0);

  return Math.round(totalDelay / paidInstallments.length);
} 