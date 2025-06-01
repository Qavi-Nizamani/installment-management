import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";

export function OverdueAlert() {
  // In a real app, this would come from props or a data fetch
  const overdueCount = 5; // This would be dynamic in real implementation
  const overdueAmount = 2450.75;

  // For demo purposes, showing the alert. In real app, this would be:
  // if (overdueCount === 0) return null;

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">
        Overdue Payments Alert
      </AlertTitle>
      <AlertDescription className="text-red-700">
        <div className="flex items-center justify-between mt-2">
          <div>
            You have <strong>{overdueCount} overdue installments</strong> totaling{" "}
            <strong>${overdueAmount.toLocaleString()}</strong>. 
            Please follow up with customers to collect these payments.
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            View Details
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
} 