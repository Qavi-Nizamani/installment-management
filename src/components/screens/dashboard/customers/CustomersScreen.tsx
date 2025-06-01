"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus, 
  Search, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { useCustomersStore } from "@/store/customers.store";
import CustomerStatsCards from "./CustomerStatsCards";
import CustomerList from "./CustomerList";

export default function CustomersScreen() {
  const {
    customers,
    stats,
    isLoading,
    isSearching,
    error,
    searchTerm,
    fetchCustomers,
    fetchCustomerStats,
    searchCustomersAction,
    setSearchTerm,
    clearError
  } = useCustomersStore();

  const [localSearchTerm, setLocalSearchTerm] = useState("");

  useEffect(() => {
    // Fetch customers and stats on component mount
    fetchCustomers();
    fetchCustomerStats();
  }, [fetchCustomers, fetchCustomerStats]);

  const handleSearch = async (value: string) => {
    setLocalSearchTerm(value);
    setSearchTerm(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchCustomersAction(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">
            Manage your customer base and track their installment plans
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="outline" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <CustomerStatsCards 
        customers={customers}
        stats={stats}
        isLoading={isLoading}
      />

      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search customers..." 
            className="pl-10" 
            value={localSearchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={isSearching}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
          )}
        </div>
      </div>

      {/* Customer List */}
      <CustomerList 
        customers={customers}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />
    </div>
  );
} 