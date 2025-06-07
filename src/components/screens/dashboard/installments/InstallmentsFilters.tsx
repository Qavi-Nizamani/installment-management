import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";
import { CalendarDays, Search, Filter, X } from "lucide-react";
import { useState } from "react";
import type { InstallmentFilters, InstallmentStatus } from "@/types/installments/installments.types";

interface InstallmentsFiltersProps {
  onFiltersChange: (filters: InstallmentFilters) => void;
  onSearchChange: (search: string) => void;
  filters: InstallmentFilters;
  searchTerm: string;
}

const STATUS_OPTIONS: { value: InstallmentStatus; label: string; color: string }[] = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PAID', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'OVERDUE', label: 'Overdue', color: 'bg-red-100 text-red-800' },
];

export function InstallmentsFilters({ 
  onFiltersChange, 
  onSearchChange, 
  filters, 
  searchTerm 
}: InstallmentsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<InstallmentFilters>(filters);

  const handleStatusToggle = (status: InstallmentStatus) => {
    const currentStatuses = localFilters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    const updatedFilters = { ...localFilters, status: newStatuses };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleDateRangeChange = (field: 'start_date' | 'end_date', value: string) => {
    const dateRange = localFilters.date_range || { start_date: '', end_date: '' };
    const newDateRange = { ...dateRange, [field]: value };
    
    const updatedFilters = { 
      ...localFilters, 
      date_range: newDateRange.start_date || newDateRange.end_date ? newDateRange : undefined 
    };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleQuickFilter = (filterType: 'overdue_only' | 'upcoming_only') => {
    const updatedFilters = { 
      ...localFilters, 
      [filterType]: !localFilters[filterType],
      // Clear the other quick filter
      [filterType === 'overdue_only' ? 'upcoming_only' : 'overdue_only']: false
    };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters: InstallmentFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onSearchChange('');
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    localFilters.status?.length ||
    localFilters.date_range ||
    localFilters.overdue_only ||
    localFilters.upcoming_only
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Search */}
          <div>
            <Label htmlFor="search" className="text-sm font-medium">
              Search Customer or Plan
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search"
                placeholder="Search by customer name or plan title..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filters */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Status
            </Label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={localFilters.status?.includes(option.value) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    localFilters.status?.includes(option.value) ? option.color : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleStatusToggle(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label className="text-sm font-medium mb-3 block flex items-center">
              <CalendarDays className="w-4 h-4 mr-2" />
              Due Date Range
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start-date" className="text-xs text-gray-500">
                  From
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={localFilters.date_range?.start_date || ''}
                  onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date" className="text-xs text-gray-500">
                  To
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={localFilters.date_range?.end_date || ''}
                  onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <Label className="text-sm font-medium mb-3 block flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Quick Filters
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={localFilters.overdue_only ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilter('overdue_only')}
                className={localFilters.overdue_only ? "bg-red-100 text-red-800 border-red-200" : ""}
              >
                Overdue Only
              </Button>
              <Button
                variant={localFilters.upcoming_only ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilter('upcoming_only')}
                className={localFilters.upcoming_only ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
              >
                Due Soon (7 days)
              </Button>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-500">
                                 {searchTerm && <span>Search: &quot;{searchTerm}&quot; </span>}
                {localFilters.status?.length && <span>{localFilters.status.length} status filter(s) </span>}
                {localFilters.date_range && <span>Date range </span>}
                {localFilters.overdue_only && <span>Overdue only </span>}
                {localFilters.upcoming_only && <span>Due soon </span>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 