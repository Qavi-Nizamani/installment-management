"use server";

import { createClient } from "@/supabase/database/server";
import { withTenantFilter } from "@/guards/tenant.guard";
import type {
  ServiceResponse,
  InstallmentPlanStats,
  RevenueAnalytics,
  PaymentAnalytics,
  CustomerAnalytics,
  InstallmentRecord,
} from "./installmentPlans.types";

const requireTenantId = (tenantId?: string): string => {
  if (!tenantId) {
    throw new Error("Tenant context required");
  }
  return tenantId;
};

// Interface for plan data with installments used in analytics
interface PlanWithInstallments {
  id: string;
  finance_amount: number;
  total_price: number;
  upfront_paid: number;
  monthly_percentage: number;
  total_months: number;
  created_at: string;
  installments?: InstallmentRecord[];
}

/**
 * Get comprehensive installment plans statistics
 */
export async function getInstallmentPlanStats(
  tenantId?: string
): Promise<ServiceResponse<InstallmentPlanStats>> {
  try {
    const resolvedTenantId = requireTenantId(tenantId);

    const supabase = await createClient();

    // Get all installment plans with installments
    const query = supabase.from("installment_plans").select(`
        *,
        installments(*)
      `);

    const { data: plans, error } = await withTenantFilter(
      query,
      resolvedTenantId
    );

    if (error) {
      console.error("Error fetching installment plan stats:", error);
      return {
        success: false,
        error: "Failed to fetch installment plan statistics.",
      };
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let totalPlans = 0;
    let activePlans = 0;
    let completedPlans = 0;
    let overduePlans = 0;
    let totalFinanceAmount = 0;
    let totalRevenue = 0;
    let totalOutstanding = 0;
    let totalMonthlyPayments = 0;
    let newPlansThisMonth = 0;

    (plans || []).forEach((plan: PlanWithInstallments) => {
      totalPlans++;
      totalFinanceAmount += plan.finance_amount;

      // Check if plan was created this month
      const planCreatedDate = new Date(plan.created_at);
      if (
        planCreatedDate.getMonth() === currentMonth &&
        planCreatedDate.getFullYear() === currentYear
      ) {
        newPlansThisMonth++;
      }

      // Calculate plan metrics
      const paidInstallments =
        plan.installments?.filter((i: InstallmentRecord) => i.status === "PAID") || [];
      const overdueInstallments =
        plan.installments?.filter(
          (i: InstallmentRecord) =>
            i.status === "OVERDUE" ||
            (i.status === "PENDING" && new Date(i.due_date) < currentDate)
        ) || [];

      const monthsPaid = paidInstallments.length;
      const installmentRevenue = paidInstallments.reduce(
        (sum: number, i: InstallmentRecord) => sum + i.amount_paid,
        0
      );
      const planRevenue = plan.upfront_paid + installmentRevenue;

      totalRevenue += planRevenue;
      totalOutstanding += plan.total_price - planRevenue;

      // Calculate monthly payment for averaging using compound interest formula
      if (plan.total_months > 0) {
        const futureValue =
          plan.monthly_percentage === 0
            ? plan.finance_amount
            : plan.finance_amount *
              Math.pow(1 + plan.monthly_percentage / 100, plan.total_months);
        const monthlyAmount = futureValue / plan.total_months;
        totalMonthlyPayments += monthlyAmount;
      }

      // Determine plan status
      if (monthsPaid >= plan.total_months) {
        completedPlans++;
      } else if (overdueInstallments.length > 0) {
        overduePlans++;
      } else {
        activePlans++;
      }
    });

    const averageMonthlyPayment =
      totalPlans > 0 ? totalMonthlyPayments / totalPlans : 0;
    const completionRate =
      totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0;

    const stats: InstallmentPlanStats = {
      totalPlans,
      activePlans,
      completedPlans,
      overduePlans,
      totalFinanceAmount,
      totalRevenue,
      totalOutstanding,
      averageMonthlyPayment,
      newPlansThisMonth,
      completionRate,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Error in getInstallmentPlanStats:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Get revenue analytics
 */
export async function getRevenueAnalytics(
  tenantId?: string
): Promise<ServiceResponse<RevenueAnalytics>> {
  try {
    const resolvedTenantId = requireTenantId(tenantId);

    const supabase = await createClient();

    // Get installment plans with payments
    const plansQuery = supabase.from("installment_plans").select("*");

    const { data: plans, error: plansError } = await withTenantFilter(
      plansQuery,
      resolvedTenantId
    );

    // Get all installments for revenue tracking
    const installmentsQuery = supabase
      .from("installments")
      .select("*")
      .eq("status", "PAID");

    const { data: paidInstallments, error: installmentsError } =
      await withTenantFilter(installmentsQuery, resolvedTenantId);

    if (plansError || installmentsError) {
      console.error(
        "Error fetching revenue analytics:",
        plansError || installmentsError
      );
      return {
        success: false,
        error: "Failed to fetch revenue analytics.",
      };
    }

    // Calculate revenue metrics
    const upfrontRevenue = (plans || []).reduce(
      (sum: number, plan: PlanWithInstallments) => sum + (plan.upfront_paid || 0),
      0
    );
    const installmentRevenue = (paidInstallments || []).reduce(
      (sum: number, installment: InstallmentRecord) => sum + installment.amount_paid,
      0
    );
    const totalRevenue = upfrontRevenue + installmentRevenue;

    // Calculate projected revenue from remaining installments
    const projectedRevenue = (plans || []).reduce((sum: number, plan: PlanWithInstallments) => {
      const remainingAmount = plan.total_price - (plan.upfront_paid || 0);
      return sum + remainingAmount;
    }, 0);

    // Generate monthly revenue trends (last 12 months)
    const monthlyRevenue = [];
    const currentDate = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthKey = monthDate.toISOString().slice(0, 7); // YYYY-MM format

      const monthRevenue = (paidInstallments || [])
        .filter((installment: InstallmentRecord) => installment.paid_on?.startsWith(monthKey))
        .reduce(
          (sum: number, installment: InstallmentRecord) => sum + installment.amount_paid,
          0
        );

      monthlyRevenue.push({
        month: monthDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue: monthRevenue,
      });
    }

    const analytics: RevenueAnalytics = {
      totalRevenue,
      monthlyRevenue,
      upfrontRevenue,
      installmentRevenue,
      projectedRevenue,
    };

    return {
      success: true,
      data: analytics,
    };
  } catch (error) {
    console.error("Error in getRevenueAnalytics:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Get payment analytics
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getPaymentAnalytics(
  tenantId?: string
): Promise<ServiceResponse<PaymentAnalytics>> {
  try {
    const resolvedTenantId = requireTenantId(tenantId);

    const supabase = await createClient();

    const query = supabase.from("installments").select("*");

    const { data: installments, error } = await withTenantFilter(
      query,
      resolvedTenantId
    );

    if (error) {
      console.error("Error fetching payment analytics:", error);
      return {
        success: false,
        error: "Failed to fetch payment analytics.",
      };
    }

    let onTimePayments = 0;
    let latePayments = 0;
    let totalPaymentDelay = 0;
    const totalPayments = (installments || []).filter(
      (i: any) => i.status === "PAID"
    ).length;

    (installments || []).forEach((installment: any) => {
      if (
        installment.status === "PAID" &&
        installment.paid_on &&
        installment.due_date
      ) {
        const dueDate = new Date(installment.due_date);
        const paidDate = new Date(installment.paid_on);
        const delayDays = Math.max(
          0,
          Math.floor(
            (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        if (delayDays === 0) {
          onTimePayments++;
        } else {
          latePayments++;
          totalPaymentDelay += delayDays;
        }
      }
    });

    const averagePaymentDelay =
      latePayments > 0 ? totalPaymentDelay / latePayments : 0;

    // Generate payment trends (last 12 months)
    const paymentTrends = [];
    const currentDate = new Date();

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthKey = monthDate.toISOString().slice(0, 7); // YYYY-MM format

      const monthInstallments = (installments || []).filter(
        (installment: any) => installment.paid_on?.startsWith(monthKey)
      );

      const monthOnTime = monthInstallments.filter((i: any) => {
        const dueDate = new Date(i.due_date);
        const paidDate = new Date(i.paid_on);
        return paidDate <= dueDate;
      }).length;

      const monthLate = monthInstallments.length - monthOnTime;

      paymentTrends.push({
        month: monthDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        onTime: monthOnTime,
        late: monthLate,
      });
    }

    const analytics: PaymentAnalytics = {
      onTimePayments,
      latePayments,
      totalPayments,
      averagePaymentDelay,
      paymentTrends,
    };

    return {
      success: true,
      data: analytics,
    };
  } catch (error) {
    console.error("Error in getPaymentAnalytics:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Get customer analytics
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getCustomerAnalytics(
  tenantId?: string
): Promise<ServiceResponse<CustomerAnalytics>> {
  try {
    const resolvedTenantId = requireTenantId(tenantId);

    const supabase = await createClient();

    const query = supabase.from("installment_plans").select(`
        *,
        customer:customers(id, name),
        installments(*)
      `);

    const { data: plans, error } = await withTenantFilter(
      query,
      resolvedTenantId
    );

    if (error) {
      console.error("Error fetching customer analytics:", error);
      return {
        success: false,
        error: "Failed to fetch customer analytics.",
      };
    }

    const customerMap = new Map();

    (plans || []).forEach((plan: any) => {
      const customerId = plan.customer_id;
      const customerName = plan.customer?.name || "Unknown";

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName,
          totalRevenue: 0,
          activePlans: 0,
          planCount: 0,
        });
      }

      const customer = customerMap.get(customerId);
      customer.planCount++;

      // Calculate revenue for this plan
      const paidInstallments =
        plan.installments?.filter((i: any) => i.status === "PAID") || [];
      const installmentRevenue = paidInstallments.reduce(
        (sum: number, i: any) => sum + i.amount_paid,
        0
      );
      const planRevenue = plan.upfront_paid + installmentRevenue;

      customer.totalRevenue += planRevenue;

      // Count active plans
      const completedInstallments = paidInstallments.length;
      if (completedInstallments < plan.total_months) {
        customer.activePlans++;
      }
    });

    const customers = Array.from(customerMap.values());
    const customersWithPlans = customers.length;
    const totalPlans = (plans || []).length;
    const averagePlansPerCustomer =
      customersWithPlans > 0 ? totalPlans / customersWithPlans : 0;

    // Get top customers by revenue
    const topCustomersByRevenue = customers
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const analytics: CustomerAnalytics = {
      customersWithPlans,
      averagePlansPerCustomer,
      topCustomersByRevenue,
    };

    return {
      success: true,
      data: analytics,
    };
  } catch (error) {
    console.error("Error in getCustomerAnalytics:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
