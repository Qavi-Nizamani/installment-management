'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { createInstallmentPlan } from '@/services/installment-plans/installmentPlans.service';
import { getCustomers, type Customer } from '@/services/customers/customers.service';
import { getCapitalStats } from '@/services/capital/capital.service';
import type { CreateInstallmentPlanPayload } from '@/types/installment-plans';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: () => void;
}

interface FormData {
  customer_id: string;
  title: string;
  total_price: string;
  upfront_paid: string;
  finance_amount: string;
  monthly_percentage: string;
  total_months: string;
  start_date: string;
  business_model: 'PRODUCT_OWNER' | 'FINANCER_ONLY';
  notes: string;
}

export function CreatePlanModal({ isOpen, onClose, onPlanCreated }: CreatePlanModalProps) {
  const [formData, setFormData] = useState<FormData>({
    customer_id: "",
    title: "",
    total_price: "",
    upfront_paid: "",
    finance_amount: "",
    monthly_percentage: "",
    total_months: "",
    start_date: "",
    business_model: 'FINANCER_ONLY',
    notes: "",
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableFunds, setAvailableFunds] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load customers and available funds when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      getCapitalStats().then((response) => {
        if (response.success && response.data) {
          setAvailableFunds(response.data.availableFunds);
        } else {
          setAvailableFunds(null);
        }
      });
    }
  }, [isOpen]);

  // Calculate finance amount and preview amounts when form data changes
  useEffect(() => {
    const total = parseFloat(formData.total_price) || 0;
    const upfront = parseFloat(formData.upfront_paid) || 0;
    const finance = Math.max(0, total - upfront);

    setFormData(prev => ({
      ...prev,
      finance_amount: finance.toString()
    }));
  }, [formData.total_price, formData.upfront_paid]);

  // Calculate preview amounts using trade profit formula
  const getPreviewAmounts = () => {
    const financeAmount = parseFloat(formData.finance_amount) || 0;
    const monthlyPercentage = parseFloat(formData.monthly_percentage) || 0;
    const totalMonths = parseInt(formData.total_months) || 1;

    if (financeAmount <= 0 || totalMonths <= 0) {
      return { monthlyInstallment: 0, futureValue: 0, totalAmount: 0 };
    }

    // Trade Profit: Total Profit = Principal × Profit Rate × Time
    const totalProfit = financeAmount * (monthlyPercentage / 100) * totalMonths;
    const futureValue = financeAmount + totalProfit;

    // Monthly Installment = Total Amount / Total Months
    const monthlyInstallment = futureValue / totalMonths;

    // Total amount = upfront + future value
    const upfront = parseFloat(formData.upfront_paid) || 0;
    const totalAmount = upfront + futureValue;

    return { monthlyInstallment, futureValue, totalAmount };
  };

  const previewAmounts = getPreviewAmounts();

  const loadCustomers = async () => {
    try {
      const response = await getCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) newErrors.customer_id = "Customer is required";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.total_price || parseFloat(formData.total_price) <= 0) {
      newErrors.total_price = "Total price must be greater than 0";
    }
    if (!formData.upfront_paid || parseFloat(formData.upfront_paid) < 0) {
      newErrors.upfront_paid = "Upfront payment cannot be negative";
    }
    if (parseFloat(formData.upfront_paid) >= parseFloat(formData.total_price)) {
      newErrors.upfront_paid = "Upfront payment must be less than total price";
    }
    if (!formData.monthly_percentage || parseFloat(formData.monthly_percentage) < 0) {
      newErrors.monthly_percentage = "Monthly profit must be 0 or greater";
    }
    if (!formData.total_months || parseInt(formData.total_months) <= 0) {
      newErrors.total_months = "Total months must be greater than 0";
    }
    if (!formData.start_date) newErrors.start_date = "Start date is required";

    // Ensure we have enough available funds to finance this amount
    const financeAmount = parseFloat(formData.finance_amount) || 0;
    if (financeAmount > 0 && availableFunds !== null && financeAmount > availableFunds) {
      newErrors.finance_amount = `Insufficient funds. Finance amount ($${financeAmount.toLocaleString()}) exceeds available funds ($${availableFunds.toLocaleString()}).`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const financeAmount = parseFloat(formData.finance_amount) || 0;
  const hasInsufficientFunds = financeAmount > 0 && availableFunds !== null && financeAmount > availableFunds;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload: CreateInstallmentPlanPayload = {
        customer_id: formData.customer_id,
        title: formData.title.trim(),
        total_price: parseFloat(formData.total_price),
        upfront_paid: parseFloat(formData.upfront_paid),
        finance_amount: parseFloat(formData.finance_amount),
        monthly_percentage: parseFloat(formData.monthly_percentage),
        total_months: parseInt(formData.total_months),
        start_date: formData.start_date,
        business_model: formData.business_model,
        notes: formData.notes.trim() || undefined,
      };

      const response = await createInstallmentPlan(payload);

      if (response.success) {
        onPlanCreated();
        onClose();
        // Reset form
        setFormData({
          customer_id: "",
          title: "",
          total_price: "",
          upfront_paid: "",
          finance_amount: "",
          monthly_percentage: "",
          total_months: "",
          start_date: "",
          business_model: 'FINANCER_ONLY',
          notes: "",
        });
        setErrors({});
      } else {
        setErrors({ general: response.error || 'Failed to create plan' });
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' });
      console.error('Error creating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setErrors({});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Installment Plan</DialogTitle>
          <DialogDescription>
            Set up a new installment plan for a customer with payment schedule and terms.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {errors.general}
            </div>
          )}

          {/* Business Model Selection */}
          {/* <div className="space-y-2">
            <Label htmlFor="business_model">Business Model *</Label>
            <Select
              value={formData.business_model}
              onValueChange={(value: 'PRODUCT_OWNER' | 'FINANCER_ONLY') => 
                setFormData(prev => ({ ...prev, business_model: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRODUCT_OWNER">
                  <div className="flex flex-col">
                    <span className="font-medium">Product Owner</span>
                    <span className="text-xs text-muted-foreground">I sell the product and provide financing</span>
                  </div>
                </SelectItem>
                <SelectItem value="FINANCER_ONLY">
                  <div className="flex flex-col">
                    <span className="font-medium">Trade Financier</span>
                    <span className="text-xs text-muted-foreground">I provide Shariah-compliant trade financing for someone else&apos;s product</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {formData.business_model === 'PRODUCT_OWNER' 
                ? "Your revenue = upfront payment + all installment payments (full product price + profit)"
                : "Your revenue = profit portion only (monthly percentage on financed amount)"
              }
            </p>
          </div> */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && <p className="text-red-500 text-sm">{errors.customer_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., iPhone 15 Pro Max"
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_price">Total Price *</Label>
              <Input
                id="total_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_price}
                onChange={(e) => setFormData(prev => ({ ...prev, total_price: e.target.value }))}
                placeholder="0.00"
              />
              {errors.total_price && <p className="text-red-500 text-sm">{errors.total_price}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="upfront_paid">Upfront Payment *</Label>
              <Input
                id="upfront_paid"
                type="number"
                step="0.01"
                min="0"
                value={formData.upfront_paid}
                onChange={(e) => setFormData(prev => ({ ...prev, upfront_paid: e.target.value }))}
                placeholder="0.00"
              />
              {errors.upfront_paid && <p className="text-red-500 text-sm">{errors.upfront_paid}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="finance_amount">Finance Amount</Label>
              <Input
                id="finance_amount"
                type="number"
                step="0.01"
                value={formData.finance_amount}
                readOnly
                className={`bg-gray-50 ${hasInsufficientFunds ? "border-red-500" : ""}`}
                placeholder="Calculated automatically"
              />
              <p className="text-xs text-gray-500">
                Auto-calculated: Total Price - Upfront Payment
                {availableFunds !== null && (
                  <> · Available: <span className={hasInsufficientFunds ? "font-medium text-red-600" : "font-medium"}>${availableFunds.toLocaleString()}</span></>
                )}
              </p>
              {errors.finance_amount && <p className="text-red-500 text-sm">{errors.finance_amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_percentage">Monthly Profit (%) *</Label>
              <Input
                id="monthly_percentage"
                type="number"
                step="0.01"
                min="0"
                value={formData.monthly_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_percentage: e.target.value }))}
                placeholder="2.5"
              />
              {errors.monthly_percentage && <p className="text-red-500 text-sm">{errors.monthly_percentage}</p>}
              <p className="text-xs text-gray-500">Shariah-compliant trade profit percentage per month</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_months">Total Months *</Label>
              <Input
                id="total_months"
                type="number"
                min="1"
                value={formData.total_months}
                onChange={(e) => setFormData(prev => ({ ...prev, total_months: e.target.value }))}
                placeholder="12"
              />
              {errors.total_months && <p className="text-red-500 text-sm">{errors.total_months}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
              {errors.start_date && <p className="text-red-500 text-sm">{errors.start_date}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this installment plan..."
              rows={3}
            />
          </div>

          {/* Payment Preview Section */}
          {parseFloat(formData.finance_amount) > 0 && parseInt(formData.total_months) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-blue-900">Payment Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Monthly Installment:</span>
                  <p className="font-bold text-blue-900">
                    ${previewAmounts.monthlyInstallment.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Total Profit:</span>
                  <p className="font-bold text-blue-900">
                    ${(previewAmounts.futureValue - parseFloat(formData.finance_amount || "0")).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Customer Pays Total:</span>
                  <p className="font-bold text-blue-900">
                    ${previewAmounts.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">
                    {formData.business_model === 'PRODUCT_OWNER' ? 'Your Total Revenue:' : 'Your Profit Revenue:'}
                  </span>
                  <p className="font-bold text-green-900">
                    ${formData.business_model === 'PRODUCT_OWNER'
                      ? previewAmounts.totalAmount.toFixed(2)
                      : (previewAmounts.futureValue - parseFloat(formData.finance_amount || "0")).toFixed(2)
                    }
                  </p>
                </div>
              </div>
              <p className="text-xs text-blue-600">
                *Calculated using trade profit: Profit = {formData.finance_amount} × {formData.monthly_percentage}% × {formData.total_months}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 