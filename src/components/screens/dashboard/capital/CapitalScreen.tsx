"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCapitalStore } from "@/store/capital.store";
import CapitalStatsCards from "./CapitalStatsCards";
import CapitalList from "./CapitalList";
import AddCapitalEntryModal from "./AddCapitalEntryModal";

export default function CapitalScreen() {
  const {
    entries,
    stats,
    isLoading,
    fetchEntries,
    fetchStats,
  } = useCapitalStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchEntries();
    fetchStats();
  }, [fetchEntries, fetchStats]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Capital</h1>
          <p className="text-gray-600 mt-2">
            Track investments, withdrawals, and adjustments to your business
            capital
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Stats Cards */}
      <CapitalStatsCards stats={stats} isLoading={isLoading} />

      {/* Ledger List */}
      <CapitalList entries={entries} isLoading={isLoading} />

      {/* Add Entry Modal */}
      <AddCapitalEntryModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
    </div>
  );
}
