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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, TrendingUp } from "lucide-react";
import {
  CreateCapitalEntryPayload,
  CapitalLedgerType,
} from "@/services/capital/capital.service";
import { useCapitalStore } from "@/store/capital.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CapitalEntrySchema = z
  .object({
    type: z.enum(["INVESTMENT", "WITHDRAWAL", "ADJUSTMENT"]),
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine((val) => !isNaN(parseFloat(val)), {
        message: "Amount must be a valid number",
      }),
    notes: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const amount = parseFloat(data.amount);
    if (Number.isNaN(amount)) return;

    if (data.type === "ADJUSTMENT") {
      if (amount === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "Adjustment cannot be zero",
        });
      }
      return;
    }

    if (amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amount"],
        message: "Amount must be greater than zero",
      });
    }
  });

type CapitalEntryFormData = z.infer<typeof CapitalEntrySchema>;

interface AddCapitalEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ENTRY_TYPES: { value: CapitalLedgerType; label: string }[] = [
  { value: "INVESTMENT", label: "Investment" },
  { value: "WITHDRAWAL", label: "Withdrawal" },
  { value: "ADJUSTMENT", label: "Adjustment" },
];

export default function AddCapitalEntryModal({
  open,
  onOpenChange,
}: AddCapitalEntryModalProps) {
  const [isPending, startTransition] = useTransition();
  const { error, createEntry, fetchEntries, fetchStats } = useCapitalStore();

  const form = useForm<CapitalEntryFormData>({
    resolver: zodResolver(CapitalEntrySchema),
    defaultValues: {
      type: "INVESTMENT",
      amount: "",
      notes: "",
    },
  });

  const onSubmit = (data: CapitalEntryFormData) => {
    startTransition(async () => {
      try {
        const payload: CreateCapitalEntryPayload = {
          type: data.type as CapitalLedgerType,
          amount: parseFloat(data.amount),
          notes: data.notes || undefined,
        };

        const success = await createEntry(payload);

        if (success) {
          toast.success("Entry added successfully!");
          form.reset({ type: "INVESTMENT", amount: "", notes: "" });
          onOpenChange(false);
          await fetchEntries();
          await fetchStats();
        }
      } catch (error) {
        console.error("Error creating capital entry:", error);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset({ type: "INVESTMENT", amount: "", notes: "" });
      onOpenChange(false);
    }
  };

  const selectedType = form.watch("type");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Add Capital Entry
          </DialogTitle>
          <DialogDescription>
            Record an investment, withdrawal, or adjustment to your capital
            ledger. Adjustments can be positive or negative.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entry type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ENTRY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (USD) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={selectedType === "ADJUSTMENT" ? undefined : "0"}
                      placeholder={
                        selectedType === "ADJUSTMENT"
                          ? "e.g. -100.00 or 100.00"
                          : "0.00"
                      }
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes (e.g. reason for adjustment)"
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

            {/* show error message if there is an error */}
            {error && (
              <div className={cn("bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm")}>
                {error.includes('NO_ACTIVE_SUBSCRIPTION') ? "You don't have an active subscription. Please subscribe to add capital entries." : error}
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
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Entry
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
