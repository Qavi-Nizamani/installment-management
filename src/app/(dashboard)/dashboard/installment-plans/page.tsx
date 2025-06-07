import { Metadata } from "next";
import { InstallmentPlansScreen } from "@/components/screens/dashboard/installment-plans/InstallmentPlansScreen";

export const metadata: Metadata = {
  title: "Installment Plans - Installment Management",
  description: "Manage installment plans and track their progress",
};

export default function InstallmentPlansPage() {
  return <InstallmentPlansScreen />;
} 