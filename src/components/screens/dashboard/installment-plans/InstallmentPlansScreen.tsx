"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { InstallmentPlansStats } from "./InstallmentPlansStats";
import { InstallmentPlansList } from "./InstallmentPlansList";
import { CreatePlanModal } from "./CreatePlanModal";
import { getInstallmentPlans, searchInstallmentPlans } from "@/services/installment-plans/installmentPlans.service";
import type { InstallmentPlan } from "@/types/installment-plans";

export function InstallmentPlansScreen() {
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await getInstallmentPlans();
      
      if (response.success && response.data) {
        setPlans(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to load installment plans');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchValue: string) => {
    try {
      setLoading(true);
      const response = await searchInstallmentPlans(searchValue);
      
      if (response.success && response.data) {
        setPlans(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to search installment plans');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error searching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handlePlanCreated = () => {
    loadPlans(); // Refresh the list
    setIsCreateModalOpen(false);
  };

  const handlePlanUpdated = () => {
    loadPlans(); // Refresh the list
  };

  const handlePlanDeleted = () => {
    loadPlans(); // Refresh the list
  };

  useEffect(() => {
    loadPlans();
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Installment Plans</h1>
            <p className="text-gray-600 mt-2">
              Manage and track all customer installment plans and payment schedules
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Plan
          </Button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Plans</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadPlans} 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Installment Plans</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all customer installment plans and payment schedules
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <InstallmentPlansStats plans={plans} />

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search plans or customers..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline">
          Filter
        </Button>
      </div>

      {/* Plans List */}
      <InstallmentPlansList 
        plans={plans}
        loading={loading}
        onPlanUpdated={handlePlanUpdated}
        onPlanDeleted={handlePlanDeleted}
        onPlanEdit={(plan) => {
          // TODO: Open edit modal with plan data
          console.log('Edit plan:', plan);
        }}
        onPlanView={(plan) => {
          // TODO: Navigate to plan details page or open view modal
          console.log('View plan:', plan);
        }}
      />

      {/* Create Plan Modal */}
      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPlanCreated={handlePlanCreated}
      />
    </div>
  );
} 