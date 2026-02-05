"use client";

import { useEffect, useState, useCallback } from "react";
import { InstallmentsList } from "./InstallmentsList";
import { InstallmentsStats } from "./InstallmentsStats";
import { InstallmentsFilters } from "./InstallmentsFilters";
import { getInstallments } from "@/services/installments/installments.service";
import type {
  Installment,
  InstallmentStats,
  InstallmentFilters,
  InstallmentSearchParams,
} from "@/types/installments/installments.types";
import { getInstallmentStats } from "@/services/installments/installments.analytics";
import { useUserStore } from "@/store/user.store";

export function InstallmentsScreen() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [stats, setStats] = useState<InstallmentStats>({
    totalInstallments: 0,
    pendingInstallments: 0,
    paidInstallments: 0,
    overdueInstallments: 0,
    upcomingInstallments: 0,
    totalAmountDue: 0,
    totalAmountPaid: 0,
    totalRemainingDue: 0,
    averagePaymentDelay: 0,
    collectionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const tenantId = useUserStore((state) => state.tenant?.id);
  
  // Default to showing installments due in the current month
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [filters, setFilters] = useState<InstallmentFilters>({
    date_range: {
      start_date: monthStart.toISOString().split('T')[0],
      end_date: monthEnd.toISOString().split('T')[0],
    },
    status: ["PENDING", "OVERDUE"],
  });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInstallments = useCallback(async () => {
    try {
      setLoading(true);
      const searchParams: InstallmentSearchParams = {
        search_term: searchTerm || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        sort_by: "due_date",
        sort_order: "asc",
      };

      if (!tenantId) {
        setInstallments([]);
        return;
      }
      const response = await getInstallments(searchParams, tenantId);
      if (response.success && response.data) {
        setInstallments(response.data);
      } else {
        console.error("Failed to fetch installments:", response.error);
        setInstallments([]);
      }
    } catch (error) {
      console.error("Error fetching installments:", error);
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, tenantId]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      if (!tenantId) {
        return;
      }
      const response = await getInstallmentStats(tenantId);
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        console.error("Failed to fetch stats:", response.error);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [tenantId]);

  // Initial data load
  useEffect(() => {
    fetchInstallments();
    fetchStats();
  }, [fetchInstallments, fetchStats]);

  // Refetch when filters or search term change (handled by fetchInstallments dependencies)
  // The previous useEffect above will automatically trigger when fetchInstallments changes

  const handleFiltersChange = (newFilters: InstallmentFilters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };

  const handleInstallmentUpdated = () => {
    fetchInstallments();
    fetchStats(); // Refresh stats when installments are updated
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Installments</h1>
        <p className="text-gray-600 mt-2">
          Track due, paid, and overdue installments across all plans.
        </p>
      </div>

      {/* Stats Cards */}
      <InstallmentsStats stats={stats} loading={statsLoading} />

      {/* Filters */}
      <InstallmentsFilters
        onFiltersChange={handleFiltersChange}
        onSearchChange={handleSearchChange}
        filters={filters}
        searchTerm={searchTerm}
      />

      {/* Installments List */}
      <InstallmentsList
        installments={installments}
        loading={loading}
        onInstallmentUpdated={handleInstallmentUpdated}
      />
    </div>
  );
}
