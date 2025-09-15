import { Metadata } from "next";
import MembersManagementScreen from "@/components/screens/dashboard/settings/members/MembersManagementScreen";

export const metadata: Metadata = {
  title: "Members Management - Installment Management",
  description: "Manage your organization members and invite new team members",
};

export default function MembersPage() {
  return <MembersManagementScreen />;
}
