import { Metadata } from "next";
import ForgotPasswordScreen from "@/components/screens/auth/forgot-password/ForgotPasswordScreen";

export const metadata: Metadata = {
  title: "Forgot Password - Installment Management",
  description: "Reset your password to regain access to your account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
} 