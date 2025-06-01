import { Metadata } from "next";
import SetupWorkspaceScreen from "@/components/screens/onboarding/setup-workspace/SetupWorkspaceScreen";

export const metadata: Metadata = {
  title: "Setup Workspace | Installment Management",
  description: "Create your workspace to get started with managing customers and installments",
};

export default function SetupWorkspacePage() {
  return <SetupWorkspaceScreen />;
} 