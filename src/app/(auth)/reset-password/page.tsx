import { Metadata } from "next";
import ResetPasswordScreen from "@/components/screens/auth/reset-password/ResetPasswordScreen";

export const metadata: Metadata = {
  title: "Set new password - Installment Management",
  description: "Set a new password for your account.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordScreen />;
}
