import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import EmailVerifyScreen from "@/components/screens/auth/email-verify/EmailVerifyScreen";

export default function EmailVerifyPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <EmailVerifyScreen />
    </Suspense>
  );
}

function VerifyEmailFallback() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}
