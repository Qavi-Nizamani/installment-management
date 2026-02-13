"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, UserPlus } from "lucide-react";
import { CreateCustomerPayload } from "@/services/customers/customers.service";
import { useCustomersStore } from "@/store/customers.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CustomerSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  phone: z.string()
    .optional()
    .or(z.literal(""))
    .transform(val => val === "" ? undefined : val)
    .refine(val => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val), {
      message: "Please enter a valid phone number"
    }),
  address: z.string()
    .optional()
    .or(z.literal(""))
    .transform(val => val === "" ? undefined : val),
  national_id: z.string()
    .optional()
    .or(z.literal(""))
    .transform(val => val === "" ? undefined : val)
    .refine(val => !val || val.length >= 3, {
      message: "National ID must be at least 3 characters if provided"
    }),
});

interface AddCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCustomerModal({ open, onOpenChange }: AddCustomerModalProps) {
  const [isPending, startTransition] = useTransition();
  const { error, createNewCustomer, fetchCustomers, fetchCustomerStats } = useCustomersStore();

  const form = useForm<CreateCustomerPayload>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      national_id: "",
    },
  });

  const onSubmit = (data: CreateCustomerPayload) => {
    startTransition(async () => {
      try {
        const success = await createNewCustomer(data);

        if (success) {
          toast.success("Customer created successfully!");
          form.reset();
          onOpenChange(false);

          // Refresh data
          await fetchCustomers();
          await fetchCustomerStats();
        }
      } catch {
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New Customer
          </DialogTitle>
          <DialogDescription>
            Create a new customer profile. All fields except name are optional.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter customer's full name"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+1 (555) 123-4567"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter customer's address"
                      className="resize-none"
                      rows={3}
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="national_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID / SSN</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123-45-6789"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            {error && (
              <div className={cn("bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm")}>
                {error.includes('NO_ACTIVE_SUBSCRIPTION') ? "You don't have an active subscription. Please subscribe to create customers." : error}
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Customer
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 