import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { useState } from "react";
import { deleteInstallmentPlan } from "@/services/installment-plans/installmentPlans.service";
import type { InstallmentPlan } from "@/types/installment-plans";

interface InstallmentPlansListProps {
  plans: InstallmentPlan[];
  loading: boolean;
  onPlanUpdated: () => void;
  onPlanDeleted: () => void;
  onPlanEdit?: (plan: InstallmentPlan) => void;
  onPlanView?: (plan: InstallmentPlan) => void;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return {
        variant: "secondary" as const,
        icon: Clock,
        iconColor: "text-blue-600",
      };
    case "COMPLETED":
      return {
        variant: "default" as const,
        icon: CheckCircle2,
        iconColor: "text-green-600",
      };
    case "OVERDUE":
      return {
        variant: "destructive" as const,
        icon: AlertCircle,
        iconColor: "text-red-600",
      };
    default:
      return {
        variant: "outline" as const,
        icon: Clock,
        iconColor: "text-gray-600",
      };
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

export function InstallmentPlansList({ 
  plans, 
  loading,
  onPlanDeleted,
  onPlanEdit,
  onPlanView,
}: InstallmentPlansListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<InstallmentPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (plan: InstallmentPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    try {
      setIsDeleting(true);
      const response = await deleteInstallmentPlan(planToDelete.id);
      
      if (response.success) {
        onPlanDeleted();
        setDeleteDialogOpen(false);
        setPlanToDelete(null);
      } else {
        // Handle error - you might want to show a toast notification
        console.error('Failed to delete plan:', response.error);
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (plan: InstallmentPlan) => {
    if (onPlanEdit) {
      onPlanEdit(plan);
    }
  };

  const handleViewClick = (plan: InstallmentPlan) => {
    if (onPlanView) {
      onPlanView(plan);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Installment Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                {/* <TableHead>Business Model</TableHead> */}
                <TableHead>Total Price</TableHead>
                <TableHead>Total Profit</TableHead>
                <TableHead>Monthly Amount</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>My Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
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

  if (plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Installment Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <Clock className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No installment plans found</h3>
            <p className="text-gray-600">
              Get started by creating your first installment plan.
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
          <CardTitle>Installment Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                {/* <TableHead>Business Model</TableHead> */}
                <TableHead>Total Price</TableHead>
                <TableHead>Total Profit</TableHead>
                <TableHead>Monthly Amount</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>My Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => {
                const statusConfig = getStatusConfig(plan.status || 'ACTIVE');
                const StatusIcon = statusConfig.icon;
                const customerName = plan.customer?.name || 'Unknown Customer';
                const customerInitials = getInitials(customerName);

                return (
                  <TableRow key={plan.id}>
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
                          <div className="text-sm text-muted-foreground">
                            {plan.customer?.phone || 'No phone'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium">{plan.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {plan.monthly_percentage}% profit
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">
                        {plan.business_model === 'PRODUCT_OWNER' ? 'Product Owner' : 'Financer Only'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.business_model === 'PRODUCT_OWNER' 
                          ? 'Full revenue' 
                          : 'Profit only'
                        }
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium">
                        ${plan.total_price.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${plan.upfront_paid.toLocaleString()} upfront
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-blue-600">
                        ${(plan.total_interest || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Trade profit
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium">
                        ${(plan.monthly_amount || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.total_months} months
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium">
                        {plan.months_paid || 0}/{plan.total_months}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.total_months > 0 
                          ? (((plan.months_paid || 0) / plan.total_months) * 100).toFixed(1)
                          : 0}% paid
                      </div>
                    </TableCell>
                    
                    {/* <TableCell>
                      <div className="font-medium text-green-600">
                        ${(plan.my_revenue || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.business_model === 'PRODUCT_OWNER' ? 'total earned' : 'profit earned'}
                      </div>
                    </TableCell> */}
                    
                    <TableCell>
                      <Badge variant={statusConfig.variant} className="flex items-center space-x-1">
                        <StatusIcon className="w-3 h-3" />
                        <span>{plan.status}</span>
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewClick(plan)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClick(plan)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Plan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(plan)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Plan
                          </DropdownMenuItem>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Installment Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the installment plan &quot;{planToDelete?.title}&quot;? 
              This action cannot be undone and will also delete all associated installment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 