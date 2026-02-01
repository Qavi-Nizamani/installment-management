import { Metadata } from "next";
import CapitalScreen from "@/components/screens/dashboard/capital/CapitalScreen";

export const metadata: Metadata = {
  title: "Capital - Installment Management",
  description: "Track investments, withdrawals, and adjustments to your business capital",
};

export default function CapitalPage() {
  return <CapitalScreen />;
}
