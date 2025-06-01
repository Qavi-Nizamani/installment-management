import { Metadata } from "next";
import CustomersScreen from "@/components/screens/dashboard/customers/CustomersScreen";

export const metadata: Metadata = {
  title: "Customers - Installment Management",
  description: "Manage your customers and their information",
};

export default function CustomersPage() {
  return <CustomersScreen />;
} 