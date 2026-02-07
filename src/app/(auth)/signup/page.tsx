import { Metadata } from "next";
import SignupScreen from "@/components/screens/auth/signup/SignupScreen";

export const metadata: Metadata = {
  title: "Sign Up - Installment Management",
  description: "Create a new account to access the installment management system.",
};

export default function SignupPage() {
  return <SignupScreen />;
} 