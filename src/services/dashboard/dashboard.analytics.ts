"use server";

import { createClient } from "@/supabase/database/server";
import { withTenantFilter } from "@/guards/tenant.guard";
import type {
  ServiceResponse,
  DashboardCardsData,
  PlanWithInstallments,
} from "./dashboard.types";
import type { InstallmentRecord } from "../installment-plans/installmentPlans.types";

/**
 * Calculate Future Value using trade profit formula
 */
function calculateFutureValue(
  financeAmount: number,
  monthlyPercentage: number,
  totalMonths: number
): number {
  if (monthlyPercentage === 0) {
    return financeAmount; // No profit
  }
  // Trade Profit: Total Profit = Principal × Profit Rate × Time
  const totalProfit = financeAmount * (monthlyPercentage / 100) * totalMonths;
  return financeAmount + totalProfit;
}

/**
 * Calculate revenue for a plan based on business model
 */
function calculatePlanRevenue(
  plan: PlanWithInstallments,
  paidInstallments: InstallmentRecord[]
): number {
  const monthsPaid = paidInstallments.length;
  const installmentRevenue = paidInstallments.reduce(
    (sum, i) => sum + i.amount_paid,
    0
  );
  const totalPaid = plan.upfront_paid + installmentRevenue;

  // Calculate total profit
  const totalProfit =
    calculateFutureValue(
      plan.finance_amount,
      plan.monthly_percentage,
      plan.total_months
    ) - plan.finance_amount;

  if (plan.business_model === "PRODUCT_OWNER") {
    // Product owner gets: upfront payment + all installment payments
    return totalPaid;
  } else {
    // Financer only gets: profit portion of paid installments
    const profitPerInstallment = totalProfit / plan.total_months;
    return monthsPaid * profitPerInstallment;
  }
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Get all dashboard cards data in a single function
 */
export async function getDashboardCardsData(
  tenantId?: string
): Promise<ServiceResponse<DashboardCardsData>> {
  try {
    if (!tenantId) {
      throw new Error("Tenant context required");
    }
    const supabase = await createClient();

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Calculate last month for comparison
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    // Get all installment plans with installments
    const plansQuery = supabase.from("installment_plans").select(`
        *,
        installments(*)
      `);

    const { data: plans, error: plansError } = await withTenantFilter(
      plansQuery,
      tenantId
    );

    if (plansError) {
      console.error("Error fetching plans:", plansError);
      return {
        success: false,
        error: "Failed to fetch installment plans.",
      };
    }

    // Get all installments for calculations
    const installmentsQuery = supabase.from("installments").select("*");

    const { data: allInstallments, error: installmentsError } =
      await withTenantFilter(installmentsQuery, tenantId);

    if (installmentsError) {
      console.error("Error fetching installments:", installmentsError);
      return {
        success: false,
        error: "Failed to fetch installments.",
      };
    }

    const plansData = (plans || []) as PlanWithInstallments[];
    const installmentsData = (allInstallments || []) as InstallmentRecord[];

    // ==================== CURRENT MONTH CALCULATIONS ====================

    let totalRevenue = 0;
    let activePlans = 0;
    let pendingPayments = 0;
    let monthlyProfit = 0;
    let overdueAmount = 0;
    const activeCustomerIds = new Set<string>();

    plansData.forEach((plan) => {
      const paidInstallments =
        plan.installments?.filter((i) => i.status === "PAID") || [];
      const pendingInstallments =
        plan.installments?.filter((i) => i.status === "PENDING") || [];
      const overdueInstallments =
        plan.installments?.filter(
          (i) =>
            i.status === "OVERDUE" ||
            (i.status === "PENDING" &&
              new Date(i.due_date) < currentDate)
        ) || [];

      // Calculate revenue for this plan
      const planRevenue = calculatePlanRevenue(plan, paidInstallments);
      totalRevenue += planRevenue;

      // Count active plans (not completed)
      const monthsPaid = paidInstallments.length;
      if (monthsPaid < plan.total_months) {
        activePlans++;
        activeCustomerIds.add(plan.customer_id);
      }

      // Calculate pending payments
      pendingPayments += pendingInstallments.reduce(
        (sum, i) => sum + i.amount_due,
        0
      );

      // Calculate overdue amount (amount still owed: amount_due - amount_paid)
      overdueAmount += overdueInstallments.reduce(
        (sum, i) => sum + (i.amount_due - (i.amount_paid ?? 0)),
        0
      );

      // Calculate monthly profit (profit from installments paid this month)
      const currentMonthPaidInstallments = paidInstallments.filter((i) => {
        if (!i.paid_on) return false;
        const paidDate = new Date(i.paid_on);
        return (
          paidDate.getMonth() === currentMonth &&
          paidDate.getFullYear() === currentYear
        );
      });

      if (currentMonthPaidInstallments.length > 0) {
        const totalProfit =
          calculateFutureValue(
            plan.finance_amount,
            plan.monthly_percentage,
            plan.total_months
          ) - plan.finance_amount;
        const profitPerInstallment = totalProfit / plan.total_months;

        if (plan.business_model === "PRODUCT_OWNER") {
          // Product owner: profit is the difference between amount paid and finance amount portion
          // For simplicity, we'll use the profit portion
          monthlyProfit +=
            currentMonthPaidInstallments.length * profitPerInstallment;
        } else {
          // Financer: gets profit portion
          monthlyProfit +=
            currentMonthPaidInstallments.length * profitPerInstallment;
        }
      }
    });

    const activeCustomers = activeCustomerIds.size;

    // ==================== LAST MONTH CALCULATIONS (for comparison) ====================

    let lastMonthTotalRevenue = 0;
    let lastMonthActiveCustomers = 0;
    let lastMonthActivePlans = 0;
    let lastMonthPendingPayments = 0;
    let lastMonthMonthlyProfit = 0;
    let lastMonthOverdueAmount = 0;
    const lastMonthActiveCustomerIds = new Set<string>();

    plansData.forEach((plan) => {
      // Get installments paid in last month
      const lastMonthPaidInstallments =
        plan.installments?.filter((i) => {
          if (!i.paid_on) return false;
          const paidDate = new Date(i.paid_on);
          return (
            paidDate.getMonth() === lastMonth &&
            paidDate.getFullYear() === lastMonthYear
          );
        }) || [];

      // Calculate what the revenue would have been at the end of last month
      // (all installments paid before or during last month)
      const installmentsPaidBeforeLastMonth =
        plan.installments?.filter((i) => {
          if (!i.paid_on) return false;
          const paidDate = new Date(i.paid_on);
          return (
            paidDate.getMonth() < lastMonth ||
            (paidDate.getMonth() === lastMonth &&
              paidDate.getFullYear() < lastMonthYear)
          );
        }) || [];

      const allPaidUntilLastMonth = [
        ...installmentsPaidBeforeLastMonth,
        ...lastMonthPaidInstallments,
      ];

      const lastMonthPlanRevenue = calculatePlanRevenue(
        plan,
        allPaidUntilLastMonth
      );
      lastMonthTotalRevenue += lastMonthPlanRevenue;

      // Count active plans at end of last month
      const lastMonthMonthsPaid = allPaidUntilLastMonth.length;
      if (lastMonthMonthsPaid < plan.total_months) {
        lastMonthActivePlans++;
        lastMonthActiveCustomerIds.add(plan.customer_id);
      }

      // Calculate last month's monthly profit
      if (lastMonthPaidInstallments.length > 0) {
        const totalProfit =
          calculateFutureValue(
            plan.finance_amount,
            plan.monthly_percentage,
            plan.total_months
          ) - plan.finance_amount;
        const profitPerInstallment = totalProfit / plan.total_months;

        if (plan.business_model === "PRODUCT_OWNER") {
          lastMonthMonthlyProfit +=
            lastMonthPaidInstallments.length * profitPerInstallment;
        } else {
          lastMonthMonthlyProfit +=
            lastMonthPaidInstallments.length * profitPerInstallment;
        }
      }
    });

    // Calculate last month's pending and overdue amounts
    // We need to check what installments were pending/overdue at the end of last month
    const lastMonthEndDate = new Date(lastMonthYear, lastMonth + 1, 0); // Last day of last month

    installmentsData.forEach((installment) => {
      const dueDate = new Date(installment.due_date);

      // Pending installments that were due by end of last month but not paid
      if (
        installment.status === "PENDING" &&
        dueDate <= lastMonthEndDate &&
        (!installment.paid_on ||
          new Date(installment.paid_on) > lastMonthEndDate)
      ) {
        lastMonthPendingPayments += installment.amount_due;
      }

      // Overdue installments at end of last month (amount still owed: amount_due - amount_paid)
      if (
        (installment.status === "OVERDUE" ||
          (installment.status === "PENDING" && dueDate < lastMonthEndDate)) &&
        (!installment.paid_on ||
          new Date(installment.paid_on) > lastMonthEndDate)
      ) {
        lastMonthOverdueAmount += installment.amount_due - (installment.amount_paid ?? 0);
      }
    });

    lastMonthActiveCustomers = lastMonthActiveCustomerIds.size;

    // ==================== CALCULATE PERCENTAGE CHANGES ====================

    const totalRevenueChange = calculatePercentageChange(
      totalRevenue,
      lastMonthTotalRevenue
    );
    const activeCustomersChange = calculatePercentageChange(
      activeCustomers,
      lastMonthActiveCustomers
    );
    const activePlansChange = calculatePercentageChange(
      activePlans,
      lastMonthActivePlans
    );
    const pendingPaymentsChange = calculatePercentageChange(
      pendingPayments,
      lastMonthPendingPayments
    );
    const monthlyProfitChange = calculatePercentageChange(
      monthlyProfit,
      lastMonthMonthlyProfit
    );
    const overdueAmountChange = calculatePercentageChange(
      overdueAmount,
      lastMonthOverdueAmount
    );

    const cardsData: DashboardCardsData = {
      totalRevenue,
      activeCustomers,
      activePlans,
      pendingPayments,
      monthlyProfit,
      overdueAmount,
      totalRevenueChange,
      activeCustomersChange,
      activePlansChange,
      pendingPaymentsChange,
      monthlyProfitChange,
      overdueAmountChange,
    };

    return {
      success: true,
      data: cardsData,
    };
  } catch (error) {
    console.error("Error in getDashboardCardsData:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
