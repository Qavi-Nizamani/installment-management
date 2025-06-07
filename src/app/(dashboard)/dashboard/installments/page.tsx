import { Metadata } from "next";
import { InstallmentsScreen } from "@/components/screens/dashboard/installments/InstallmentsScreen";

export const metadata: Metadata = {
  title: "Installments - Installment Management",
  description: "Track due, paid, and overdue installments across all plans",
};

export default function InstallmentsPage() {
  return <InstallmentsScreen />;
} 