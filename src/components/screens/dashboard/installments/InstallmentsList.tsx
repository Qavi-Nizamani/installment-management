import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Calendar,
  Phone
} from "lucide-react";
import { useState } from "react";
import { markAsPaid, markAsPending } from "@/services/installments/installments.service";
import type { Installment, InstallmentStatus } from "@/types/installments/installments.types";
import { INSTALLMENT_STATUS_CONFIGS } from "@/types/installments/installments.types";
import { fmtCurrency } from "@/components/utils/format";
import { useUserStore } from "@/store/user.store";

interface InstallmentsListProps {
  installments: Installment[];
  loading: boolean;
  onInstallmentUpdated: () => void;
}

const getStatusIcon = (status: InstallmentStatus) => {
  switch (status) {
    case "PAID":
      return CheckCircle2;
    case "PENDING":
      return Clock;
    case "OVERDUE":
      return AlertCircle;
    default:
      return Clock;
  }
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const isOverdue = (installment: Installment): boolean => {
  return installment.status === 'OVERDUE' ||
    (installment.status === 'PENDING' && new Date(installment.due_date) < new Date());
};

const isUpcoming = (installment: Installment): boolean => {
  const dueDate = new Date(installment.due_date);
  const today = new Date();
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  return installment.status === 'PENDING' &&
    dueDate >= today &&
    dueDate <= weekFromNow;
};

export function InstallmentsList({
  installments,
  loading,
  onInstallmentUpdated
}: InstallmentsListProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const tenantId = useUserStore((state) => state.tenant?.id);

  const handleMarkAsPaid = (installment: Installment) => {
    setSelectedInstallment(installment);
    setAmountPaid(installment.amount_due.toString());
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInstallment) return;

    const parsedAmount = parseFloat(amountPaid);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      // Could add validation feedback here in the future
      return;
    }

    try {
      setIsUpdating(true);
      const amountDue = selectedInstallment.amount_due;
      let noteDetail = '';
      if (parsedAmount < amountDue) {
        noteDetail = ` (partial payment - ${fmtCurrency(amountDue - parsedAmount)} remaining on this installment)`;
      } else if (parsedAmount > amountDue) {
        noteDetail = ` (overpayment - ${fmtCurrency(parsedAmount - amountDue)})`;
      }

      if (!tenantId) {
        console.error("Tenant context required");
        return;
      }
      const response = await markAsPaid(selectedInstallment.id, {
        amount_paid: parsedAmount,
        paid_on: new Date().toISOString().split('T')[0],
        notes: `Payment of ${fmtCurrency(parsedAmount)} recorded from installments page${noteDetail}`
      }, tenantId);

      if (response.success) {
        onInstallmentUpdated();
        setPaymentDialogOpen(false);
        setSelectedInstallment(null);
        setAmountPaid('');
      } else {
        console.error('Failed to record payment:', response.error);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsPending = async (installmentId: string) => {
    try {
      setIsUpdating(true);
      if (!tenantId) {
        console.error("Tenant context required");
        return;
      }
      const response = await markAsPending(
        installmentId,
        tenantId,
        'Marked as pending from installments page',
      );

      if (response.success) {
        onInstallmentUpdated();
      } else {
        console.error('Failed to mark as pending:', response.error);
      }
    } catch (error) {
      console.error('Error marking as pending:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Installments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan Title</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Remaining Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(8)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (installments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Installments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <DollarSign className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No installments found</h3>
            <p className="text-gray-600">
              Installments will appear here once installment plans are created.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Installments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan Title</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Remaining Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((installment) => {
                const statusConfig = INSTALLMENT_STATUS_CONFIGS[installment.status];
                const StatusIcon = getStatusIcon(installment.status);
                const customerName = installment.customer?.name || 'Unknown Customer';
                const customerInitials = getInitials(customerName);
                const rowOverdue = isOverdue(installment);
                const rowUpcoming = isUpcoming(installment);

                return (
                  <TableRow
                    key={installment.id}
                    className={`
                      ${rowOverdue ? 'bg-red-50 border-red-200' : ''}
                      ${rowUpcoming ? 'bg-blue-50 border-blue-200' : ''}
                    `}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`/avatars/${customerInitials.toLowerCase()}.png`} />
                          <AvatarFallback className="text-xs">
                            {customerInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customerName}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {installment.customer?.phone || 'No phone'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">{installment.plan_title}</div>
                      <div className="text-sm text-muted-foreground">
                        Installment #{installment.installment_number}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        {formatDate(installment.due_date)}
                      </div>
                      {rowOverdue && installment.days_overdue && (
                        <div className="text-sm text-red-600">
                          {installment.days_overdue} days overdue
                        </div>
                      )}
                      {rowUpcoming && (
                        <div className="text-sm text-blue-600">
                          Due soon
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">
                        {fmtCurrency(installment.amount_due)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-green-600">
                        {fmtCurrency(installment.amount_paid)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className={`font-medium ${(installment.remaining_due || 0) > 0 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                        {fmtCurrency(installment.remaining_due || 0)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={statusConfig.variant}
                        className={`flex items-center space-x-1 ${statusConfig.bgColor} ${statusConfig.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusConfig.label}</span>
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={isUpdating}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {installment.status !== 'PAID' && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsPaid(installment)}
                              className="text-green-600"
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                          )}

                          {installment.status === 'PAID' && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsPending(installment.id)}
                              className="text-yellow-600"
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Mark as Pending
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={paymentDialogOpen} onOpenChange={(open) => {
        setPaymentDialogOpen(open);
        if (!open) {
          setSelectedInstallment(null);
          setAmountPaid('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Record Payment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div>
                  Record payment for this installment. The installment will be marked as PAID regardless of the amount.
                </div>

                <div className="space-y-2 text-sm">
                  <div><strong>Customer:</strong> {selectedInstallment?.customer?.name}</div>
                  <div><strong>Plan:</strong> {selectedInstallment?.plan_title}</div>
                  <div><strong>Amount Due:</strong> {fmtCurrency(selectedInstallment?.amount_due ?? 0)}</div>
                  <div><strong>Due Date:</strong> {selectedInstallment?.due_date && formatDate(selectedInstallment.due_date)}</div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="amount-paid" className="text-sm font-medium text-gray-700">
                    Amount Paid
                  </label>
                  <Input
                    id="amount-paid"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="Enter amount paid"
                    className="w-full"
                    disabled={isUpdating}
                  />
                  {selectedInstallment && parseFloat(amountPaid) > 0 && (
                    <div className="text-xs space-y-1">
                      {parseFloat(amountPaid) >= selectedInstallment.amount_due ? (
                        <p className="text-green-600">
                          ✅ This installment will be marked as <strong>PAID</strong>
                        </p>
                      ) : null}
                      {parseFloat(amountPaid) > selectedInstallment.amount_due ? (
                        <p className="text-blue-600">
                          📈 <strong>Overpayment:</strong> {fmtCurrency(parseFloat(amountPaid) - selectedInstallment.amount_due)}
                        </p>
                      ) : parseFloat(amountPaid) < selectedInstallment.amount_due ? (
                        <p className="text-amber-600">
                          📋 <strong>Partial payment:</strong> {fmtCurrency(selectedInstallment.amount_due - parseFloat(amountPaid))} will remain due on this installment. Status stays overdue until fully paid.
                        </p>
                      ) : (
                        <p className="text-green-600">
                          💯 <strong>Full payment</strong> - exact amount due
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              disabled={isUpdating || !amountPaid || parseFloat(amountPaid) <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? "Processing..." : "Record Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 