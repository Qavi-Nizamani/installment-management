import { Metadata } from "next";
import LoginScreen from "@/components/screens/auth/login/LoginScreen";

export const metadata: Metadata = {
  title: "Sign In - Installment Management",
  description: "Sign in to your account to access the installment management system.",
};

export default function LoginPage() {
  return <LoginScreen />;
} 